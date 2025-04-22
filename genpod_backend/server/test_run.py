import grpc
import agent_pb2
import agent_pb2_grpc

channel = grpc.insecure_channel("localhost:50052")
stub = agent_pb2_grpc.AgentServiceStub(channel)

request = agent_pb2.WorkflowRequest(
    user_id="test_user",
    prompt="Build a chatbot web application"
)

for update in stub.RunAgentWorkflow(request):
    print("--- Received Update ---")
    if update.HasField("log"):
        print(f"[LOG] {update.log.agent_name}: {update.log.message}")
    elif update.HasField("event"):
        print(f"[EVENT] {update.event.agent_name} - {update.event.status}")
    elif update.HasField("answer"):
        print(f"[FINAL ANSWER] {update.answer.content}")