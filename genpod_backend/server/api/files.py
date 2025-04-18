import os
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from ..services.sse_manager import sse_manager
import logging
import asyncio
from typing import AsyncGenerator, List, Dict
import json
import uuid
from ..services.file_system import FileSystemService
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter()

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
file_system = FileSystemService(str(PROJECT_ROOT))

@router.get("/files/tree")
async def get_file_tree():
    """Get the current file tree."""
    try:
        file_tree = file_system.get_file_tree()
        if not file_tree:
            raise HTTPException(status_code=404, detail="File tree is empty")
        return file_tree
    except Exception as e:
        logger.error(f"❌ Error getting file tree: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get file tree")

@router.get("/file-content")
async def get_file_content(file: str):
    """Get the content of a specific file."""
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
    """SSE endpoint for file system events."""
    async def event_generator():
        # Create a queue for this client
        queue = asyncio.Queue()
        client_id = str(uuid.uuid4())
        
        try:
            logger.info(f"📥 New SSE client connected: {client_id}")
            
            async def send_message(msg):
                try:
                    event_type = msg.get('event', 'message')
                    data = msg.get('data', '')
                    
                    # Format SSE message with explicit event type
                    sse_message = f"event: {event_type}\ndata: {data}\n\n"
                    logger.info(f"📤 Formatting SSE message for client {client_id}:\n{sse_message}")
                    
                    # Send initial message to confirm connection
                    if event_type == 'file_tree':
                        logger.info(f"📂 Sending file tree data of length: {len(data) if isinstance(data, str) else 'unknown'}")
                    elif event_type == 'file_content':
                        logger.info(f"📄 Sending file content event")
                    
                    await queue.put(sse_message)
                    logger.info(f"✅ Message queued for client {client_id}")
                except Exception as e:
                    logger.error(f"❌ Error formatting message for client {client_id}: {str(e)}", exc_info=True)
            
            # Add client to manager
            await sse_manager.add_client(queue)

            # Get query parameters
            params = dict(request.query_params)
            file_path = params.get('file')
            
            # If a specific file is requested, send its content
            if file_path:
                try:
                    content = file_system.read_file(file_path)
                    if content is not None:
                        await send_message({
                            'event': 'file_content',
                            'data': json.dumps({
                                'path': file_path,
                                'content': content
                            })
                        })
                        logger.info(f"📄 Sent initial content for file: {file_path}")
                except Exception as e:
                    logger.error(f"❌ Error sending initial file content: {str(e)}", exc_info=True)
            
            try:
                while True:
                    try:
                        # Get message from queue with timeout
                        message = await asyncio.wait_for(queue.get(), timeout=15)
                        logger.info(f"📤 Yielding message to client {client_id}")
                        yield message
                        logger.info(f"✅ Message sent to client {client_id}")
                    except asyncio.TimeoutError:
                        # Send keep-alive on timeout
                        keep_alive = "event: keep-alive\ndata: ping\n\n"
                        yield keep_alive
                        logger.info(f"💓 Keep-alive sent to client {client_id}")
                    except Exception as e:
                        logger.error(f"❌ Error processing message for client {client_id}: {str(e)}", exc_info=True)
                        continue
                    
            except asyncio.CancelledError:
                logger.info(f"📤 Client {client_id} disconnected")
            finally:
                await sse_manager.remove_client(queue)
                logger.info(f"📤 Client {client_id} removed. Total clients: {len(sse_manager._clients)}")
                
        except Exception as e:
            logger.error(f"❌ Error in event generator for client {client_id}: {str(e)}", exc_info=True)
            raise

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        },
    ) 