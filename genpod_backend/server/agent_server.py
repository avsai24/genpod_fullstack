# server/agent_server.py
import grpc
from concurrent import futures
import time
import json
import random
import sys
import os
import asyncio
import re
import concurrent.futures
import networkx as nx
from networkx.readwrite import json_graph

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import server.agent_pb2 as agent_pb2
import server.agent_pb2_grpc as agent_pb2_grpc
from server.agents.supervisor import SupervisorAgent
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("❌ Missing GEMINI_API_KEY environment variable")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

# 🔄 Shared workflow status
class WorkflowState:
    def __init__(self):
        self._active = False

    def activate(self):
        print("🔁 [WorkflowState] Activating...")
        self._active = True

    def deactivate(self):
        print("🛑 [WorkflowState] Deactivating...")
        self._active = False

    def is_active(self):
        return self._active

# ✅ Global shared instance
workflow_state = WorkflowState()

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
                    while workflow_state.is_active():
                        time.sleep(5)

                except Exception as e:
                    print(f"[Code] Streaming error: {e}")
                    yield agent_pb2.AgentResponse(
                        type="file_tree",
                        json_payload=json.dumps([{
                            "type": "error",
                            "message": str(e)
                        }])
                    )
        
        elif request.tab == "metrics":
            print("[Metrics] Streaming metrics data...")
            while workflow_state.is_active():
                data = {
                    "project_overview": [
                        {"name": "Service Name", "value": "TitleRequestsMicroservice"},
                        {"name": "Current Status", "value": "COMPLETED"},
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

            # 👇 Send final snapshot one last time before closing stream
            yield agent_pb2.AgentResponse(
                type="metrics",
                json_payload=json.dumps(data)
            )
            print("[Metrics] Workflow complete. Final metrics sent. Closing stream.")
            return
        
        
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
            while True:
                data = {
                    "html": "<h1>Welcome</h1><p>This is a preview pane.</p>"
                }
                yield agent_pb2.AgentResponse(
                    type="preview",
                    json_payload=json.dumps(data)
                )
                time.sleep(2)
        
        elif request.tab == "codeview":
            print("[CodeView] Generating dummy Code Property Graph...")

            # Step 1: Create graph
            G = nx.DiGraph()
            G.add_node("main", label="main()", category="function")
            G.add_node("foo", label="foo()", category="function")
            G.add_node("bar", label="bar()", category="function")
            G.add_node("x", label="x", category="variable")

            G.add_edge("main", "foo", type="calls")
            G.add_edge("main", "bar", type="calls")
            G.add_edge("foo", "x", type="uses")

            # Step 2: Convert to JSON-compatible format
            graph_data = json_graph.node_link_data(G)

            # Step 3: Yield the data once
            yield agent_pb2.AgentResponse(
                type="codeview",
                json_payload=json.dumps(graph_data)
            )

            # Step 4: Keep stream open (no new data, just support SSE)
            while workflow_state.is_active():
                time.sleep(5)
        
        else:
            yield agent_pb2.AgentResponse(
                type="error",
                json_payload=json.dumps({"error": f"Unsupported tab: {request.tab}"})
            )
    async def RunAgentWorkflow(self, request, context):
        print(f"[Workflow] User {request.user_id} requested prompt: {request.prompt}")
        workflow_state.activate()
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

        # Step 2: Generate subtasks
        try:
            supervisor = SupervisorAgent()
            subtasks_raw = await supervisor.generate_subtasks(request.prompt)
            match = re.search(r"```json\s*(.*?)\s*```", subtasks_raw, re.DOTALL)
            if match:
                subtasks_json = match.group(1)
            else:
                raise ValueError("❌ No valid JSON block found in Gemini response")

            subtasks = json.loads(subtasks_json)
            yield send_log("System", json.dumps({ "subtasks": subtasks }))
        except Exception as e:
            yield send_log("Supervisor", f"Error generating subtasks: {str(e)}")
            subtasks = []

        yield send_event("Supervisor", "FINISHED")
        time.sleep(1)

        # Step 3: Execute agents
        from server.agent_engine import AGENT_REGISTRY

        for task in subtasks:
            agent_name = task["agent"]
            agent_task = task["task"]

            yield send_event(agent_name, "STARTED")
            yield send_log(agent_name, f"Working on task: {agent_task}")

            agent = AGENT_REGISTRY.get(agent_name)
            if agent:
                try:
                    for chunk in agent.run(agent_task, context={}):
                        if chunk.strip():
                            yield agent_pb2.AgentUpdate(
                                answer=agent_pb2.FinalAnswer(content=chunk)
                            )
                    yield send_log(agent_name, f"Completed task: {agent_task}")
                except Exception as e:
                    yield send_log(agent_name, f"❌ Agent error: {str(e)}")
            else:
                yield send_log(agent_name, f"❌ Agent {agent_name} not found")

            yield send_event(agent_name, "FINISHED")
            time.sleep(1)

        # ✅ Step 4: Mark complete
        final_output = "✅ All agents completed their tasks successfully!"
        yield send_log("complete", "Completed task: all agents finished successfully.")
        yield send_event("complete", "FINISHED")
        yield agent_pb2.AgentUpdate(
            answer=agent_pb2.FinalAnswer(content=final_output)
        )
        workflow_state.deactivate()
        print("[Workflow] Finished workflow and sent final answer.")

        
# ----- Serve on 50052 -----
async def serve():
    server = grpc.aio.server()
    agent_pb2_grpc.add_ChatServiceServicer_to_server(ChatService(), server)
    agent_pb2_grpc.add_AgentServiceServicer_to_server(AgentService(), server)
    server.add_insecure_port('[::]:50052')
    await server.start()
    print("✅ Unified gRPC server running at http://localhost:50052")
    await server.wait_for_termination()

if __name__ == "__main__":
    asyncio.run(serve())