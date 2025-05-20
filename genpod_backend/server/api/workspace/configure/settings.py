from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import re
from crypto_utils import encrypt_token, decrypt_token  

router = APIRouter()

DB_PATH = "/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_backend/settings.db"

class SettingsInput(BaseModel):
    user_id: str
    platform_name: str
    access_token: str

@router.post("/settings")
def save_settings(data: SettingsInput):
    if not re.match(r"^gh[pousr]_[A-Za-z0-9]{36}$", data.access_token):
        raise HTTPException(status_code=400, detail="Invalid GitHub PAT format")

    encrypted = encrypt_token(data.access_token)

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM git_settings WHERE user_id = ?", (data.user_id,))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE git_settings
                SET platform_name = ?, encrypted_token = ?
                WHERE user_id = ?
            """, (data.platform_name, encrypted, data.user_id))
        else:
            cursor.execute("""
                INSERT INTO git_settings (user_id, platform_name, encrypted_token)
                VALUES (?, ?, ?)
            """, (data.user_id, data.platform_name, encrypted))

        conn.commit()
        return { "status": "success" }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    finally:
        conn.close()


@router.get("/settings")
def get_settings(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT platform_name, encrypted_token
            FROM git_settings
            WHERE user_id = ?
        """, (user_id,))
        row = cursor.fetchone()

        if not row:
            return { "settings": None }

        platform_name, encrypted_token = row
        decrypted = decrypt_token(encrypted_token)

        return {
            "settings": {
                "platform_name": platform_name,
                "access_token": decrypted
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    finally:
        conn.close()