from fastapi import APIRouter, Request
import sqlite3
from core.config import DB_PATH

router = APIRouter()

@router.post("/tasks/delete")
async def delete_task(request: Request):
    data = await request.json()
    task_id = data.get("task_id")
    print(data)

    if not task_id:
        return {"ok": False, "message": "Missing task_id"}

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE task_id = ?", (task_id,))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "message": str(e)}
    finally:
        conn.close()