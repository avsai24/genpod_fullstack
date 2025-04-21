# genpod_backend/server/agent_engine.py

from agents.supervisor import SupervisorAgent
from agents.coder import CoderAgent
from agents.tester import TesterAgent
from agents.reviewer import ReviewerAgent

# Register available agents
AGENT_MAP = {
    "Coder": CoderAgent(),
    "Tester": TesterAgent(),
    "Reviewer": ReviewerAgent(),
}

def run_agent_workflow(user_prompt: str):
    context = {}

    # Step 1: Let the Supervisor break it down
    supervisor = SupervisorAgent()
    print(f"🔵 Supervisor received task: {user_prompt}")
    supervisor_summary = supervisor.run(user_prompt, context)
    print(f"🔵 Supervisor summary: {supervisor_summary}")

    # Step 2: Run each subtask assigned to agents
    for agent_name, subtask in context.get("subtasks", []):
        agent = AGENT_MAP.get(agent_name)
        if agent:
            print(f"\n🚀 Running {agent_name} on: {subtask}")
            result = agent.run(subtask, context)
            print(f"✅ {agent_name} Result: {result}")
        else:
            print(f"⚠️ No registered agent found for: {agent_name}")