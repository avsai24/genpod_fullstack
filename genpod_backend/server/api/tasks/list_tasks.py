from fastapi import APIRouter, Request
import sqlite3
import uuid
from core.config import DB_PATH

router = APIRouter()

@router.get("/tasks/list")
def list_tasks(user_id: str, project_name: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT task_id, task_title, task_prompt, created_at
            FROM tasks
            WHERE user_id = ? AND project_name = ?
            ORDER BY datetime(created_at) DESC
            """,
            (user_id, project_name)
        )
        tasks = cursor.fetchall()
        conn.close()

        return {
            "ok": True,
            "tasks": [
                {
                    "task_id": row[0],
                    "task_title": row[1],
                    "task_prompt": row[2],
                    "created_at": row[3],
                }
                for row in tasks
            ]
        }

    except Exception as e:
        return { "ok": False, "message": str(e) }