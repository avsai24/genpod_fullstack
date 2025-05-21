import grpc
import json
from server import agent_pb2, agent_pb2_grpc

channel = grpc.insecure_channel('localhost:50052')
stub = agent_pb2_grpc.AgentServiceStub(channel)

request = agent_pb2.AgentRequest(tab="codeview")
responses = stub.StreamData(request)

for response in responses:
    if response.type == "codeview":
        data = json.loads(response.json_payload)
        print("🔗 Graph Received:")
        print(json.dumps(data, indent=2))
        break