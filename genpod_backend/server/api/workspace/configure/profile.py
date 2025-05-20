from fastapi import APIRouter, Query
import sqlite3
from core.config import DB_PATH

router = APIRouter()

@router.get("/users/me")
def get_user_profile(user_id: str = Query(...)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT user_email, user_username, user_provider, user_created_at
        FROM users
        WHERE user_id = ?
    """, (user_id,))
    
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "ok": True,
            "user_id": user_id,
            "user_email": row[0],
            "user_username": row[1],
            "user_provider": row[2],
            "user_created_at": row[3],
        }
    else:
        return {"ok": False, "message": "User not found"}