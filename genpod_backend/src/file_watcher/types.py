from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union
import hashlib

class FileEventType(str, Enum):
    CREATED = "created"
    DELETED = "deleted"
    MODIFIED = "modified"
    MOVED = "moved"
    RENAMED = "renamed"

@dataclass
class FileMetadata:
    size: int
    modified: float
    hash: str

@dataclass
class FileEvent:
    type: FileEventType
    path: str
    old_path: Optional[str] = None
    metadata: Optional[FileMetadata] = None

@dataclass
class FileTreeDiff:
    added: List[Dict]
    removed: List[str]
    moved: List[Dict[str, str]]
    modified: List[Dict]

@dataclass
class FileContentDiff:
    path: str
    hash: str
    diff_type: str  # 'full' or 'patch'
    content: Union[str, List[Dict]]

@dataclass
class SSEEvent:
    type: str
    timestamp: float
    event_id: str
    data: Union[FileTreeDiff, FileContentDiff]

def calculate_file_hash(file_path: str) -> str:
    """Calculate SHA-256 hash of a file's content."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest() 