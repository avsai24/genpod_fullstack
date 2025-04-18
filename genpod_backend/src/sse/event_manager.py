import json
import time
import uuid
import logging
from typing import Dict, List, Optional
from fastapi import HTTPException
from sse_starlette.sse import EventSourceResponse
from ..file_watcher.types import SSEEvent, FileTreeDiff, FileContentDiff

logger = logging.getLogger(__name__)

class SSEEventManager:
    def __init__(self):
        self._connections: Dict[str, List[EventSourceResponse]] = {}
        self._last_event_ids: Dict[str, str] = {}
        logger.info("Initialized SSEEventManager")

    def add_connection(self, client_id: str, response: EventSourceResponse):
        """Add a new SSE connection."""
        if client_id not in self._connections:
            self._connections[client_id] = []
        self._connections[client_id].append(response)
        logger.info(f"Added SSE connection for client {client_id}")

    def remove_connection(self, client_id: str, response: EventSourceResponse):
        """Remove an SSE connection."""
        if client_id in self._connections:
            self._connections[client_id].remove(response)
            if not self._connections[client_id]:
                del self._connections[client_id]
            logger.info(f"Removed SSE connection for client {client_id}")

    def _create_event(self, event_type: str, data: Union[FileTreeDiff, FileContentDiff]) -> SSEEvent:
        """Create a new SSE event."""
        event_id = str(uuid.uuid4())
        event = SSEEvent(
            type=event_type,
            timestamp=time.time(),
            event_id=event_id,
            data=data
        )
        logger.debug(f"Created SSE event: {event}")
        return event

    async def send_tree_diff(self, client_id: str, diff: FileTreeDiff):
        """Send a file tree diff event."""
        if client_id not in self._connections:
            logger.warning(f"No active connections for client {client_id}")
            return

        event = self._create_event("file_tree_diff", diff)
        logger.info(f"Sending tree diff to client {client_id}: {diff}")
        await self._broadcast_event(client_id, event)

    async def send_content_diff(self, client_id: str, diff: FileContentDiff):
        """Send a file content diff event."""
        if client_id not in self._connections:
            logger.warning(f"No active connections for client {client_id}")
            return

        event = self._create_event("file_content_diff", diff)
        logger.info(f"Sending content diff to client {client_id} for file {diff.path}")
        await self._broadcast_event(client_id, event)

    async def _broadcast_event(self, client_id: str, event: SSEEvent):
        """Broadcast an event to all connections for a client."""
        if client_id not in self._connections:
            return

        event_data = {
            "type": event.type,
            "timestamp": event.timestamp,
            "eventId": event.event_id,
            "data": event.data.__dict__
        }

        for response in self._connections[client_id]:
            try:
                logger.debug(f"Sending event to client {client_id}: {event_data}")
                await response.send(json.dumps(event_data))
                self.set_last_event_id(client_id, event.event_id)
            except Exception as e:
                logger.error(f"Error sending event to client {client_id}: {e}")
                self.remove_connection(client_id, response)

    def get_last_event_id(self, client_id: str) -> Optional[str]:
        """Get the last event ID for a client."""
        return self._last_event_ids.get(client_id)

    def set_last_event_id(self, client_id: str, event_id: str):
        """Set the last event ID for a client."""
        self._last_event_ids[client_id] = event_id 