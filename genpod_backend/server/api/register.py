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
    raise RuntimeError("DB_PATH not set in .env")

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def validate_input(data: dict) -> tuple[bool, str]:
    if not data.get("provider"):
        return False, "Missing provider"
    if not data.get("username"):
        return False, "Missing username"
    if not data.get("phone") and not data.get("email"):
        return False, "Either phone or email is required"
    return True, ""

@router.post("/users/register")
async def register_user(req: Request):
    conn = None
    try:
        data = await req.json()

        is_valid, error_message = validate_input(data)
        if not is_valid:
            return JSONResponse(content={"ok": False, "message": error_message}, status_code=400)

        provider = data["provider"]
        username = data["username"].strip().lower()
        auth_id = data.get("phone") or data.get("email")
        user_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                auth_id TEXT NOT NULL UNIQUE,
                provider TEXT NOT NULL,
                username TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)

        # Check if user with same auth_id exists
        cursor.execute("SELECT provider FROM users WHERE auth_id = ?", (auth_id,))
        row = cursor.fetchone()
        if row:
            existing_provider = row[0].lower()

            # ✅ Only apply provider mismatch error for email-based users
            if data.get("email") and existing_provider != provider:
                return JSONResponse(
                    content={
                        "ok": False,
                        "message": (
                            f'You tried signing in as "{auth_id}" via {provider}, which is not the authentication method you used during signup. '
                            "Try again using the authentication method you used during signup."
                        )
                    },
                    status_code=409
                )

            # Same provider — still block duplicate registration
            readable_id = "Phone number" if provider == "firebase-otp" else "Email"
            return JSONResponse(
                content={"ok": False, "message": f"{readable_id} already registered"},
                status_code=409
            )

        # Insert new user
        cursor.execute("""
            INSERT INTO users (id, auth_id, provider, username, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, auth_id, provider, username, created_at))
        conn.commit()

        return JSONResponse(
            content={"ok": True, "message": "User registered", "user_id": user_id}
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