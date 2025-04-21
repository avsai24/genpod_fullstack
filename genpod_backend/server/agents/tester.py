# genpod_backend/server/agents/tester.py

from .base import AgentBase
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

class TesterAgent(AgentBase):
    def __init__(self):
        super().__init__("Tester")
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.4
        )

        self.prompt = PromptTemplate.from_template(
            """
            You are a QA engineer. Your job is to write Python test cases using `pytest` or `unittest`
            for the following task:

            Task:
            {task}

            Only return Python test code. No explanations.
            """
        )

    def run(self, task: str, context: dict) -> str:
        try:
            prompt_value = self.prompt.invoke({"task": task})
            response = self.model.invoke(prompt_value)
            return response.content.strip()
        except Exception as e:
            return f"❌ TesterAgent failed: {str(e)}"