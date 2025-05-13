from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
DB_PATH = os.getenv("DB_PATH")

if not DB_PATH:
    raise RuntimeError("❌ DB_PATH is not set in .env")

def get_db_connection():
    return sqlite3.connect(DB_PATH)

@router.post("/users/check")
async def check_user(req: Request):
    conn = None
    try:
        data = await req.json()

        email = data.get("email", "").strip().lower()
        phone = data.get("phone", "").strip()
        provider = data.get("provider", "").strip().lower()

        if not provider:
            return JSONResponse(
                content={"ok": False, "message": "Missing provider"},
                status_code=400
            )

        auth_id = (phone or email or '').strip().lower()
        if not auth_id:
            return JSONResponse(
                content={"ok": False, "message": "Missing phone or email"},
                status_code=400
            )

        print("📨 [CHECK_USER] Received auth_id:", auth_id)
        print("🛠️ provider:", provider)

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id, provider FROM users WHERE auth_id = ?", (auth_id,))
        row = cursor.fetchone()
        print("🔍 [CHECK_USER] DB result:", row)

        if row:
            stored_provider = row[1].strip().lower()
            if stored_provider == provider:
                return JSONResponse(
                    content={
                        "ok": True,
                        "message": "User found",
                        "provider": stored_provider,
                    },
                    status_code=200
                )
            else:
                return JSONResponse(
                    content={
                        "ok": False,
                        "message": (
                            f'You tried signing in as "{auth_id}" via {provider}, '
                            f'but your account was originally created using "{stored_provider}". '
                            "Please try again using the original provider."
                        )
                    },
                    status_code=409
                )

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