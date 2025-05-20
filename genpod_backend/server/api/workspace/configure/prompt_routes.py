from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3

router = APIRouter()

DB_PATH = "/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_backend/users.db"

class PromptInput(BaseModel):
    user_id: str
    prompt: str

@router.get("/prompts")
def get_prompt(user_id: str):
    """
    Retrieve YAML prompt for a given user_id.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT yaml_prompt FROM prompts WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()

        return { "ok": True, "prompt": row[0] if row else "" }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")


@router.post("/prompts")
def save_prompt(data: PromptInput):
    """
    Insert or update YAML prompt for a given user_id.
    """
    if not data.user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM prompts WHERE user_id = ?", (data.user_id,))
            exists = cursor.fetchone()

            if exists:
                cursor.execute("UPDATE prompts SET yaml_prompt = ? WHERE user_id = ?", (data.prompt, data.user_id))
            else:
                cursor.execute("INSERT INTO prompts (user_id, yaml_prompt) VALUES (?, ?)", (data.user_id, data.prompt))

            conn.commit()

        return { "ok": True, "message": "Prompt saved successfully." }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")