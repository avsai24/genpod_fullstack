import sqlite3
from core.config import DB_PATH  # Make sure this import works

def create_users_table_if_not_exists():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            phone TEXT UNIQUE,
            email TEXT,
            provider TEXT,
            first_name TEXT,
            last_name TEXT,
            created_at TEXT
        )
    """)

    conn.commit()
    conn.close()