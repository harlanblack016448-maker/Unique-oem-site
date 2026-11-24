"""Invariants for the 2026-11-24 factory-tech visual pass on current main."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

MATRIX = (
    ("catalog-8-cf658-card", "CF658"),
    ("catalog-kitchen-ck863-card", "CK863BLE"),
    ("catalog-bathroom-cf596-feature", "CF596"),
)


class FactoryTechVisual(unittest.TestCase):
    def test_style_keeps_occlusion_rule_and_loads_plex_mono(self):
        css = (ROOT / "assets" / "style.css").read_text(encoding="utf-8")
        self.assertIn("family=IBM+Plex+Mono", css)
        self.assertIn("--font-mono:", css)
        self.assertIn(
            ".sticky-cta.is-visible.is-occluding{opacity:0;pointer-events:none}",
            css,
        )

    def test_home_product_cards_use_existing_catalog_images(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for stem, needle in MATRIX:
            self.assertIn(f"class=\"matrix-media\"", html)
            self.assertIn(f"/assets/img/catalog/{stem}.webp?v=260910", html)
            self.assertIn(f"/assets/img/catalog/{stem}.jpg?v=260910", html)
            self.assertIn(needle, html)
            for ext in (".webp", ".jpg"):
                path = ROOT / "assets" / "img" / "catalog" / f"{stem}{ext}"
                self.assertTrue(path.is_file(), path)
                self.assertGreater(path.stat().st_size, 1000)

    def test_pages_pin_style_v32_and_keep_partials_v43(self):
        pages = (
            "index.html",
            "contact.html",
            "about.html",
            "capabilities.html",
            "privacy.html",
            "404.html",
            "products/8-electrode.html",
            "products/kitchen.html",
            "products/bathroom.html",
            "solutions/8-electrode-oem.html",
        )
        for rel in pages:
            text = (ROOT / rel).read_text(encoding="utf-8")
            self.assertIn("/assets/style.css?v=32", text, rel)
            self.assertNotIn("/assets/style.css?v=31", text, rel)
            self.assertIn("/assets/partials.js?v=43", text, rel)


if __name__ == "__main__":
    unittest.main()
