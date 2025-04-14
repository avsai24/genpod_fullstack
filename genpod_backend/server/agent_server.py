import grpc
from concurrent import futures
import time
import json
import random
import sys
import os

# Fix import path to include generated proto files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import agent_pb2
import agent_pb2_grpc


class AgentServiceServicer(agent_pb2_grpc.AgentServiceServicer):
    def StreamData(self, request, context):
        print(f"📡 Streaming data for tab: {request.tab}")

        while True:
            if request.tab == "metrics":
                metrics = [
                    {"name": "CPU Usage", "value": f"{random.randint(40, 90)}%"},
                    {"name": "Memory Usage", "value": f"{round(random.uniform(4.5, 7.9), 1)} GB"},
                    {"name": "Requests Handled", "value": str(random.randint(1000, 2000))},
                    {"name": "Active Threads", "value": str(random.randint(30, 60))}
                ]
                payload = json.dumps(metrics)
                yield agent_pb2.AgentResponse(type="metrics", json_payload=payload)
                time.sleep(2)
            else:
                yield agent_pb2.AgentResponse(
                    type="error",
                    json_payload=json.dumps({"error": f"Unsupported tab: {request.tab}"})
                )
                break


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    agent_pb2_grpc.add_AgentServiceServicer_to_server(AgentServiceServicer(), server)
    server.add_insecure_port('[::]:50052')
    server.start()
    print("✅ Agent server running at http://localhost:50052")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        print("🛑 Agent server stopped")
        server.stop(0)


if __name__ == "__main__":
    serve()