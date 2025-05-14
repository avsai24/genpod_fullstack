from fastapi import APIRouter, Request
from pydantic import BaseModel
import sqlite3
from core.config import DB_PATH

router = APIRouter()

class DeleteProjectRequest(BaseModel):
    user_id: str
    project_name: str

@router.post("/projects/delete")
async def delete_project(request: DeleteProjectRequest):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM projects WHERE user_id = ? AND project_name = ?",
            (request.user_id, request.project_name)
        )
        conn.commit()
        conn.close()

        return { "ok": True, "message": "Project deleted successfully." }

    except Exception as e:
        return { "ok": False, "message": str(e) }