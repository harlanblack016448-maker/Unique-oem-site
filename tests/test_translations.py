#!/usr/bin/env python3
"""Checks for the reviewed bilingual copy and its runtime wiring."""
from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
I18N = ROOT / "assets" / "i18n.js"


def keys_in(block: str) -> set[str]:
    return set(re.findall(r'^\s*"([^"\n]+)"\s*:', block, re.MULTILINE))


class TestReviewedTranslations(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = I18N.read_text(encoding="utf-8")
        cls.en_block, rest = cls.source.split("    zh: {", 1)
        cls.zh_block = rest.split("\n\n  // Editorial pass", 1)[0]
        cls.overlay = cls.source.split("const ZH_REFINED = {", 1)[1].split(
            "\n  const EN_REFINED", 1
        )[0]
        cls.review = (ROOT / "TRANSLATION-REVIEW.md").read_text(encoding="utf-8")

    def test_base_english_and_chinese_keys_match(self):
        self.assertEqual(keys_in(self.en_block), keys_in(self.zh_block))

    def test_refined_keys_are_existing_bilingual_keys(self):
        base_keys = keys_in(self.en_block)
        refined_keys = keys_in(self.overlay)
        self.assertTrue(refined_keys <= base_keys)
        self.assertEqual(len(refined_keys), 340)

    def test_review_covers_the_dictionary(self):
        self.assertRegex(
            self.review,
            r"审核统计：共 495 个词条；中文改写 \d+ 个；英文修订 9 个；当前页面/表单引用 \d+ 个。",
        )
        rows = [
            line
            for line in self.review.splitlines()
            if line.startswith("| ")
            and not line.startswith("| ---")
            and not line.startswith("| Key |")
        ]
        self.assertEqual(len(rows), 495)

    def test_refined_copy_removes_known_translation_errors(self):
        for phrase in ("同一屋檐下", "三种做货", "从现有平台共同研发：研发、工业设计、结构、固件、算法。"):
            self.assertNotIn(phrase, self.overlay)
        self.assertIn('"home.services.odm.d":"基于成熟产品方案，提供研发、工业设计、结构设计、固件开发与校准服务。"', self.overlay)
        self.assertIn('"home.why.4":"服务世界 500 强企业与 50 多家 OEM 客户，覆盖 100 多个国家和地区。"', self.overlay)
        self.assertIn('"nav.bathroom":"体重秤"', self.overlay)
        self.assertIn('"8.f4":"BIA 算法与高精度相关系数"', self.overlay)
        self.assertIn('"cap.partner.sub":"服务 50 多家 OEM 客户，覆盖 100 多个国家和地区，包括消费电子、可穿戴和家电领域的企业。"', self.overlay)
        self.assertIn('"privacy.4.text":"如需查阅、更正或删除您提交的询价，请邮件联系 hanhan@lefu.cc。Unique Health 产品端数据适用 App 隐私说明，不在本页范围。"', self.overlay)

    def test_page_cache_versions_follow_content_changes(self):
        pages = [
            "index.html",
            "about.html",
            "capabilities.html",
            "contact.html",
            "privacy.html",
            "404.html",
            "products/8-electrode.html",
            "products/kitchen.html",
            "products/bathroom.html",
        ]
        for rel in pages:
            text = (ROOT / rel).read_text(encoding="utf-8")
            self.assertIn("/assets/i18n.js?v=23", text, rel)
            self.assertIn("/assets/partials.js?v=25", text, rel)
        partials = (ROOT / "assets" / "partials.js").read_text(encoding="utf-8")
        self.assertIn("/assets/chat-widget.js?v=7", partials)
        self.assertIn("/assets/chat-widget.css?v=5", partials)
        chat = (ROOT / "assets" / "chat-widget.js").read_text(encoding="utf-8")
        self.assertIn("/assets/chat-widget.css?v=5", chat)
        form_pages = ("index.html", "contact.html")
        for rel in form_pages:
            text = (ROOT / rel).read_text(encoding="utf-8")
            self.assertIn("/assets/form.js?v=12", text, rel)

    def test_std_volume_options_drop_redundant_floor(self):
        form = (ROOT / "assets" / "form.js").read_text(encoding="utf-8")
        self.assertNotIn('v: "1000"', form)
        self.assertIn('v: "1000-2000"', form)
        self.assertIn('v: "500-first"', form)
        css = (ROOT / "assets" / "chat-widget.css").read_text(encoding="utf-8")
        self.assertIn("body:has(.sticky-cta.is-visible) .uschat-fab", css)
        self.assertIn("bottom: 24px;", css)

    def test_static_fallback_matches_corrected_english(self):
        bathroom = (ROOT / "products" / "bathroom.html").read_text(encoding="utf-8")
        capabilities = (ROOT / "capabilities.html").read_text(encoding="utf-8")
        self.assertIn(
            "Multiple platform and display options for different price points, global retail and private-label programs.",
            bathroom,
        )
        self.assertIn(
            "From organizational systems and in-house labs to automated lines, hardware and software OEM/ODM move together.",
            capabilities,
        )

    def test_chat_copy_uses_reviewed_chinese(self):
        chat = (ROOT / "assets" / "chat-widget.js").read_text(encoding="utf-8")
        self.assertIn("你可以咨询型号、起订量、认证或 OEM 流程", chat)
        self.assertIn("生产交期多久？", chat)
        self.assertNotIn("通常几秒内回复", chat)


if __name__ == "__main__":
    unittest.main()
