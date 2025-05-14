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
        data     = await req.json()
        email    = data.get("email", "").strip().lower()
        provider = data.get("provider", "").strip().lower()
        if not email or not provider:
            return JSONResponse(
                {"ok": False, "message": "Missing email or provider"},
                status_code=400
            )

        print("📨 [CHECK_USER] Received email:", email)
        print("🛠️ provider:", provider)

        conn   = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, user_provider, user_username FROM users WHERE user_email = ?",
            (email,),
        )
        row = cursor.fetchone()
        print("🔍 [CHECK_USER] DB result:", row)

        if row:
            db_id, stored_provider, db_username = row
            stored_provider = stored_provider.strip().lower()

            # ✅ exact‐match → return your own DB fields
            if stored_provider == provider:
                return JSONResponse(
                    {
                        "ok": True,
                        "message": "User found",
                        "user_id": db_id,
                        "username": db_username,
                        "provider": stored_provider,
                    },
                    status_code=200
                )

            # ❌ conflict → your custom message
            return JSONResponse(
                {
                    "ok": False,
                    "message": (
                        f'You tried logging in as "{email}" via {provider}, '
                        "which is not the authentication method you used during signup. "
                        "Please try again using the authentication method you used during signup."
                    )
                },
                status_code=409
            )

        # 🚫 not in DB
        return JSONResponse(
            {"ok": False, "message": "User not found"},
            status_code=404
        )

    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse(
            {"ok": False, "message": f"Internal server error: {str(e)}"},
            status_code=500
        )
    finally:
        if conn:
            conn.close()