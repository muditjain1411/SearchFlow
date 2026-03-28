REQUIRED_KEYS = {"algorithm", "nodes", "edges", "start", "goal"}

VALID_ALGORITHMS = {
    "BFS", "DFS", "UCS", "IDDFS", "DLS", "Bidirectional",
    "Greedy Best-First", "A*", "Hill Climbing", "Simulated Annealing",
}


def validate_payload(data: dict) -> str | None:
    """
    Validates the incoming graph payload from the frontend.
    Returns an error message string if invalid, or None if clean.
    """

    # 1. Payload must exist and be a dict
    if not data or not isinstance(data, dict):
        return "Request body is missing or not valid JSON."

    # 2. All required top-level keys must be present
    missing = REQUIRED_KEYS - data.keys()
    if missing:
        return f"Missing required fields: {', '.join(sorted(missing))}"

    # 3. Algorithm must be a known value
    algorithm = data["algorithm"]
    if algorithm not in VALID_ALGORITHMS:
        return f"Unknown algorithm: '{algorithm}'. Valid options: {', '.join(sorted(VALID_ALGORITHMS))}"

    # 4. Nodes must be a non-empty list
    nodes = data["nodes"]
    if not isinstance(nodes, list) or len(nodes) == 0:
        return "Field 'nodes' must be a non-empty list."

    # 5. Each node must have an 'id' field
    node_ids = set()
    for i, node in enumerate(nodes):
        if not isinstance(node, dict) or "id" not in node:
            return f"Node at index {i} is missing required field 'id'."
        node_ids.add(node["id"])

    # 6. Edges must be a list (can be empty for single-node graphs)
    edges = data["edges"]
    if not isinstance(edges, list):
        return "Field 'edges' must be a list."

    # 7. Each edge must have 'source' and 'target' that reference real node ids
    for i, edge in enumerate(edges):
        if not isinstance(edge, dict):
            return f"Edge at index {i} is not a valid object."
        if "source" not in edge or "target" not in edge:
            return f"Edge at index {i} is missing 'source' or 'target'."
        if edge["source"] not in node_ids:
            return f"Edge at index {i} has unknown source: '{edge['source']}'."
        if edge["target"] not in node_ids:
            return f"Edge at index {i} has unknown target: '{edge['target']}'."

    # 8. Start and goal must reference real node ids
    if data["start"] not in node_ids:
        return f"'start' node '{data['start']}' does not exist in nodes list."
    if data["goal"] not in node_ids:
        return f"'goal' node '{data['goal']}' does not exist in nodes list."

    # 9. Start and goal must be different nodes
    if data["start"] == data["goal"]:
        return "'start' and 'goal' cannot be the same node."

    return None