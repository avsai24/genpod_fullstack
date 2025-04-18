import os
from typing import Dict, List, Optional
from .types import FileEvent, FileTreeDiff, FileContentDiff, FileMetadata, calculate_file_hash

class DiffGenerator:
    def __init__(self):
        self._last_tree_state: Dict[str, FileMetadata] = {}
        self._last_content_hashes: Dict[str, str] = {}

    def process_file_event(self, event: FileEvent) -> Optional[FileTreeDiff]:
        """Process a file event and generate a tree diff."""
        diff = FileTreeDiff(added=[], removed=[], moved=[], modified=[])
        
        if event.type == "created":
            if event.metadata:
                self._last_tree_state[event.path] = event.metadata
                diff.added.append({
                    "path": event.path,
                    "type": "file" if os.path.isfile(event.path) else "directory",
                    "metadata": event.metadata.__dict__
                })
                
        elif event.type == "deleted":
            if event.path in self._last_tree_state:
                del self._last_tree_state[event.path]
                diff.removed.append(event.path)
                
        elif event.type in ["moved", "renamed"]:
            if event.old_path and event.old_path in self._last_tree_state:
                metadata = self._last_tree_state[event.old_path]
                del self._last_tree_state[event.old_path]
                self._last_tree_state[event.path] = metadata
                diff.moved.append({
                    "oldPath": event.old_path,
                    "newPath": event.path
                })
                
        elif event.type == "modified":
            if event.metadata and event.path in self._last_tree_state:
                self._last_tree_state[event.path] = event.metadata
                diff.modified.append({
                    "path": event.path,
                    "metadata": event.metadata.__dict__
                })
                
        return diff if any([diff.added, diff.removed, diff.moved, diff.modified]) else None

    def generate_content_diff(self, file_path: str) -> Optional[FileContentDiff]:
        """Generate a content diff for a modified file."""
        if not os.path.isfile(file_path):
            return None

        current_hash = calculate_file_hash(file_path)
        
        # If this is the first time we're seeing this file, send full content
        if file_path not in self._last_content_hashes:
            self._last_content_hashes[file_path] = current_hash
            with open(file_path, 'r') as f:
                content = f.read()
            return FileContentDiff(
                path=file_path,
                hash=current_hash,
                diff_type="full",
                content=content
            )
        
        # If hash hasn't changed, no need to send diff
        if current_hash == self._last_content_hashes[file_path]:
            return None
            
        # TODO: Implement proper diff generation using a diff library
        # For now, we'll send the full content
        with open(file_path, 'r') as f:
            content = f.read()
            
        self._last_content_hashes[file_path] = current_hash
        return FileContentDiff(
            path=file_path,
            hash=current_hash,
            diff_type="full",
            content=content
        )

    def reset_state(self):
        """Reset the internal state of the diff generator."""
        self._last_tree_state.clear()
        self._last_content_hashes.clear() 