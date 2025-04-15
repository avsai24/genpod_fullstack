from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import sqlite3
import re

from ..crypto_utils import encrypt_token
from ..crypto_utils import decrypt_token

router = APIRouter()

DB_PATH = "settings.db"

class SettingsInput(BaseModel):
    user_id: str  # For now, pass a static value like "default_user"
    platform_name: str
    access_token: str

@router.post("/settings")
def save_settings(data: SettingsInput):
    # ✅ Step 1: Validate access token
    if not re.match(r"^gh[pousr]_[A-Za-z0-9]{36}$", data.access_token):
        raise HTTPException(status_code=400, detail="Invalid GitHub PAT format")

    # ✅ Step 2: Encrypt the access token
    encrypted = encrypt_token(data.access_token)

    # ✅ Step 3: Save to SQLite (upsert by user_id)
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Check if user already has a row
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
        raise HTTPException(status_code=500, detail=f"DB Error: {str(e)}")

    finally:
        conn.close()


@router.get("/settings")
def get_settings(user_id: str = "default_user"):
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
            return {"message": "No settings found", "settings": None}

        platform_name, encrypted_token = row
        decrypted_token = decrypt_token(encrypted_token)

        return {
            "settings": {
                "platform_name": platform_name,
                "access_token": decrypted_token  # ⚠️ Mask on frontend if needed
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    finally:
        conn.close()