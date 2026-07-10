#!/usr/bin/env python3
"""Export current CMS database to data/content.json backup."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

import db  # noqa: E402

OUT = ROOT / "data" / "content.json"

if __name__ == "__main__":
    data = db.read_content()
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Exported to {OUT}")
