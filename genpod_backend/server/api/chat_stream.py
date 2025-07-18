from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from server.agent_engine import run_agent_workflow

print("📞 chat_stream.py loaded")
router = APIRouter()

def stream_agent_response(prompt: str):
    def event_stream():
        context = {}

        try:
            yield f"data: Supervisor started on: {prompt}\n\n"

            # ✅ Stream each line from agent workflow
            for line in run_agent_workflow(prompt, context):
                for subline in str(line).splitlines():
                    yield f"data: {subline}\n\n"

            yield f"data: ✅ Task complete\n\n"

        except Exception as e:
            print("❌ Streaming Error:", e)
            yield f"data: ❌ Internal error occurred: {str(e)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/stream")
async def chat_stream(req: Request):
    prompt = req.query_params.get("message", "")
    return stream_agent_response(prompt)