import os
import json
from typing import Dict, List, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class FileSystemService:
    def __init__(self, project_path: str):
        self.project_path = Path(project_path).resolve()
        self._validate_project_path()

    def _validate_project_path(self):
        if not self.project_path.exists():
            raise ValueError(f"Project path does not exist: {self.project_path}")
        if not self.project_path.is_dir():
            raise ValueError(f"Project path is not a directory: {self.project_path}")

    def get_file_tree(self) -> Dict:
        """Generate a nested dictionary representing the file tree."""

        def build_tree(path: Path) -> Dict:
            if path.is_file():
                return {
                    "name": path.name,
                    "type": "file",
                    "path": str(path.relative_to(self.project_path)),
                    "size": path.stat().st_size,
                    "modified": path.stat().st_mtime
                }
            elif path.is_dir():
                return {
                    "name": path.name,
                    "type": "directory",
                    "path": str(path.relative_to(self.project_path)),
                    "children": [build_tree(child) for child in sorted(path.iterdir())]
                }
            return {}

        return build_tree(self.project_path)

    def read_file(self, relative_path: str) -> Optional[str]:
        """Read file content safely with resolved absolute path."""
        try:
            # Normalize and resolve the path
            sanitized_path = os.path.normpath(relative_path)
            full_path = (self.project_path / sanitized_path).resolve()

            # Security check: ensure path is still inside project
            if not str(full_path).startswith(str(self.project_path)):
                logger.warning(f"🚫 Attempted to access outside project: {relative_path}")
                return None

            if not full_path.exists() or not full_path.is_file():
                logger.warning(f"❌ File not found: {full_path}")
                return None

            logger.info(f"📖 Reading file: {full_path}")
            return full_path.read_text(encoding='utf-8')

        except Exception as e:
            logger.error(f"❌ Error reading file {relative_path}: {str(e)}", exc_info=True)
            return None

    def write_file(self, relative_path: str, content: str) -> bool:
        """Write file content safely."""
        try:
            file_path = (self.project_path / relative_path).resolve()
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content, encoding='utf-8')
            return True
        except Exception as e:
            logger.error(f"Error writing file {relative_path}: {str(e)}")
            return False

    def delete_file(self, relative_path: str) -> bool:
        """Delete file safely."""
        try:
            file_path = (self.project_path / relative_path).resolve()
            if not str(file_path).startswith(str(self.project_path)):
                logger.warning(f"🚫 Unsafe delete attempt: {file_path}")
                return False

            if file_path.exists():
                if file_path.is_file():
                    file_path.unlink()
                else:
                    file_path.rmdir()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting {relative_path}: {str(e)}")
            return False

    def move_file(self, old_path: str, new_path: str) -> bool:
        """Move/rename file safely."""
        try:
            old_full_path = (self.project_path / old_path).resolve()
            new_full_path = (self.project_path / new_path).resolve()

            if not str(old_full_path).startswith(str(self.project_path)) or not str(new_full_path).startswith(str(self.project_path)):
                logger.warning(f"🚫 Unsafe move attempt: {old_path} → {new_path}")
                return False

            if old_full_path.exists():
                new_full_path.parent.mkdir(parents=True, exist_ok=True)
                old_full_path.rename(new_full_path)
                return True
            return False
        except Exception as e:
            logger.error(f"Error moving {old_path} to {new_path}: {str(e)}")
            return False

    def get_file_info(self, relative_path: str) -> Optional[Dict]:
        """Get file metadata."""
        try:
            file_path = (self.project_path / relative_path).resolve()
            if not file_path.exists():
                return None
            return {
                "name": file_path.name,
                "type": "file" if file_path.is_file() else "directory",
                "path": relative_path,
                "size": file_path.stat().st_size,
                "modified": file_path.stat().st_mtime
            }
        except Exception as e:
            logger.error(f"Error getting file info for {relative_path}: {str(e)}")
            return None