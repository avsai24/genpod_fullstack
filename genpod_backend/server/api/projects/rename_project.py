from fastapi import APIRouter, Request
import sqlite3
from core.config import DB_PATH

router = APIRouter()

@router.post("/projects/rename")
async def rename_project(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    old_name = data.get("old_name")
    new_name = data.get("new_name")

    if not user_id or not old_name or not new_name:
        return {"ok": False, "message": "Missing required fields"}

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if new_name already exists
        cursor.execute(
            "SELECT 1 FROM projects WHERE user_id = ? AND project_name = ?",
            (user_id, new_name),
        )
        if cursor.fetchone():
            return {"ok": False, "message": "Project name already exists"}

        # Update the name
        cursor.execute(
            "UPDATE projects SET project_name = ? WHERE user_id = ? AND project_name = ?",
            (new_name, user_id, old_name),
        )
        conn.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "message": str(e)}
    finally:
        conn.close()