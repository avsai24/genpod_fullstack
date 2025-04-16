# server/agent_server.py
import grpc
from concurrent import futures
import time
import json
import random
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import server.agent_pb2 as agent_pb2
import server.agent_pb2_grpc as agent_pb2_grpc
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-pro")

LOG_FILE_PATH = os.path.join(os.path.dirname(__file__), "../logs/agent.log")
PROJECT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def build_tree(base_path):
    tree = {}

    for root, dirs, files in os.walk(base_path):
        dirs[:] = [
            d for d in dirs
            if not d.startswith('.') and d not in ['__pycache__', 'node_modules', 'venv', 'env', '.venv']
        ]

        rel_root = os.path.relpath(root, PROJECT_PATH)
        parts = rel_root.split(os.sep) if rel_root != '.' else []

        current = tree
        for part in parts:
            current = current.setdefault(part, {
                "type": "folder",
                "name": part,
                "path": os.path.join(*parts[:parts.index(part)+1]),
                "children": {}
            })["children"]

        for d in dirs:
            current[d] = {
                "type": "folder",
                "name": d,
                "path": os.path.join(rel_root, d),
                "children": {}
            }

        for f in files:
            if f.startswith('.') or f.lower().endswith(('.log', '.pyc', '.pyo', '.db', '.ico')) or '__pycache__' in root:
                continue
            current[f] = {
                "type": "file",
                "name": f,
                "path": os.path.join(rel_root, f)
            }

    def dict_to_list(node):
        if "children" in node:
            node["children"] = [dict_to_list(child) for child in node["children"].values()]
        return node

    return [dict_to_list(n) for n in tree.values()]

class ChatService(agent_pb2_grpc.ChatServiceServicer):
    def SendMessageStream(self, request, context):
        print(f"[Chat] User: {request.user}, Prompt: {request.message}")
        try:
            response = model.generate_content(request.message, stream=True)
            for chunk in response:
                if chunk.text:
                    yield agent_pb2.ChatResponse(reply=chunk.text)
        except Exception as e:
            print(" Gemini API error:", e)
            yield agent_pb2.ChatResponse(reply="Error processing your request with Gemini.")

class AgentService(agent_pb2_grpc.AgentServiceServicer):
    def StreamData(self, request, context):
        print(f"[Agent] Streaming for tab: {request.tab}")

        if request.tab == "logs":
            try:
                with open(LOG_FILE_PATH, "a+") as f:
                    f.seek(0)
                    seen_lines = f.readlines()

                while True:
                    new_entry = f"New log from agent at {time.strftime('%Y-%m-%d %H:%M:%S')}"
                    with open(LOG_FILE_PATH, "a") as f:
                        f.write(new_entry + "\n")

                    log_entry = {
                        "timestamp": time.strftime("%H:%M:%S"),
                        "level": "INFO",
                        "message": new_entry
                    }

                    yield agent_pb2.AgentResponse(
                        type="logs",
                        json_payload=json.dumps([log_entry])
                    )

                    time.sleep(1)
            except Exception as e:
                yield agent_pb2.AgentResponse(
                    type="logs",
                    json_payload=json.dumps([{
                        "timestamp": time.strftime("%H:%M:%S"),
                        "level": "ERROR",
                        "message": f"Logging error: {str(e)}"
                    }])
                )

        elif request.tab == "code":
                try:
                    print("[Code] Scanning project path:", PROJECT_PATH)
                    file_tree = build_tree(PROJECT_PATH)

                    yield agent_pb2.AgentResponse(
                        type="file_tree",
                        json_payload=json.dumps(file_tree)
                    )

                    time.sleep(1)

                    def walk_flat(tree_list):
                        for node in tree_list:
                            if node["type"] == "file":
                                yield node
                            elif node["type"] == "folder" and "children" in node:
                                yield from walk_flat(node["children"])

                    for item in walk_flat(file_tree):
                        abs_path = os.path.join(PROJECT_PATH, item["path"])
                        try:
                            with open(abs_path, "r", encoding="utf-8") as f:
                                content = f.read()
                            payload = {
                                "path": item["path"],
                                "content": content
                            }
                            yield agent_pb2.AgentResponse(
                                type="file_content",
                                json_payload=json.dumps(payload)
                            )
                            time.sleep(0.1)
                        except Exception as e:
                            print(f"[Code] Error reading {abs_path}: {e}")
                            continue

                    # ✅ Keep the gRPC stream open to support SSE on frontend
                    while True:
                        time.sleep(60)

                except Exception as e:
                    print(f"[Code] Streaming error: {e}")
                    yield agent_pb2.AgentResponse(
                        type="file_tree",
                        json_payload=json.dumps([{
                            "type": "error",
                            "message": str(e)
                        }])
                    )
        else:
            while True:
                if request.tab == "metrics":
                    data = [
                        {"name": "CPU Usage", "value": f"{random.randint(30, 80)}%"},
                        {"name": "Memory Usage", "value": f"{random.randint(4, 12)} GB"},
                        {"name": "Uptime", "value": f"{random.randint(1, 10)} days"},
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
    print("Unified gRPC server running at http://localhost:50052")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        print("Server Stopped")
        server.stop(0)

if __name__ == "__main__":
    serve()