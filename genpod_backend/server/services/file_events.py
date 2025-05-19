import os
import json
import asyncio
from typing import Dict, List, Optional, Callable, Any
from pathlib import Path
import logging
from .file_watcher import FileWatcher
from .file_system import FileSystemService
from .sse_manager import sse_manager
import threading
from server.agent_server import workflow_state

logger = logging.getLogger(__name__)

class FileEventsService:
    def __init__(self, workspace_dir: str):
        self.workspace_dir = Path(workspace_dir).resolve()
        self.watcher: Optional[FileWatcher] = None
        self._is_watching = False
        self.file_system = FileSystemService(str(self.workspace_dir))
        logger.info(f"📁 Initialized FileEventsService for workspace: {self.workspace_dir}")
        
        # Initialize event handlers
        self._event_handlers: Dict[str, List[Callable]] = {
            'created': [],
            'deleted': [],
            'modified': [],
            'moved': []
        }
        logger.info("✅ Event handlers initialized")

    def _setup_watcher(self):
        """Set up the file watcher with proper error handling."""
        try:
            if self.watcher is None:
                logger.info("🔄 Setting up file watcher...")
                self.watcher = FileWatcher(
                    directory=str(self.workspace_dir),
                    on_change=self._handle_file_event
                )
                logger.info("✅ File watcher setup complete")
            else:
                logger.info("ℹ️ File watcher already exists")
        except Exception as e:
            logger.error(f"❌ Error setting up file watcher: {str(e)}", exc_info=True)
            self.watcher = None

    def start_watching(self):
        """Start watching for file changes."""
        try:
            if not self._is_watching:
                if workflow_state.is_active():  # ✅ Only start when workflow is active
                    logger.info("🔄 Starting file watching...")
                    logger.info(f"🧵 Active threads: {threading.active_count()}")
                    logger.info(f"🧵 Thread names: {[t.name for t in threading.enumerate()]}")
                    
                    self._setup_watcher()
                    if self.watcher:
                        self.watcher.start()
                        self._is_watching = True
                        logger.info("✅ File watching started successfully")
                        logger.info(f"🧵 Active threads: {threading.active_count()}")
                        logger.info(f"🧵 Thread names: {[t.name for t in threading.enumerate()]}")
                    else:
                        logger.error("❌ Cannot start watching: watcher not initialized")
                else:
                    logger.info("⚠️ Skipping file watcher start: workflow is not active")
            else:
                logger.info("ℹ️ Already watching for file changes")
        except Exception as e:
            logger.error(f"❌ Error starting file watching: {str(e)}", exc_info=True)
            self._is_watching = False
    
    def stop_watching(self):
        """Stop watching for file changes."""
        try:
            if self._is_watching and self.watcher:
                logger.info("🛑 Stopping file watching...")
                self.watcher.stop()
                self._is_watching = False
                self.watcher = None
                logger.info("✅ File watching stopped successfully")
            else:
                logger.info("ℹ️ Not currently watching for file changes")
        except Exception as e:
            logger.error(f"❌ Error stopping file watching: {str(e)}", exc_info=True)

    def _handle_file_event(self, event_data: Dict[str, Any]):
        """Handle file system events and broadcast updates."""
        try:
            logger.info(f"📥 Received file event: {event_data}")
            
            # Get current file tree
            file_tree = self.file_system.get_file_tree()
            logger.warning(f"📁 File tree returned by FileSystemService: {json.dumps(file_tree, indent=2)}")

            if not file_tree:
                logger.warning("⚠️ No file tree data available")
                return
                
            logger.info(f"📊 Broadcasting file tree update: {len(file_tree)} items")
            
            # Try to get the main event loop
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                # If no event loop exists, create a new one
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Create a task to broadcast the update
            if loop.is_running():
                # If the loop is running, create a task
                asyncio.run_coroutine_threadsafe(
                    sse_manager.broadcast_file_tree(file_tree),
                    loop
                )
            else:
                # If the loop is not running, run it
                loop.run_until_complete(sse_manager.broadcast_file_tree(file_tree))
            
            logger.info("✅ File tree update broadcasted")
            
        except Exception as e:
            logger.error(f"❌ Error handling file event: {str(e)}", exc_info=True)

    def __del__(self):
        """Clean up resources when the service is destroyed."""
        try:
            self.stop_watching()
            logger.info("🧹 Cleaned up file events service")
        except Exception as e:
            logger.error(f"❌ Error cleaning up file events service: {str(e)}", exc_info=True)

    def register_handler(self, event_type: str, handler: Callable):
        """Register a handler for a specific event type."""
        if event_type not in self._event_handlers:
            raise ValueError(f"Invalid event type: {event_type}")
        self._event_handlers[event_type].append(handler)
        logger.info(f"📝 Registered handler for {event_type} events")

    def unregister_handler(self, event_type: str, handler: Callable):
        """Unregister a handler for a specific event type."""
        if event_type in self._event_handlers:
            self._event_handlers[event_type] = [
                h for h in self._event_handlers[event_type] if h != handler
            ]
            logger.info(f"📝 Unregistered handler for {event_type} events")

    def get_file_tree(self) -> Dict:
        """Get the current file tree."""
        return self.file_system.get_file_tree()

    def get_file_info(self, relative_path: str) -> Optional[Dict]:
        """Get information about a specific file."""
        try:
            file_path = self.workspace_dir / relative_path
            if not file_path.exists():
                return None

            return {
                'type': 'directory' if file_path.is_dir() else 'file',
                'name': file_path.name,
                'path': relative_path,
                'size': file_path.stat().st_size if file_path.is_file() else None,
                'modified': file_path.stat().st_mtime
            }
        except Exception as e:
            logger.error(f"❌ Error getting file info: {str(e)}", exc_info=True)
            return None

    def read_file(self, relative_path: str) -> Optional[str]:
        """Read the contents of a file."""
        return self.file_system.read_file(relative_path)

    def write_file(self, relative_path: str, content: str) -> bool:
        """Write content to a file."""
        return self.file_system.write_file(relative_path, content)

    def delete_file(self, relative_path: str) -> bool:
        """Delete a file."""
        return self.file_system.delete_file(relative_path)

    def move_file(self, old_path: str, new_path: str) -> bool:
        """Move or rename a file."""
        return self.file_system.move_file(old_path, new_path) 