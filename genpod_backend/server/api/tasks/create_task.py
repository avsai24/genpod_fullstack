from fastapi import APIRouter, Request
import sqlite3
import uuid
from core.config import DB_PATH
from server.agent_server import workflow_state

router = APIRouter()

@router.post("/tasks/create")
async def create_task(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    project_name = data.get("project_name")
    task_prompt = data.get("task_prompt")
    print(data)

    if not user_id or not project_name or not task_prompt:
        return {"ok": False, "message": "Missing required fields"}

    task_id = str(uuid.uuid4())
    task_title = task_prompt.strip()[:100]

    conn = None  # ✅ Always define this before the try block

    try:
        print("🔁 Activating workflow...")
        workflow_state.activate()  # This should set the internal flag
        print(f"✅ Workflow state is now: {workflow_state.is_active()}")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (task_id, user_id, project_name, task_title, task_prompt)
            VALUES (?, ?, ?, ?, ?)
        """, (task_id, user_id, project_name, task_title, task_prompt))
        conn.commit()
        return {"ok": True, "task_id": task_id}
    except Exception as e:
        return {"ok": False, "message": str(e)}
    finally:
        if conn:
            conn.close()  # ✅ Only close if it was created