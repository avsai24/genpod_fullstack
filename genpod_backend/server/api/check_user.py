from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
DB_PATH = os.getenv("DB_PATH")

def get_db_connection():
    return sqlite3.connect(DB_PATH)

@router.post("/users/check")
async def check_user(req: Request):
    conn = None
    try:
        data = await req.json()
        email = data.get("email")
        phone = data.get("phone")
        provider = data.get("provider", "").lower()

        if not provider:
            return JSONResponse(
                content={"ok": False, "message": "Missing provider"},
                status_code=400
            )

        auth_id = phone or email
        print("📨 [BACKEND] Received auth_id:", auth_id)

        if not auth_id:
            return JSONResponse(
                content={"ok": False, "message": "Missing phone or email"},
                status_code=400
            )

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id, provider FROM users WHERE auth_id = ?", (auth_id,))
        existing = cursor.fetchone()
        print("🔍 [BACKEND] Query result:", existing)

        if existing:
            stored_provider = existing[1].lower()

            # ✅ If provider matches, return 200 with ok: True
            if stored_provider == provider:
                return JSONResponse(
                    content={
                        "ok": True,
                        "message": "User found",
                        "provider": stored_provider
                    },
                    status_code=200
                )

            # ❌ Provider mismatch
            return JSONResponse(
                content={
                    "ok": False,
                    "message": (
                        f'You tried signing in as "{auth_id}" via {provider}, '
                        "which is not the authentication method you used during signup. "
                        "Please try again using the method you originally used."
                    )
                },
                status_code=409
            )

        # ❌ No user found
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