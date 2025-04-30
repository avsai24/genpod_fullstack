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

            Please respond **only** with a markdown ```python code block```, no extra explanation.
            """
        )

    def run(self, task: str, context: dict):
        prompt_value = self.prompt.invoke({"task": task})
        try:
            response_stream = self.model.stream(prompt_value)
            for chunk in response_stream:
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            yield f"❌ CoderAgent failed: {str(e)}"