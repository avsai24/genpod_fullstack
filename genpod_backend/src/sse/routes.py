from fastapi import APIRouter, Request, HTTPException
from sse_starlette.sse import EventSourceResponse
import uuid
import os
import logging
from .event_manager import SSEEventManager
from ..file_watcher.watcher import GenpodFileWatcher
import asyncio
from typing import Dict

logger = logging.getLogger(__name__)

router = APIRouter()
event_manager = SSEEventManager()
watchers: Dict[str, GenpodFileWatcher] = {}

@router.get("/api/files/events")
async def file_events(request: Request):
    """SSE endpoint for file events."""
    client_id = str(uuid.uuid4())
    logger.info(f"New SSE connection request from client {client_id}")
    
    # Initialize file watcher for this client
    root_path = os.getenv("GENPOD_ROOT_PATH", ".")
    watcher = GenpodFileWatcher(root_path, client_id)
    watchers[client_id] = watcher
    watcher.start()
    logger.info(f"Started file watcher for client {client_id} at {root_path}")
    
    async def event_generator():
        try:
            # Create SSE response
            response = EventSourceResponse(
                content_type="text/event-stream",
                ping=20,  # Send ping every 20 seconds
            )
            
            # Add connection to manager
            event_manager.add_connection(client_id, response)
            logger.info(f"Added SSE connection for client {client_id}")
            
            # Keep connection alive
            while True:
                if await request.is_disconnected():
                    logger.info(f"Client {client_id} disconnected")
                    break
                logger.debug(f"Sending ping to client {client_id}")
                await response.send("ping")
                await asyncio.sleep(20)
                
        except Exception as e:
            logger.error(f"Error in event generator for client {client_id}: {e}")
        finally:
            # Clean up connection and watcher
            logger.info(f"Cleaning up resources for client {client_id}")
            event_manager.remove_connection(client_id, response)
            if client_id in watchers:
                watchers[client_id].stop()
                del watchers[client_id]
    
    return EventSourceResponse(event_generator())

@router.get("/api/files/events/last-event-id")
async def get_last_event_id(request: Request):
    """Get the last event ID for a client."""
    client_id = request.headers.get("X-Client-ID")
    if not client_id:
        logger.warning("Last event ID request without client ID")
        raise HTTPException(status_code=400, detail="Client ID required")
    
    last_event_id = event_manager.get_last_event_id(client_id)
    logger.debug(f"Retrieved last event ID for client {client_id}: {last_event_id}")
    return {"lastEventId": last_event_id} 