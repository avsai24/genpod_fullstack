from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
from typing import Optional

router = APIRouter()

DB_PATH = "/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_backend/users.db"

def get_db_connection():
    return sqlite3.connect(DB_PATH)

@router.post("/users/check")
async def check_user(req: Request):
    conn = None
    try:
        data = await req.json()
        email: Optional[str] = data.get("email")
        phone: Optional[str] = data.get("phone")
        provider: str = data.get("provider", "").lower()

        if provider == "firebase-otp":
            provider = "phone"

        if not provider:
            return JSONResponse(
                content={"ok": False, "message": "Missing provider"},
                status_code=400
            )

        if not email and not phone:
            return JSONResponse(
                content={"ok": False, "message": "Missing email or phone"},
                status_code=400
            )

        conn = get_db_connection()
        cursor = conn.cursor()

        # Case 1: Phone number check (phone numbers must be unique across all providers)
        if phone:
            cursor.execute("SELECT provider FROM users WHERE phone = ?", (phone,))
            existing_phone = cursor.fetchone()
            if existing_phone:
                return JSONResponse(
                    content={
                        "ok": False,
                        "message": f"Phone number already registered with {existing_phone[0]} provider"
                    },
                    status_code=409
                )

        # Case 2: Email + Provider check (same email can be used with different providers)
        if email:
            cursor.execute(
                "SELECT provider FROM users WHERE email = ? AND provider = ?",
                (email, provider)
            )
            existing_email_provider = cursor.fetchone()
            
            if existing_email_provider:
                return JSONResponse(
                    content={"ok": True},
                    status_code=200
                )

            # Check if email exists with different provider
            cursor.execute("SELECT provider FROM users WHERE email = ?", (email,))
            existing_email = cursor.fetchone()
            if existing_email:
                return JSONResponse(
                    content={
                        "ok": False,
                        "message": f"Email already registered with {existing_email[0]} provider"
                    },
                    status_code=409
                )

        # Case 3: New user
        return JSONResponse(
            content={"ok": False, "message": "User not found"},
            status_code=404
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