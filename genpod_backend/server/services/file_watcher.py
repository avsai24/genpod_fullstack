import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from typing import Callable, Dict
import logging
from pathlib import Path
import time
import threading

logger = logging.getLogger(__name__)

class FileWatcher:
    def __init__(self, directory: str, on_change: Callable[[Dict], None]):
        self.directory = Path(directory).resolve()
        self.on_change = on_change
        self.observer = Observer()
        self._setup_handler()
        self._is_running = False
        
        # Log directory diagnostics
        logger.info(f"🔍 Initializing file watcher for: {self.directory}")
        logger.info(f"📂 Directory exists: {self.directory.exists()}")
        logger.info(f"📂 Directory is writable: {os.access(self.directory, os.W_OK)}")
        logger.info(f"📂 Directory is absolute: {self.directory.is_absolute()}")
        logger.info(f"📂 Directory contents: {list(self.directory.iterdir())}")

    def _setup_handler(self):
        class Handler(FileSystemEventHandler):
            def __init__(self, callback: Callable[[Dict], None], base_path: Path):
                self.callback = callback
                self.base_path = base_path
                self.last_event_time = {}
                super().__init__()
                logger.info(f"🔄 Event handler initialized for base path: {base_path}")
                logger.info(f"📂 Base path exists: {base_path.exists()}")
                logger.info(f"📂 Base path is directory: {base_path.is_dir()}")
                logger.info(f"📂 Base path contents: {list(base_path.iterdir())}")

            def _should_handle_event(self, event_path: str) -> bool:
                """Check if we should handle this event based on debouncing and path."""
                current_time = time.time()
                last_time = self.last_event_time.get(event_path, 0)
                
                # Update last event time
                self.last_event_time[event_path] = current_time
                
                # Reduce debounce time to 50ms
                if current_time - last_time < 0.05:
                    logger.debug(f"⏱️ Skipping debounced event for: {event_path}")
                    return False

                # Skip hidden files and directories
                path_parts = Path(event_path).parts
                if any(part.startswith('.') for part in path_parts):
                    logger.debug(f"👻 Skipping hidden file/directory: {event_path}")
                    return False

                # Skip certain directories
                skip_dirs = {'__pycache__', 'node_modules', '.git', 'venv'}
                if any(skip_dir in path_parts for skip_dir in skip_dirs):
                    logger.debug(f"🚫 Skipping excluded directory: {event_path}")
                    return False

                return True

            def on_modified(self, event):
                logger.info(f"📝 Received modification event: {event}")
                logger.info(f"📝 Event path: {event.src_path}")
                logger.info(f"📝 Is directory: {event.is_directory}")
                
                if event.is_directory:
                    logger.info("📂 Skipping directory modification")
                    return
                
                try:
                    src_path = Path(event.src_path).resolve()
                    logger.info(f"📝 Resolved path: {src_path}")
                    logger.info(f"📝 Path exists: {src_path.exists()}")
                    
                    if not self._should_handle_event(str(src_path)):
                        logger.info("⏱️ Skipping debounced event")
                        return

                    logger.info(f"📝 File modified: {src_path}")
                    logger.info(f"⏰ Event time: {time.time()}")
                    logger.info(f"🔄 Current thread: {threading.current_thread().name}")
                    
                    event_data = {
                        'type': 'modified',
                        'src_path': str(src_path),
                        'timestamp': time.time()
                    }
                    
                    logger.info(f"📤 Sending file modification event: {event_data}")
                    self.callback(event_data)
                    logger.info("✅ File modification event sent")
                except Exception as e:
                    logger.error(f"❌ Error handling file modification: {str(e)}", exc_info=True)

            def on_created(self, event):
                if event.is_directory:
                    return
                    
                try:
                    src_path = Path(event.src_path).resolve()
                    if not self._should_handle_event(str(src_path)):
                        return

                    logger.info(f"📝 File created: {src_path}")
                    logger.info(f"⏰ Event time: {time.time()}")
                    
                    event_data = {
                        'type': 'created',
                        'src_path': str(src_path),
                        'timestamp': time.time()
                    }
                    
                    logger.info(f"📤 Sending file creation event: {event_data}")
                    self.callback(event_data)
                    logger.info("✅ File creation event sent")
                except Exception as e:
                    logger.error(f"❌ Error handling file creation: {str(e)}", exc_info=True)

            def on_deleted(self, event):
                if event.is_directory:
                    return
                    
                try:
                    src_path = Path(event.src_path).resolve()
                    if not self._should_handle_event(str(src_path)):
                        return

                    logger.info(f"🗑️ File deleted: {src_path}")
                    logger.info(f"⏰ Event time: {time.time()}")
                    
                    event_data = {
                        'type': 'deleted',
                        'src_path': str(src_path),
                        'timestamp': time.time()
                    }
                    
                    logger.info(f"📤 Sending file deletion event: {event_data}")
                    self.callback(event_data)
                    logger.info("✅ File deletion event sent")
                except Exception as e:
                    logger.error(f"❌ Error handling file deletion: {str(e)}", exc_info=True)

        self.event_handler = Handler(self.on_change, self.directory)
        self.observer.schedule(self.event_handler, str(self.directory), recursive=True)
        logger.info("✅ File watcher handler configured")

    def start(self):
        """Start watching the directory."""
        try:
            if not self._is_running:
                # Log thread diagnostics before starting
                logger.info(f"🧵 Active threads before start: {threading.active_count()}")
                logger.info(f"🧵 Thread names: {[t.name for t in threading.enumerate()]}")
                
                self.observer.start()
                self._is_running = True
                
                # Log thread diagnostics after starting
                logger.info(f"👀 Started watching directory: {self.directory}")
                logger.info(f"🧵 Observer thread alive: {self.observer.is_alive()}")
                logger.info(f"🧵 Observer thread name: {self.observer.name}")
                logger.info(f"🧵 Observer thread daemon: {self.observer.daemon}")
                logger.info(f"🧵 Active threads after start: {threading.active_count()}")
                logger.info(f"🧵 Thread names: {[t.name for t in threading.enumerate()]}")
                
                # Monitor observer thread status
                def monitor_observer():
                    while self._is_running:
                        logger.info(f"👀 Observer status - Alive: {self.observer.is_alive()}, Name: {self.observer.name}")
                        time.sleep(5)
                
                # Start monitoring in a separate thread
                monitor_thread = threading.Thread(target=monitor_observer, daemon=True)
                monitor_thread.start()
                logger.info(f"👀 Started observer monitor thread: {monitor_thread.name}")
                
                # Send initial file tree update
                try:
                    from .file_system import FileSystemService
                    file_system = FileSystemService(str(self.directory))
                    file_tree = file_system.get_file_tree()
                    if file_tree:
                        self.on_change({
                            'type': 'initial',
                            'src_path': str(self.directory),
                            'file_tree': file_tree
                        })
                        logger.info("📊 Sent initial file tree")
                except Exception as e:
                    logger.error(f"❌ Error sending initial file tree: {str(e)}", exc_info=True)
            else:
                logger.info("ℹ️ File watcher is already running")
        except Exception as e:
            logger.error(f"❌ Error starting file watcher: {str(e)}", exc_info=True)

    def stop(self):
        """Stop watching the directory."""
        try:
            if self._is_running:
                # Log thread diagnostics before stopping
                logger.info(f"🧵 Active threads before stop: {threading.active_count()}")
                logger.info(f"🧵 Thread names: {[t.name for t in threading.enumerate()]}")
                
                self.observer.stop()
                self.observer.join()
                self._is_running = False
                
                # Log thread diagnostics after stopping
                logger.info("🛑 Stopped watching directory")
                logger.info(f"🧵 Active threads after stop: {threading.active_count()}")
                logger.info(f"🧵 Thread names: {[t.name for t in threading.enumerate()]}")
            else:
                logger.info("ℹ️ File watcher is not running")
        except Exception as e:
            logger.error(f"❌ Error stopping file watcher: {str(e)}", exc_info=True) 