"""CMS content persistence — PostgreSQL on Render, SQLite locally."""

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

CONTENT_ID = "main"
BASE_DIR = Path(__file__).parent
DEFAULT_CONTENT_FILE = BASE_DIR / "data" / "content.json"
SQLITE_PATH = BASE_DIR / "data" / "cms.db"


def _utc_now():
    return datetime.now(timezone.utc).isoformat()


def _database_url():
    url = os.environ.get("DATABASE_URL", "").strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def _connect_sqlite():
    SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(SQLITE_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _connect_postgres():
    import psycopg2
    import psycopg2.extras

    conn = psycopg2.connect(_database_url())
    psycopg2.extras.register_default_jsonb(conn)
    return conn


def get_backend():
    return "postgres" if _database_url() else "sqlite"


def init_db():
    backend = get_backend()
    if backend == "postgres":
        conn = _connect_postgres()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS site_content (
                        id TEXT PRIMARY KEY,
                        data JSONB NOT NULL,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            conn.commit()
        finally:
            conn.close()
    else:
        conn = _connect_sqlite()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS site_content (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()


def _load_default_content():
    with open(DEFAULT_CONTENT_FILE, encoding="utf-8") as f:
        return json.load(f)


def _seed_from_file():
    data = _load_default_content()
    write_content(data)
    return data


def read_content():
    backend = get_backend()
    if backend == "postgres":
        conn = _connect_postgres()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT data FROM site_content WHERE id = %s", (CONTENT_ID,))
                row = cur.fetchone()
                if row:
                    payload = row[0]
                    return payload if isinstance(payload, dict) else json.loads(payload)
        finally:
            conn.close()
    else:
        conn = _connect_sqlite()
        try:
            row = conn.execute(
                "SELECT data FROM site_content WHERE id = ?",
                (CONTENT_ID,),
            ).fetchone()
            if row:
                return json.loads(row["data"])
        finally:
            conn.close()

    return _seed_from_file()


def write_content(data):
    backend = get_backend()
    now = _utc_now()
    if backend == "postgres":
        from psycopg2.extras import Json

        conn = _connect_postgres()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO site_content (id, data, updated_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (id) DO UPDATE
                    SET data = EXCLUDED.data,
                        updated_at = NOW()
                    """,
                    (CONTENT_ID, Json(data)),
                )
            conn.commit()
        finally:
            conn.close()
    else:
        conn = _connect_sqlite()
        try:
            conn.execute(
                """
                INSERT INTO site_content (id, data, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    data = excluded.data,
                    updated_at = excluded.updated_at
                """,
                (CONTENT_ID, json.dumps(data, ensure_ascii=False), now),
            )
            conn.commit()
        finally:
            conn.close()

    # Keep file in sync for GitHub Pages fallback
    try:
        with open(DEFAULT_CONTENT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except OSError:
        pass
