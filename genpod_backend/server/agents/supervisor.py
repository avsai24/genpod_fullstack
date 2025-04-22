# genpod_backend/server/agents/supervisor.py

import os
from dotenv import load_dotenv
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

# ✅ Load the .env file with your GEMINI_API_KEY
load_dotenv()

class SupervisorAgent:
    def __init__(self):
        # ✅ Use the API key from environment
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("❌ GEMINI_API_KEY not found in environment.")

        self.model = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",  # or gemini-2.0-flash if needed
            google_api_key=api_key,
            temperature=0.7
        )

        # ✅ Define the structured prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Supervisor AI. Your job is to break a high-level task into subtasks and assign them to the right agents in JSON.\n\nAgents available:\n- Coder: builds the functionality\n- Tester: writes tests\n- Reviewer: reviews the work.\n\nReturn only a JSON array."),
            ("human", "{input}")
        ])

        self.parser = JsonOutputParser()

    def generate_subtasks(self, user_input: str) -> str:
        try:
            chain = self.prompt | self.model
            response = chain.invoke({"input": user_input})
            return response.content  # This will be a JSON string
        except Exception as e:
            print("❌ Error in SupervisorAgent:", e)
            raise