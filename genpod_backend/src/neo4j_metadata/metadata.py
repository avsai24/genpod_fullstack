from neo4j import GraphDatabase
import json
import os

uri = os.getenv("NEO4J_URL", "bolt://localhost:7687")
auth = (os.getenv("NEO4J_USERNAME", "neo4j"), os.getenv("NEO4J_PASSWORD", "password"))

driver = GraphDatabase.driver(uri, auth=auth)

query = """
CALL apoc.meta.data() 
YIELD label, property, type, other, elementType 
WHERE NOT label STARTS WITH '_' 
RETURN elementType, label, property, type, other
"""

with driver.session() as session:
    result = session.run(query)
    metadata = [record.data() for record in result]

with open("metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)