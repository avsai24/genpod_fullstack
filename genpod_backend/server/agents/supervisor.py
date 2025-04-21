# genpod_backend/server/agents/supervisor.py

from .base import AgentBase
import os
import json
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

class SupervisorAgent(AgentBase):
    def __init__(self):
        super().__init__("Supervisor")
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.7
        )

        self.parser = JsonOutputParser()

        self.prompt = PromptTemplate.from_template(
            """
            You are a Supervisor AI. Your job is to break down a task into subtasks and assign them to agents.

            Agents available:
            - Coder: builds the core functionality
            - Tester: writes tests
            - Reviewer: reviews code and tests

            Task: {task}

            Respond ONLY with a JSON array of objects like:
            [
              {{ "agent": "Coder", "task": "Implement X" }},
              {{ "agent": "Tester", "task": "Write tests for X" }}
            ]
            """
        )

    def run(self, task: str, context: dict) -> str:
        try:
            prompt_value = self.prompt.invoke({"task": task})
            response = self.model.invoke(prompt_value)
            parsed = self.parser.invoke(response)

            subtasks = [(entry["agent"], entry["task"]) for entry in parsed]
            context["subtasks"] = subtasks
            return f"Assigned subtasks to: {[a for a, _ in subtasks]}"
        except Exception as e:
            context["subtasks"] = []
            return f"❌ Failed to generate subtasks: {str(e)}"