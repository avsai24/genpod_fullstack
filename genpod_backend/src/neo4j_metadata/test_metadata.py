import json

# Load your metadata
with open("/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_backend/src/neo4j_metadata/metadata.json") as f:
    metadata = json.load(f)

# Process metadata
node_descriptions = []
relationship_descriptions = []

for item in metadata:
    if item["elementType"] == "node":
        node_descriptions.append(f"(:{item['label']})")
    elif item["elementType"] == "relationship":
        targets = ", ".join(f":{t}" for t in item["other"])
        relationship_descriptions.append(f"(:{item['property']})-[:{item['label']}]->({targets})")

# De-duplicate
node_set = sorted(set(node_descriptions))
rel_set = sorted(set(relationship_descriptions))

# Build prompt string
schema_prompt = (
    "The database has:\n"
    f"- Nodes: {', '.join(node_set)}\n"
    f"- Relationships:\n" +
    "\n".join(rel_set)
)

print(schema_prompt)