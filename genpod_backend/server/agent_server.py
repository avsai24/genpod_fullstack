# server/agent_server.py

import grpc
from concurrent import futures
import time
import json
import random
import sys
import os

# Fix import path to find agent_pb2 when running from CLI
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import agent_pb2
import agent_pb2_grpc
import google.generativeai as genai

# Load Gemini API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-pro")

# ----- Chat Tab -----
class ChatService(agent_pb2_grpc.ChatServiceServicer):
    def SendMessageStream(self, request, context):
        print(f"🧠 [Chat] User: {request.user}, Prompt: {request.message}")
        try:
            response = model.generate_content(request.message, stream=True)
            for chunk in response:
                if chunk.text:
                    yield agent_pb2.ChatResponse(reply=chunk.text)
        except Exception as e:
            print("❌ Gemini API error:", e)
            yield agent_pb2.ChatResponse(reply="⚠️ Error processing your request with Gemini.")

# ----- All Other Tabs -----
class AgentService(agent_pb2_grpc.AgentServiceServicer):
    def StreamData(self, request, context):
        print(f"📡 [Agent] Streaming for tab: {request.tab}")
        while True:
            if request.tab == "metrics":
                data = [
                    {"name": "CPU Usage", "value": f"{random.randint(30, 80)}%"},
                    {"name": "Memory Usage", "value": f"{random.randint(4, 12)} GB"},
                    {"name": "Uptime", "value": f"{random.randint(1, 10)} days"},
                ]
            elif request.tab == "logs":
                data = [
                    {"timestamp": time.strftime("%H:%M:%S"), "level": "INFO", "message": "Service started"},
                    {"timestamp": time.strftime("%H:%M:%S"), "level": "DEBUG", "message": "Request handled"},
                ]
            elif request.tab == "configure":
                data = {
                    "max_users": "1000",
                    "region": "us-central",
                    "logging_enabled": True,
                }
                yield agent_pb2.AgentResponse(
                    type="configure",
                    json_payload=json.dumps(data)
                )
            elif request.tab == "insights":
                data = {
                    "top_queries": ["how to use Genpod", "configure AI"],
                    "error_rate": "1.2%",
                    "active_users": 182,
                }
            elif request.tab == "code":
                data = {
                    "status": "waiting",
                    "message": "Code tab initialized. Waiting for user input.",
                }
            elif request.tab == "preview":
                data = {
                    "html": "<h1>Welcome</h1><p>This is a preview pane.</p>",
                }
            else:
                break

            yield agent_pb2.AgentResponse(
                type=request.tab,
                json_payload=json.dumps(data)
            )
            time.sleep(2)

# ----- Serve on 50052 -----
def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    agent_pb2_grpc.add_ChatServiceServicer_to_server(ChatService(), server)
    agent_pb2_grpc.add_AgentServiceServicer_to_server(AgentService(), server)
    server.add_insecure_port('[::]:50052')
    server.start()
    print("✅ Unified gRPC server running at http://localhost:50052")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        print("🛑 Server Stopped")
        server.stop(0)

if __name__ == "__main__":
    serve()