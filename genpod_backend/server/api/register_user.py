from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

DB_PATH = os.getenv("DB_PATH")
if not DB_PATH:
    raise RuntimeError("❌ DB_PATH is not set in .env")

def get_db_connection():
    return sqlite3.connect(DB_PATH)

@router.post("/users/register")
async def register_user(req: Request):
    conn = None
    try:
        data = await req.json()

        provider = data.get("provider", "").strip().lower()
        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()

        if not provider or not username or not email:
            return JSONResponse(
                content={"ok": False, "message": "Missing provider, username, or email"},
                status_code=400
            )

        user_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Ensure new table with proper schema
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                user_email TEXT NOT NULL UNIQUE,
                user_provider TEXT NOT NULL,
                user_username TEXT NOT NULL,
                user_created_at TEXT NOT NULL
            );
        """)

        # Check if user exists
        cursor.execute("SELECT user_provider FROM users WHERE user_email = ?", (email,))
        row = cursor.fetchone()

        if row:
            existing_provider = row[0].strip().lower()
            if existing_provider != provider:
                return JSONResponse(
                    content={
                        "ok": False,
                        "message": (
                            f'This email was originally registered using "{existing_provider}". '
                            f'Please sign in using that provider.'
                        ),
                        "provider": existing_provider
                    },
                    status_code=409
                )
            return JSONResponse(
                content={"ok": False, "message": "Email already registered"},
                status_code=409
            )

        # Insert new user
        cursor.execute("""
            INSERT INTO users (user_id, user_email, user_provider, user_username, user_created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, email, provider, username, created_at))
        conn.commit()

        return JSONResponse(
            content={
                "ok": True,
                "message": "User registered successfully",
                "user_id": user_id
            },
            status_code=201
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            content={"ok": False, "message": f"Internal server error: {str(e)}"},
            status_code=500
        )
    finally:
        if conn:
            conn.close()