import json
from server.agents.supervisor import SupervisorAgent
from server.agents.coder import CoderAgent
from server.agents.tester import TesterAgent
from server.agents.reviewer import ReviewerAgent

print("🟩 agent_engine.py loaded")

AGENT_REGISTRY = {
    "Coder": CoderAgent(),
    "Tester": TesterAgent(),
    "Reviewer": ReviewerAgent(),
}

def run_agent_workflow(prompt: str, context: dict):
    yield f"🧠 [AgentEngine] Prompt received: {prompt}"

    supervisor = SupervisorAgent()
    try:
        response = supervisor.generate_subtasks(prompt)
        yield f"🔵 Raw Gemini Response: {repr(response)}"

        subtasks = parse_gemini_json(response)
        if not subtasks:
            yield "⚠️ Supervisor returned no subtasks"
            return

        context["subtasks"] = subtasks
        context["Supervisor"] = f"Assigned subtasks to: {[s[0] for s in subtasks]}"
        yield f"✅ Context after Supervisor: {context['Supervisor']}"

    except Exception as e:
        yield f"❌ Error in SupervisorAgent: {str(e)}"
        return

    for agent_name, task in subtasks:
        yield f"🚀 [AgentEngine] Running {agent_name} on: {task}"
        try:
            agent = AGENT_REGISTRY.get(agent_name)
            if not agent:
                yield f"⚠️ Unknown agent: {agent_name}"
                continue

            output = agent.run(task, context)
            context.setdefault(agent_name, []).append(output)

            for line in str(output).splitlines():
                yield line

        except Exception as e:
            yield f"❌ Error in {agent_name}: {str(e)}"

    yield f"📦 [AgentEngine] Final Context Dump:\n {json.dumps(context, indent=2)}"


def parse_gemini_json(response):
    try:
        if isinstance(response, str):
            response = response.strip()

        if "```json" in response:
            response = response.split("```json")[-1].split("```")[0].strip()

        parsed = json.loads(response)
        return [(item["agent"], item["task"]) for item in parsed if "agent" in item and "task" in item]

    except Exception as e:
        print("❌ Failed to parse Gemini response:", e)
        return []