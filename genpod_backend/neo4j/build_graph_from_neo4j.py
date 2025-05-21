from neo4j import GraphDatabase
import networkx as nx
from networkx.readwrite import json_graph
import json

# Connection settings
uri = "bolt://localhost:7687"
username = "neo4j"
password = "ABCabc@12345!"  # Use your actual password here

# Connect to Neo4j
driver = GraphDatabase.driver(uri, auth=(username, password))

# Build the graph
G = nx.DiGraph()

with driver.session() as session:
    # Adjusted for Movie Graph (Person → Movie)
    result = session.run("""
        MATCH (p:Person)-[r:ACTED_IN]->(m:Movie)
        RETURN p, r, m
    """)

    for record in result:
        person = record["p"]
        movie = record["m"]
        rel = record["r"]

        # Get names safely
        person_name = person.get("name", "Unknown Person")
        movie_title = movie.get("title", "Untitled Movie")

        # Add nodes with label
        G.add_node(person_name, label="Person")
        G.add_node(movie_title, label="Movie")

        # Add edge
        G.add_edge(person_name, movie_title, type="ACTED_IN")

# Output summary
print("✅ Graph built with", len(G.nodes), "nodes and", len(G.edges), "edges")
print("📦 Nodes:", list(G.nodes(data=True))[:10])
print("🔗 Edges:", list(G.edges(data=True))[:10])

# Convert to JSON
graph_json = json_graph.node_link_data(G)

# Pretty-print for inspection
print("📤 JSON Graph Data (first 500 chars):")
print(json.dumps(graph_json, indent=2)[:500])