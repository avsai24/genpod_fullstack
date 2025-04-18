import os
import time
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileCreatedEvent, FileDeletedEvent, FileModifiedEvent, FileMovedEvent
from typing import Optional, Dict
from .types import FileEvent, FileEventType, FileMetadata, calculate_file_hash
from .diff_generator import DiffGenerator
from ..sse.event_manager import event_manager

logger = logging.getLogger(__name__)

class GenpodFileEventHandler(FileSystemEventHandler):
    def __init__(self, root_path: str, client_id: str):
        self.root_path = root_path
        self.client_id = client_id
        self.diff_generator = DiffGenerator()
        self._last_modified: Dict[str, float] = {}
        logger.info(f"Initialized file watcher for client {client_id} at {root_path}")

    def _get_relative_path(self, path: str) -> str:
        """Convert absolute path to relative path from root."""
        rel_path = os.path.relpath(path, self.root_path)
        logger.debug(f"Converted absolute path {path} to relative path {rel_path}")
        return rel_path

    def _get_file_metadata(self, path: str) -> Optional[FileMetadata]:
        """Get metadata for a file."""
        try:
            stat = os.stat(path)
            metadata = FileMetadata(
                size=stat.st_size,
                modified=stat.st_mtime,
                hash=calculate_file_hash(path) if os.path.isfile(path) else ""
            )
            logger.debug(f"Generated metadata for {path}: {metadata}")
            return metadata
        except Exception as e:
            logger.error(f"Error getting metadata for {path}: {e}")
            return None

    def _debounce_event(self, path: str, event_time: float) -> bool:
        """Debounce rapid successive events."""
        last_time = self._last_modified.get(path, 0)
        if event_time - last_time < 0.1:
            logger.debug(f"Debounced event for {path}")
            return True
        self._last_modified[path] = event_time
        return False

    async def _process_event(self, event_type: FileEventType, src_path: str, dest_path: Optional[str] = None):
        """Process a file system event and send appropriate diffs."""
        logger.info(f"Processing {event_type} event for {src_path}")
        
        if self._debounce_event(src_path, time.time()):
            return

        relative_path = self._get_relative_path(src_path)
        relative_dest = self._get_relative_path(dest_path) if dest_path else None

        # Create file event
        file_event = FileEvent(
            type=event_type,
            path=relative_path,
            old_path=relative_dest,
            metadata=self._get_file_metadata(src_path)
        )
        logger.info(f"Created file event: {file_event}")

        # Generate and send tree diff
        tree_diff = self.diff_generator.process_file_event(file_event)
        if tree_diff:
            logger.info(f"Generated tree diff: {tree_diff}")
            await event_manager.send_tree_diff(self.client_id, tree_diff)
        else:
            logger.debug("No tree diff generated")

        # For modified files, also send content diff
        if event_type == FileEventType.MODIFIED and os.path.isfile(src_path):
            content_diff = self.diff_generator.generate_content_diff(src_path)
            if content_diff:
                logger.info(f"Generated content diff for {src_path}: {content_diff}")
                await event_manager.send_content_diff(self.client_id, content_diff)
            else:
                logger.debug(f"No content diff generated for {src_path}")

    def on_created(self, event: FileCreatedEvent):
        """Handle file/directory creation."""
        if not event.is_directory:
            logger.info(f"File created: {event.src_path}")
            asyncio.create_task(self._process_event(FileEventType.CREATED, event.src_path))

    def on_deleted(self, event: FileDeletedEvent):
        """Handle file/directory deletion."""
        if not event.is_directory:
            logger.info(f"File deleted: {event.src_path}")
            asyncio.create_task(self._process_event(FileEventType.DELETED, event.src_path))

    def on_modified(self, event: FileModifiedEvent):
        """Handle file modification."""
        if not event.is_directory:
            logger.info(f"File modified: {event.src_path}")
            asyncio.create_task(self._process_event(FileEventType.MODIFIED, event.src_path))

    def on_moved(self, event: FileMovedEvent):
        """Handle file move/rename."""
        if not event.is_directory:
            logger.info(f"File moved: {event.src_path} -> {event.dest_path}")
            asyncio.create_task(self._process_event(FileEventType.MOVED, event.src_path, event.dest_path))

class GenpodFileWatcher:
    def __init__(self, root_path: str, client_id: str):
        self.root_path = os.path.abspath(root_path)
        self.client_id = client_id
        self.observer = Observer()
        self.event_handler = GenpodFileEventHandler(self.root_path, self.client_id)
        logger.info(f"Initialized GenpodFileWatcher for client {client_id} at {root_path}")

    def start(self):
        """Start watching for file changes."""
        logger.info(f"Starting file watcher for client {self.client_id}")
        self.observer.schedule(self.event_handler, self.root_path, recursive=True)
        self.observer.start()

    def stop(self):
        """Stop watching for file changes."""
        logger.info(f"Stopping file watcher for client {self.client_id}")
        self.observer.stop()
        self.observer.join()

    def reset(self):
        """Reset the watcher's state."""
        logger.info(f"Resetting watcher state for client {self.client_id}")
        self.event_handler.diff_generator.reset_state() 