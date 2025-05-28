from fastapi import APIRouter
from neo4j import GraphDatabase
import os

router = APIRouter()

@router.get("/codeview-schema")
async def codeview_schema():
    uri = os.getenv("NEO4J_URL", "bolt://localhost:7687")
    username = os.getenv("NEO4J_USERNAME", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")

    driver = GraphDatabase.driver(uri, auth=(username, password))

    schema = {
        "nodes": {},
        "relationships": []
    }

    try:
        with driver.session() as session:
            # Node labels
            labels_result = session.run("CALL db.labels()")
            labels = [record["label"] for record in labels_result]

            # Relationship types
            rels_result = session.run("CALL db.relationshipTypes()")
            rels = [record["relationshipType"] for record in rels_result]
            schema["relationships"] = rels

            # Sample properties for each label
            for label in labels:
                props_result = session.run(f"MATCH (n:`{label}`) RETURN keys(n) AS props LIMIT 1")
                props_record = props_result.single()
                props = props_record["props"] if props_record else []
                schema["nodes"][label] = props

        return schema

    except Exception as e:
        return {"error": str(e)}