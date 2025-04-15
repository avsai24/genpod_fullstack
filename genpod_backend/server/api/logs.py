# server/api/logs.py

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import asyncio
import os

router = APIRouter()

LOG_PATH = "logs/agent.log"

# Async generator for tailing the log file
async def tail_log():
    with open(LOG_PATH, "r") as f:
        f.seek(0, os.SEEK_END)  # Go to the end of file

        while True:
            line = f.readline()
            if not line:
                await asyncio.sleep(1)  # No new line yet
                continue

            # Basic log parsing (timestamp level message)
            parts = line.strip().split(" ", 2)
            if len(parts) == 3:
                timestamp, level, message = parts
            else:
                timestamp, level, message = "--", "INFO", line.strip()

            log_entry = {
                "logs": [{
                    "timestamp": timestamp,
                    "level": level.upper(),
                    "message": message,
                }]
            }

            yield f"data: {log_entry}\n\n"

@router.get("/logs")
async def stream_logs(request: Request):
    return StreamingResponse(tail_log(), media_type="text/event-stream")
