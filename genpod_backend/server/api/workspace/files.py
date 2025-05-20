import os
import json
import uuid
import logging
import asyncio
from pathlib import Path
from typing import List, Dict
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from ...services.file_system import FileSystemService
from ...services.sse_manager import sse_manager
from server.agent_server import workflow_state

logger = logging.getLogger(__name__)
router = APIRouter()

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
file_system = FileSystemService(str(PROJECT_ROOT))

@router.get("/files/tree")
async def get_file_tree():
    try:
        file_tree = file_system.get_file_tree()
        logger.info("📁 File tree returned via REST with %d top-level items", len(file_tree))
        if not file_tree:
            raise HTTPException(status_code=404, detail="File tree is empty")
        return [file_tree]  # ✅ Corrected
    except Exception as e:
        logger.error(f"❌ Error getting file tree: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get file tree")

@router.get("/file-content")
async def get_file_content(file: str):
    try:
        content = file_system.read_file(file)
        if content is None:
            raise HTTPException(status_code=404, detail=f"File not found: {file}")
        return {"content": content}
    except Exception as e:
        logger.error(f"❌ Error reading file {file}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to read file: {file}")

@router.get("/files/events")
async def file_system_events(request: Request):
    logger.info("🌐 New /files/events SSE stream requested")
    logger.info(f"📌 Current workflow state: {workflow_state.is_active()}")

    if not workflow_state.is_active():
        logger.info("❌ Workflow is not active. SSE connection denied.")
        return StreamingResponse(
            iter(["event: closed\ndata: {}\n\n"]),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Credentials": "true",
            },
        )

    return StreamingResponse(
        sse_manager.generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        },
    )