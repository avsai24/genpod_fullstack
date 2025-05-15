from fastapi import APIRouter, Request
import sqlite3
from core.config import DB_PATH

router = APIRouter()

@router.post("/tasks/rename")
async def rename_task(request: Request):
    data = await request.json()
    task_id = data.get("task_id")
    new_title = data.get("new_title")
    print(data)

    if not task_id or not new_title:
        return {"ok": False, "message": "Missing task_id or new_title"}

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE tasks
            SET task_title = ?
            WHERE task_id = ?
        """, (new_title.strip()[:100], task_id))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "message": str(e)}
    finally:
        conn.close()