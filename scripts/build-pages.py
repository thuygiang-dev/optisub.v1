#!/usr/bin/env python3
"""Tạo index.html cho từng đường dẫn của app (app/goi/, app/lich/, …) từ app/index.html.

GitHub Pages là host tĩnh: mỗi URL cần một tệp index.html có thật thì tải lại trang
hay mở link trực tiếp mới không bị 404. Các tệp này chỉ khác app/index.html ở số "../".

Chạy lại mỗi khi sửa app/index.html:   python3 scripts/build-pages.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Giữ khớp với TAB_PATH / SUB_PATH trong js/router.js
ROUTES = [
    "tong-quan",
    "goi",
    "lich",
    "ban-be",
    "sinh-vien",
    "sinh-vien/hoc-phi",
    "sinh-vien/chia-tien",
    "sinh-vien/muon-tra",
]
NOTE = "<!-- Tạo tự động từ app/index.html bởi scripts/build-pages.py — đừng sửa trực tiếp -->\n"

shell = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
doctype, rest = shell.split("\n", 1)
for route in ROUTES:
    up = "../" * (route.count("/") + 2)
    html = re.sub(r'(href|src)="\.\./', lambda m: f'{m.group(1)}="{up}', rest)
    out = ROOT / "app" / route / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doctype + "\n" + NOTE + html, encoding="utf-8")
    print(f"✓ app/{route}/")
