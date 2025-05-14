# server/api/list_projects.py
from fastapi import APIRouter, Request, Query
from fastapi.responses import JSONResponse
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
DB_PATH = os.getenv("DB_PATH")

def get_db_connection():
    return sqlite3.connect(DB_PATH)

@router.get("/projects/list")
async def list_projects(user_id: str = Query(...)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT project_id, project_name, project_created_at FROM projects WHERE user_id = ?", (user_id,))
        rows = cursor.fetchall()

        projects = [
            {
                "project_id": row[0],
                "project_name": row[1],
                "project_created_at": row[2]
            } for row in rows
        ]

        return JSONResponse({"ok": True, "projects": projects})

    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse(
            {"ok": False, "message": f"Internal server error: {str(e)}"},
            status_code=500
        )
    finally:
        if conn:
            conn.close()