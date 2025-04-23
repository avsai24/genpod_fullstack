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
model = genai.GenerativeModel("gemini-2.0-flash")

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
                    print("[Metrics] Streaming metrics data...")
                    while True:
                        data = {
                            "project_overview": [
                                {"name": "Service Name", "value": "TitleRequestsMicroservice"},
                                {"name": "Current Status", "value":  "COMPLETED"},
                                {"name": "Completion (%)", "value": f"{random.uniform(5.0, 100.0):.1f}%"},
                                {"name": "Agents Status", "value": random.choice([
                                    "Supervisor assigning tasks",
                                    "Coder active",
                                    "All agents idle",
                                    "Tester running validations"
                                ])},
                                {"name": "Total Tasks", "value": str(random.randint(10, 30))},
                                {"name": "Total Planned Tasks", "value": str(random.randint(10, 20))},
                                {"name": "Total Issues", "value": str(random.randint(0, 5))},
                                {"name": "User Prompt", "value": "I want to develop a Title Requests Micro-service adhering to MISMO..."},
                                {"name": "Project Directory", "value": "/home/venkata/genpod/output/..."}
                            ],
                            "planned_tasks": [
                                {"name": "Current Planned Task ID", "value": f"{random.randint(1700000000000, 1800000000000)}-..."},
                                {"name": "Position in queue", "value": str(random.randint(0, 10))},
                                {"name": "Total Planned Tasks", "value": str(random.randint(0, 10))}
                            ],
                            "issues": [
                                {"name": "Current Issue Position", "value": str(random.randint(0, 5))},
                                {"name": "Total Issues", "value": str(random.randint(0, 5))}
                            ],
                            "agent_state": [
                                {"name": "Agent", "value": random.choice(["Solution Architect", "Coder", "Tester"])},
                                {"name": "Active Node", "value": random.choice(["entry", "design", "validate", "build"])},
                                {"name": "Stage", "value": random.choice(["generate_requirements", "setup_env", "write_tests"])}
                            ],
                            "token_summary": [
                                {"name": "Total Calls", "value": str(random.randint(5, 20))},
                                {"name": "Aggregate Input Tokens", "value": f"{random.randint(5000, 10000):,}"},
                                {"name": "Aggregate Output Tokens", "value": f"{random.randint(8000, 15000):,}"},
                                {"name": "Avg Call Duration (s)", "value": f"{random.uniform(5.0, 20.0):.2f}"},
                                {"name": "Total LLM Time (s)", "value": f"{random.uniform(50.0, 200.0):.2f}"}
                            ],
                            "token_by_model": [
                                {
                                    "model": "openai/g3-mini",
                                    "calls": random.randint(5, 20),
                                    "input_tokens": f"{random.randint(3000, 8000):,} ($0.01)",
                                    "output_tokens": f"{random.randint(5000, 12000):,} ($0.04)",
                                    "total_cost": "$0.05"
                                },
                                {
                                    "model": "ALL MODELS",
                                    "calls": random.randint(5, 20),
                                    "input_tokens": f"{random.randint(6000, 10000):,}",
                                    "output_tokens": f"{random.randint(9000, 14000):,}",
                                    "total_cost": "$0.06"
                                }
                            ]
                        }

                        yield agent_pb2.AgentResponse(
                            type="metrics",
                            json_payload=json.dumps(data)
                        )

                        time.sleep(2)
                
                
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
                    print("[Insights] Streaming insights data...")
                    while True:
                        data = {
                            "top_queries": random.sample([
                                "how to use Genpod",
                                "configure AI agents",
                                "debug code tab",
                                "setup prompts",
                                "track agent memory"
                            ], 3),
                            "error_rate": f"{round(random.uniform(0.5, 3.5), 1)}%",
                            "active_users": random.randint(100, 500),
                        }

                        yield agent_pb2.AgentResponse(
                            type="insights",
                            json_payload=json.dumps(data)
                        )

                        time.sleep(2)
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

    def RunAgentWorkflow(self, request, context):
        print(f"[Workflow] User {request.user_id} requested prompt: {request.prompt}")

        def send_log(agent_name, message):
            return agent_pb2.AgentUpdate(
                log=agent_pb2.LogEntry(
                    agent_name=agent_name,
                    message=message,
                    timestamp=time.strftime("%H:%M:%S")
                )
            )

        def send_event(agent_name, status):
            return agent_pb2.AgentUpdate(
                event=agent_pb2.WorkflowEvent(
                    agent_name=agent_name,
                    status=status
                )
            )

        # Step 1: Supervisor starts
        yield send_event("Supervisor", "STARTED")
        yield send_log("Supervisor", f"Received prompt: {request.prompt}")
        time.sleep(1)

        # Step 2: Ask Gemini to generate subtasks
        try:
            breakdown_prompt = f"""
                You are a Supervisor agent. Your job is to break down the following user task into subtasks and assign them to agents (like Coder, Tester, Reviewer).

                IMPORTANT:
                - Output ONLY valid JSON. Do NOT add markdown, commentary, or explanation.
                - Follow this JSON format exactly:
                [
                {{ "agent": "Coder", "task": "Implement feature X" }},
                {{ "agent": "Tester", "task": "Write tests for feature X" }}
                ]

                Now, break down this task:
                "{request.prompt}"
            """

            print("[Gemini] Sending breakdown prompt...")
            gemini_response = model.generate_content(breakdown_prompt)
            print("[Gemini] Raw response:", gemini_response.text)

            raw_text = gemini_response.text.strip()

            # ✅ Clean out markdown formatting
            if raw_text.startswith("```json"):
                raw_text = raw_text.lstrip("```json").rstrip("```").strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.lstrip("```").rstrip("```").strip()

            # ✅ Now parse
            subtasks = json.loads(raw_text)

            yield send_log("System", json.dumps({ "subtasks": subtasks }))
        except Exception as e:
            yield send_log("Supervisor", f"Error generating subtasks: {str(e)}")
            subtasks = []

        yield send_event("Supervisor", "FINISHED")
        time.sleep(1)

        # Step 3: Each agent performs their task
        for task in subtasks:
            agent = task["agent"]
            message = task["task"]

            yield send_event(agent, "STARTED")
            yield send_log(agent, f"{agent} is working on: {message}")
            time.sleep(3)
            yield send_log(agent, f"{agent} completed: {message}")
            yield send_event(agent, "FINISHED")

        # Step 4: Final answer
        time.sleep(1.5)
        final_output = f"Genpod completed your task successfully!!"

        yield agent_pb2.AgentUpdate(
            answer=agent_pb2.FinalAnswer(content=final_output)
        )

        print("[Workflow] Finished workflow and sent final answer.")

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