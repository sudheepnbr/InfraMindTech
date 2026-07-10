#!/usr/bin/env python3
"""Seed or refresh CMS database from data/content.json."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

import db  # noqa: E402

if __name__ == "__main__":
    db.init_db()
    data = db.read_content()
    print(f"Database backend: {db.get_backend()}")
    print(f"Content sections loaded: {len(data)} top-level keys")
    print("OK — CMS database is ready.")
