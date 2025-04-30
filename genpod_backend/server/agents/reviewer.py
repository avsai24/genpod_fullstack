from .base import AgentBase
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

class ReviewerAgent(AgentBase):
    def __init__(self):
        super().__init__("Reviewer")
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.5,
        )

        self.prompt = PromptTemplate.from_template(
            """
            You are a senior code reviewer.

            Please review the following task and give feedback on code quality, design, readability, and best practices.

            Task:
            {task}

            Respond with suggestions for improvement or confirm it's well done.
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
            yield f"❌ ReviewerAgent failed: {str(e)}"