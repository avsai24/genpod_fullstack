from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import uuid
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
DB_PATH = os.getenv("DB_PATH")

def get_db_connection():
    return sqlite3.connect(DB_PATH)

@router.post("/projects/create")
async def create_project(req: Request):
    conn = None
    try:
        data = await req.json()
        user_id = data.get("user_id", "").strip()
        project_name = data.get("project_name", "").strip()

        if not user_id or not project_name:
            return JSONResponse(
                {"ok": False, "message": "Missing user_id or project_name"},
                status_code=400
            )

        if len(project_name) > 20:
            return JSONResponse(
                {"ok": False, "message": "Project name must be 20 characters or fewer"},
                status_code=400
            )

        project_id = str(uuid.uuid4())
        print(f"Creating project for user {user_id} with name {project_name}")
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO projects (project_id, user_id, project_name)
            VALUES (?, ?, ?)
        """, (project_id, user_id, project_name))
        conn.commit()

        return JSONResponse({
            "ok": True,
            "message": "Project created successfully",
            "project_id": project_id
        }, status_code=201)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {"ok": False, "message": f"Internal server error: {str(e)}"},
            status_code=500
        )
    finally:
        if conn:
            conn.close()