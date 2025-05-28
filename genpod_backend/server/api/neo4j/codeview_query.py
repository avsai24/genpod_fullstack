from fastapi import APIRouter
from pydantic import BaseModel
from neo4j import GraphDatabase
import os
import networkx as nx
from networkx.readwrite import json_graph
from server.agents.neo4j_agent import CypherAgent
import json

router = APIRouter()

class QueryRequest(BaseModel):
    prompt: str

@router.post("/codeview-query")
async def codeview_query(request: QueryRequest):
    prompt = request.prompt.strip()
    if not prompt:
        return {"error": "Empty prompt provided."}

    # 🔍 Convert prompt to Cypher query using agent
    agent = CypherAgent()
    cypher_query = "".join(agent.run(prompt, context={})).strip()
    print("🧠 Generated Cypher:\n", cypher_query)

    # 🔌 Connect to Neo4j
    uri = os.getenv("NEO4J_URL", "bolt://localhost:7687")
    username = os.getenv("NEO4J_USERNAME", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")

    G = nx.DiGraph()

    try:
        driver = GraphDatabase.driver(uri, auth=(username, password))
        with driver.session() as session:
            result = session.run(cypher_query)

            for record in result:
                print("🔎 Record Values:", record.values())

                for value in record.values():
                    print("🔧 Value Type:", type(value), value)

                    if hasattr(value, "labels"):
                        # ✅ Node
                        node_id = str(value.id)
                        label = list(value.labels)[0] if value.labels else "Unknown"
                        props = dict(value._properties)
                        name = props.pop("name", None) or props.get("title") or f"{label}_{node_id}"

                        G.add_node(node_id, label=label, name=name, **props)

                    elif hasattr(value, "type"):
                        # ✅ Relationship
                        start_id = str(value.start_node.id)
                        end_id = str(value.end_node.id)
                        rel_type = value.type

                        G.add_edge(start_id, end_id, type=rel_type)

        # 🔁 Convert to JSON
        graph_json = json_graph.node_link_data(G)
        print("✅ Final Graph JSON:\n", json.dumps(graph_json, indent=2))

        if not graph_json["nodes"]:
            return {"error": "No results for that query.", "cypher": cypher_query}

        return graph_json

    except Exception as e:
        return {"error": str(e), "cypher": cypher_query}