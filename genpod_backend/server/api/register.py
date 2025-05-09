from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import uuid
from datetime import datetime
from typing import Optional

router = APIRouter()

DB_PATH = "/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_backend/users.db"

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def validate_input(data: dict) -> tuple[bool, str]:
    """Validate registration input data."""
    required_fields = ["provider", "first_name", "last_name"]
    for field in required_fields:
        if not data.get(field):
            return False, f"Missing required field: {field}"

    if not data.get("email") and not data.get("phone"):
        return False, "Either email or phone is required"

    if data.get("phone") and not data["phone"].startswith("+"):
        return False, "Phone number must start with country code (e.g., +1)"

    return True, ""

@router.post("/users/register")
async def register_user(req: Request):
    conn = None
    try:
        data = await req.json()
        
        # Validate input
        is_valid, error_message = validate_input(data)
        if not is_valid:
            return JSONResponse(
                content={"ok": False, "message": error_message},
                status_code=400
            )

        # Normalize provider
        provider = data["provider"].lower()
        if provider == "firebase-otp":
            provider = "phone"

        # Generate user data
        user_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Ensure table exists with proper constraints
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT,
                phone TEXT UNIQUE,
                provider TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(email, provider)
            );
        """)

        # Check for existing phone number
        if data.get("phone"):
            cursor.execute("SELECT 1 FROM users WHERE phone = ?", (data["phone"],))
            if cursor.fetchone():
                return JSONResponse(
                    content={"ok": False, "message": "Phone number already registered"},
                    status_code=409
                )

        # Check for existing email + provider combination
        if data.get("email"):
            cursor.execute(
                "SELECT 1 FROM users WHERE email = ? AND provider = ?",
                (data["email"], provider)
            )
            if cursor.fetchone():
                return JSONResponse(
                    content={"ok": False, "message": "Email already registered with this provider"},
                    status_code=409
                )

        # Insert new user
        cursor.execute("""
            INSERT INTO users (id, email, phone, provider, first_name, last_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            data.get("email"),
            data.get("phone"),
            provider,
            data["first_name"],
            data["last_name"],
            created_at
        ))
        
        conn.commit()

        return JSONResponse(
            content={
                "ok": True,
                "message": "User registered successfully",
                "user_id": user_id
            }
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