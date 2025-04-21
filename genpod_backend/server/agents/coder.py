# genpod_backend/server/agents/coder.py

from .base import AgentBase
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

class CoderAgent(AgentBase):
    def __init__(self):
        super().__init__("Coder")
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.4,
        )

        self.prompt = PromptTemplate.from_template(
            """
            You are a senior software engineer.

            Your job is to generate clean, well-commented code for the following task:

            Task:
            {task}

            Respond only with the code block. No explanation needed.
            """
        )

    def run(self, task: str, context: dict) -> str:
        try:
            prompt_value = self.prompt.invoke({"task": task})
            response = self.model.invoke(prompt_value)
            return response.content.strip()
        except Exception as e:
            return f"❌ CoderAgent failed: {str(e)}"