import os
import re
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from .base import AgentBase

class CypherAgent(AgentBase):
    def __init__(self):
        super().__init__("CypherAgent")

        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.3,
        )

        # === Load metadata ===
        try:
            metadata_path = os.path.join(
                os.path.dirname(__file__),
                "../../src/neo4j_metadata/metadata.json"
            )
            metadata_path = os.path.abspath(metadata_path)

            with open(metadata_path, "r") as f:
                metadata = json.load(f)
        except Exception as e:
            print(f"❌ Failed to load metadata.json: {e}")
            metadata = []

        # === Generate prompt info ===
        node_labels = set()
        relationship_lines = []

        for entry in metadata:
            if entry.get("elementType") == "node":
                node_labels.add(entry["label"])
            elif entry.get("elementType") == "relationship":
                from_label = entry["property"]
                rel_type = entry["label"]
                for to_label in entry.get("other", []):
                    relationship_lines.append(f"(:{from_label})-[:{rel_type}]->(:{to_label})")

        nodes_str = ", ".join(f"(:{label})" for label in sorted(node_labels))
        relationships_str = "\n" + "\n".join(relationship_lines)

        self.template_string = f"""You are a Neo4j expert.

Convert the following natural language prompt into a valid Cypher query.

The database has:
- Nodes: {nodes_str}
- Relationships:
{relationships_str}

Rules:
- Always return nodes and relationships (e.g., RETURN n, r, m).
- Never use scalar or aggregation functions like count(), sum(), avg(), etc.
- The query must be visualizable as a graph.
- Only return the Cypher query without explanation or markdown formatting.

Examples:
1. Prompt: Show all files and the classes or functions they contain  
   Cypher: MATCH (f:File)-[r:CONTAINS]->(x) RETURN f, r, x

2. Prompt: What functions are called by other functions?  
   Cypher: MATCH (f1:Function)-[r:CALLS]->(f2:Function) RETURN f1, r, f2

3. Prompt: Show inheritance relationships among classes  
   Cypher: MATCH (c1:Class)-[r:INHERITS_FROM]->(c2:Class) RETURN c1, r, c2

Prompt: {{prompt}}"""

        self.prompt = PromptTemplate.from_template(self.template_string.strip())

    def clean_cypher(self, raw: str) -> str:
        match = re.search(r"```(?:cypher)?\s*(.*?)\s*```", raw, re.DOTALL)
        if match:
            return match.group(1).strip()
        return raw.strip()

    def run(self, task: str, context: dict):
        print("🔍 Prompt Template Used:\n")
        print(self.template_string)

        prompt_value = self.prompt.invoke({"prompt": task})
        buffer = ""
        try:
            response_stream = self.model.stream(prompt_value)
            for chunk in response_stream:
                if chunk.content:
                    buffer += chunk.content
            cleaned = self.clean_cypher(buffer)
            yield cleaned
        except Exception as e:
            yield f"❌ CypherAgent failed: {str(e)}"


if __name__ == "__main__":
    agent = CypherAgent()
    result = "".join(agent.run("Show all classes that inherit from another class", context={}))
    print("🧠 Cleaned Cypher:\n", result)