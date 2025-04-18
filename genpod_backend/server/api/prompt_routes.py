from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import sqlite3
from ..crypto_utils import encrypt_token, decrypt_token  # Reusing Fernet logic

router = APIRouter()

DB_PATH = "/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_backend/settings.db"

class PromptInput(BaseModel):
    user_id: str
    prompt: str

@router.get("/prompts")
def get_prompt(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT yaml_prompt FROM prompts WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()

        if row:
            return { "prompt": row[0] }
        return { "prompt": "" }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    finally:
        conn.close()


@router.post("/prompts")
def save_prompt(data: PromptInput):
    print("📥 Saving prompt for user:", data.user_id)
    print("📄 Prompt content:\n", data.prompt)

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM prompts WHERE user_id = ?", (data.user_id,))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE prompts
                SET yaml_prompt = ?
                WHERE user_id = ?
            """, (data.prompt, data.user_id))
        else:
            cursor.execute("""
                INSERT INTO prompts (user_id, yaml_prompt)
                VALUES (?, ?)
            """, (data.user_id, data.prompt))

        conn.commit()
        return { "status": "success" }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    finally:
        conn.close()