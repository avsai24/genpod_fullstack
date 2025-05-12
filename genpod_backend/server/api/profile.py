
from fastapi import APIRouter
import sqlite3
from core.config import DB_PATH

router = APIRouter()

@router.get("/users/me")
def get_user_profile(email: str = None, phone: str = None, provider: str = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if phone:
        cursor.execute("""
            SELECT id, first_name, last_name FROM users 
            WHERE phone = ? AND provider IN (?, 'firebase-otp', 'phone')
        """, (phone, provider))
    elif email:
        cursor.execute("SELECT id, first_name, last_name FROM users WHERE email = ? AND provider = ?", (email, provider))
    else:
        return {"ok": False, "message": "Missing identifier"}

    row = cursor.fetchone()
    conn.close()

    if row:
        return {"ok": True, "id": row[0], "first_name": row[1], "last_name": row[2]}
    else:
        return {"ok": False, "message": "User not found"}