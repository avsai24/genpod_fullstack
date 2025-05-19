import asyncio
import json
import logging
from typing import Dict, Set, Optional, List
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
import time
from pathlib import Path
from server.agent_server import workflow_state

logger = logging.getLogger(__name__)

class SSEManager:
    def __init__(self):
        self._clients: Set[asyncio.Queue] = set()
        self._keep_alive_interval = 15  # seconds
        self._last_keep_alive = 0
        self._project_root = Path(__file__).parent.parent.parent.parent
        self._last_file_tree = None
        logger.info("📡 Initialized SSE Manager")

    async def add_client(self, client_queue: asyncio.Queue):
        """Add a new client to the SSE manager."""
        try:
            self._clients.add(client_queue)
            logger.info(f"📥 Added SSE client. Total: {len(self._clients)}")
            
            # Send initial file tree
            try:
                from .file_system import FileSystemService
                file_system = FileSystemService(str(self._project_root))
                file_tree = file_system.get_file_tree()
                
                if file_tree:
                    logger.info("📊 Sending initial file tree")
                    self._last_file_tree = file_tree
                    await self.broadcast_file_tree(file_tree)
                else:
                    logger.warning("⚠️ Initial file tree is empty")
            except Exception as e:
                logger.error(f"❌ Error sending initial file tree: {str(e)}", exc_info=True)
                
        except Exception as e:
            logger.error(f"❌ Error adding client: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to add SSE client")

    async def remove_client(self, client_queue: asyncio.Queue):
        """Remove a client from the SSE manager."""
        try:
            if client_queue in self._clients:
                self._clients.remove(client_queue)
                logger.info(f"📤 Removed SSE client. Remaining: {len(self._clients)}")
        except Exception as e:
            logger.error(f"❌ Error removing client: {str(e)}", exc_info=True)

    async def broadcast_file_tree(self, file_tree: List[Dict]):
        """Broadcast file tree updates to all connected clients."""
        try:
            logger.info(f"📡 Broadcasting file tree to {len(self._clients)} clients")
            logger.info(f"📊 File tree size: {len(file_tree)} items")
            
            # Create the SSE message
            message = {
                'event': 'file_tree',
                'data': json.dumps(file_tree)
            }
            
            # Format the SSE message
            sse_message = f"event: {message['event']}\ndata: {message['data']}\n\n"
            
            # Broadcast to all clients
            tasks = []
            for client in list(self._clients):
                try:
                    task = asyncio.create_task(self._send_message(client, sse_message))
                    tasks.append(task)
                except Exception as e:
                    logger.error(f"❌ Error creating broadcast task: {str(e)}")
                    self.remove_client(client)
            
            # Wait for all broadcasts to complete
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
            
            logger.info("✅ File tree broadcast complete")
            
        except Exception as e:
            logger.error(f"❌ Error broadcasting file tree: {str(e)}", exc_info=True)

    async def broadcast_update(self, event_data: Dict):
        """Broadcast an update to all connected clients."""
        try:
            if not self._clients:
                logger.debug("No clients connected to broadcast to")
                return

            logger.info(f"📤 Broadcasting update to {len(self._clients)} clients")
            message = f"event: {event_data['event']}\ndata: {event_data['data']}\n\n"
            
            # Create tasks for each client
            tasks = []
            for client in self._clients.copy():
                try:
                    task = asyncio.create_task(client.put(message))
                    tasks.append(task)
                except Exception as e:
                    logger.error(f"❌ Error creating broadcast task: {str(e)}")
                    self._clients.remove(client)

            # Wait for all tasks to complete
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
                logger.info("✅ Broadcast complete")
            
        except Exception as e:
            logger.error(f"❌ Error broadcasting update: {str(e)}", exc_info=True)

    async def generate_events(self):
        """Generate SSE events for a client."""
        try:
            client_queue = asyncio.Queue()
            await self.add_client(client_queue)

            try:
                while workflow_state.is_active():
                    current_time = time.time()
                    if current_time - self._last_keep_alive >= self._keep_alive_interval:
                        self._last_keep_alive = current_time
                        keep_alive = "event: keep-alive\ndata: {}\n\n"
                        yield keep_alive

                    try:
                        message = await asyncio.wait_for(client_queue.get(), timeout=1)
                        yield message
                        client_queue.task_done()
                    except asyncio.TimeoutError:
                        continue
                    except Exception as e:
                        logger.error(f"❌ Error getting message from queue: {str(e)}")
                        break

            finally:
                logger.info("🛑 Workflow complete. Closing SSE connection for client.")
                await self.remove_client(client_queue)

        except Exception as e:
            logger.error(f"❌ Error in event generation: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error generating SSE events")
    async def _send_message(self, client: asyncio.Queue, message: str):
        """Send a message to a specific client."""
        try:
            await client.put(message)
        except Exception as e:
            logger.error(f"❌ Error sending message to client: {str(e)}")
            await self.remove_client(client)

# Create a single instance of the SSE manager
sse_manager = SSEManager() 