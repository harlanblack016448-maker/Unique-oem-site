#!/usr/bin/env python3
"""Drive the shipped 8-electrode / home HTML and the JPEG files it references.

Parses the live pages (not a copy), resolves each product <img> under assets/img/,
and checks format, pixel size vs width/height, shot-grid expansion, frozen IA,
and that kitchen/bathroom assets were not overwritten.
"""
from __future__ import annotations

import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "assets" / "img"
CATALOG = ROOT / "assets" / "catalog-manifest.json"

# IA freeze: section id sequence + h1/h2 text from the pages before this photo refresh.
INDEX_SECTION_IDS = ["main", "data", "products", "programs", "process", "factory", "certs", "inquire"]
EIGHT_SECTION_IDS = ["main", "", "accuracy", "", "compare", "models", "", "programs", "specs", "faq", "inquire"]
INDEX_HEADINGS = [
    ("h1", "OEM/ODM manufacturer of 8-electrode body composition analyzers."),
    ("h2", "Capacity, accuracy, and a 16-year catalog."),
    ("h2", "Product lines, engineered for your market"),
    ("h2", "Gym, clinic, retail, or your brand."),
    ("h2", "From brief to first container."),
    ("h2", "The Longgang floor."),
    ("h2", "Marks your buyers already ask for."),
    ("h2", "Request a quote or a sample"),
]
EIGHT_HEADINGS = [
    ("h1", "8-Electrode Body Composition Analyzer"),
    ("h2", "What's in the platform"),
    ("h2", "Fat mass and muscle mass, by comparator"),
    ("h2", "4-electrode vs 8-electrode"),
    ("h2", "In production now"),
    ("h2", "Model lineup (selection)"),
    ("h2", "Gym, clinic, retail, or your brand."),
    ("h2", "Example specs — CF658BLE+WiFi"),
    ("h2", "Questions buyers ask first"),
    ("h2", "Specify this platform for your brand"),
]
CHIP_NAMES = [
    "CF658", "CF577", "CF689", "CF636", "CF625", "CF650", "CF661", "CF687", "CF669", "CF586",
]
BATHROOM_KEEP = {
    "model-cf586.jpg": (900, 1106, 59533),
    "model-cf661.jpg": (900, 1106, 81190),
}
KITCHEN_PREFIXES = ("kitchen-", "bathroom-")


def _norm_ws(text: str) -> str:
    return " ".join(text.split())


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.section_ids: list[str] = []
        self.headings: list[tuple[str, str]] = []
        self.imgs: list[dict[str, str]] = []
        self.shot_cards: list[dict] = []
        self.chips: list[str] = []
        self.hotspots: list[dict[str, str]] = []
        self._capture: str | None = None
        self._buf: list[str] = []
        self._skip = 0
        self._in_shot = False
        self._shot: dict | None = None

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag in {"script", "style"}:
            self._skip += 1
            return
        if tag == "section":
            self.section_ids.append(d.get("id", ""))
        if tag in {"h1", "h2"}:
            self._capture = tag
            self._buf = []
        if tag == "article" and "shot-card" in d.get("class", ""):
            self._in_shot = True
            self._shot = {"img": None, "h3": None}
        if tag == "img":
            src = d.get("src", "")
            if src.startswith("https://px.ads"):
                return
            rec = {
                "src": src,
                "width": d.get("width", ""),
                "height": d.get("height", ""),
                "alt": d.get("alt", ""),
            }
            self.imgs.append(rec)
            if self._in_shot and self._shot is not None:
                self._shot["img"] = rec
        if tag == "button" and "hotspot-dot" in d.get("class", ""):
            self.hotspots.append({"spot": d.get("data-spot", ""), "style": d.get("style", "")})
        if tag == "div" and d.get("class") == "m":
            self._capture = "chip-m"
            self._buf = []
        if tag == "h3" and self._in_shot:
            self._capture = "shot-h3"
            self._buf = []

    def handle_endtag(self, tag):
        if tag in {"script", "style"} and self._skip:
            self._skip -= 1
            return
        if self._capture and tag in {"h1", "h2"}:
            self.headings.append((tag, _norm_ws("".join(self._buf))))
            self._capture = None
            self._buf = []
        if self._capture == "chip-m" and tag == "div":
            self.chips.append(_norm_ws("".join(self._buf)))
            self._capture = None
            self._buf = []
        if self._capture == "shot-h3" and tag == "h3":
            if self._shot is not None:
                self._shot["h3"] = _norm_ws("".join(self._buf))
            self._capture = None
            self._buf = []
        if tag == "article" and self._in_shot:
            self.shot_cards.append(self._shot or {})
            self._in_shot = False
            self._shot = None

    def handle_data(self, data):
        if self._skip:
            return
        if self._capture:
            self._buf.append(data)


def parse(rel: str) -> Page:
    p = Page()
    p.feed((ROOT / rel).read_text(encoding="utf-8"))
    return p


def resolve_src(src: str) -> Path:
    path = unquote(urlparse(src).path)
    if path.startswith("/"):
        path = path[1:]
    return ROOT / path


class TestShippedEightElectrodePhotos(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.home = parse("index.html")
        cls.eight = parse("products/8-electrode.html")
        cls.kitchen = parse("products/kitchen.html")
        cls.bathroom = parse("products/bathroom.html")

    def test_index_section_ids_frozen(self):
        self.assertEqual(self.home.section_ids, INDEX_SECTION_IDS)

    def test_index_headings_frozen(self):
        self.assertEqual(self.home.headings, INDEX_HEADINGS)

    def test_eight_section_ids_frozen(self):
        self.assertEqual(self.eight.section_ids, EIGHT_SECTION_IDS)

    def test_eight_headings_frozen(self):
        self.assertEqual(self.eight.headings, EIGHT_HEADINGS)

    def test_model_chip_names_frozen(self):
        self.assertEqual(self.eight.chips, CHIP_NAMES)

    def test_home_hero_is_catalog_jpeg_matching_attrs(self):
        heroes = [i for i in self.home.imgs if "catalog-home-8-electrode-hero" in i["src"]]
        self.assertEqual(len(heroes), 1)
        self._assert_product_jpeg(heroes[0], min_bytes=20_000)

    def test_eight_product_images_decode_and_match_declared_pixels(self):
        product = [i for i in self.eight.imgs if i["src"].startswith("/assets/img/")]
        self.assertGreaterEqual(len(product), 5)
        for img in product:
            self._assert_product_jpeg(img, min_bytes=5_000)

    def test_replaced_hero_is_latest_catalog_cf658_scene(self):
        path = resolve_src(self.eight.imgs[0]["src"])
        self.assertEqual(path.name, "catalog-8-cf658-hero.jpg")
        data = path.read_bytes()
        self.assertGreater(len(data), 80_000)
        with Image.open(path) as im:
            self.assertEqual(im.size, (1422, 1600))
            self.assertEqual(im.format, "JPEG")

    def test_shot_grid_expanded_and_labeled_with_existing_chips(self):
        cards = self.eight.shot_cards
        self.assertGreater(len(cards), 3, "featured grid must grow past the original 3 cards")
        chip_set = set(CHIP_NAMES)
        for card in cards:
            self.assertIsNotNone(card.get("img"), msg=card)
            self.assertIsNotNone(card.get("h3"), msg=card)
            names = [p.strip() for p in card["h3"].replace("/", " ").split() if p.strip()]
            self.assertTrue(
                any(n in chip_set for n in names),
                f"shot-card {card['h3']!r} is not an existing model-chip name",
            )
            self._assert_product_jpeg(card["img"], min_bytes=5_000)

    def test_hotspots_still_three_named_spots(self):
        spots = [h["spot"] for h in self.eight.hotspots]
        self.assertEqual(sorted(spots), ["deck", "handle", "screen"])
        for h in self.eight.hotspots:
            self.assertIn("left:", h["style"])
            self.assertIn("top:", h["style"])

    def test_bathroom_model_files_not_overwritten(self):
        for name, (w, h, size) in BATHROOM_KEEP.items():
            path = IMG / name
            self.assertEqual(path.stat().st_size, size, name)
            with Image.open(path) as im:
                self.assertEqual(im.size, (w, h), name)
        # 8-electrode CF661/CF586 cards must use new files, not the bathroom slots
        eight_srcs = [urlparse(i["src"]).path for i in self.eight.imgs]
        self.assertNotIn("/assets/img/model-cf586.jpg", eight_srcs)
        self.assertNotIn("/assets/img/model-cf661.jpg", eight_srcs)

    def test_kitchen_and_bathroom_pages_still_use_their_own_photos(self):
        for page, prefixes in (
            (self.kitchen, ("kitchen-",)),
            (self.bathroom, ("bathroom-", "model-cf586", "model-cf661")),
        ):
            srcs = [urlparse(i["src"]).path for i in page.imgs if i["src"].startswith("/assets/img/")]
            self.assertTrue(srcs)
            for src in srcs:
                name = Path(src).name
                self.assertTrue(name.startswith(prefixes) or name in {"model-cf586.jpg", "model-cf661.jpg"} or name.startswith("catalog-"), name)
                self.assertTrue((ROOT / src.lstrip("/")).is_file(), src)

    def test_no_catalog_only_sku_names_on_cards(self):
        banned = {"CF2001", "CF2003", "CF2005", "CF693", "CF695", "CF579", "CF682"}
        for card in self.eight.shot_cards:
            for token in card["h3"].replace("/", " ").split():
                self.assertNotIn(token, banned)

    def test_hero_and_cards_are_traceable_in_manifest(self):
        hero = resolve_src(self.eight.imgs[0]["src"])
        card = next(c["img"] for c in self.eight.shot_cards if c["h3"] == "CF658")
        card_path = resolve_src(card["src"])
        self.assertEqual(hero.name, "catalog-8-cf658-hero.jpg")
        self.assertEqual(card_path.name, "catalog-8-cf658-card.jpg")
        manifest = json.loads(CATALOG.read_text(encoding="utf-8"))
        cf658 = [a for a in manifest["assets"] if a["model"] == "CF658" and a["format"] == "jpg"]
        self.assertEqual({a["sourcePage"] for a in cf658}, {7})
        self.assertTrue(all("260827" in a["sourcePdf"] for a in cf658))

    def test_catalog_manifest_has_all_eight_models_and_budget(self):
        manifest = json.loads(CATALOG.read_text(encoding="utf-8"))
        assets = manifest["assets"]
        models = {a["model"] for a in assets if a["role"] == "model-card" and a["format"] == "jpg" and a["model"].startswith("CF")}
        self.assertEqual(models, set(CHIP_NAMES))
        for a in assets:
            path = ROOT / "assets" / a["output"]
            self.assertTrue(path.is_file(), a["output"])
            if a["role"] == "model-card":
                self.assertLessEqual(a["bytes"], 150_000)
            if "hero" in a["role"]:
                self.assertLessEqual(a["bytes"], 350_000)

    def _assert_product_jpeg(self, img: dict[str, str], min_bytes: int) -> None:
        path = resolve_src(img["src"])
        self.assertTrue(path.is_file(), img["src"])
        self.assertGreater(path.stat().st_size, min_bytes, path.name)
        self.assertTrue(img["width"].isdigit() and img["height"].isdigit(), img)
        declared = (int(img["width"]), int(img["height"]))
        with Image.open(path) as im:
            self.assertEqual(im.format, "JPEG", path.name)
            self.assertEqual(im.size, declared, f"{path.name} pixels {im.size} != attr {declared}")


if __name__ == "__main__":
    unittest.main()
