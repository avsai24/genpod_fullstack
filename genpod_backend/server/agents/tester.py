# server/agents/tester.py

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
            temperature=0.4,
        )

        self.prompt = PromptTemplate.from_template(
            """
            You are a senior QA engineer.

            Task:
            {task}

            Generate detailed and well-structured test cases or test code as required. 
            Respond only with a markdown ```python code block```, no extra explanation.
            """
        )

    def run(self, task: str, context: dict):
        try:
            prompt_value = self.prompt.invoke({"task": task})
            response_stream = self.model.stream(prompt_value)
            for chunk in response_stream:
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            yield f"❌ TesterAgent failed: {str(e)}"