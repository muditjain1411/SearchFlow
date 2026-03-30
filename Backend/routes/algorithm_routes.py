from flask import Blueprint, request, jsonify
from models.graph_validator import validate_payload
from algorithms import bfs, dfs, ucs, iddfs, dls, bidirectional
from algorithms import greedy, astar, hill_climbing, simulated_annealing

algorithm_bp = Blueprint("algorithm_bp", __name__)

ALGORITHM_MAP = {
    "BFS":                 bfs.run,
    "DFS":                 dfs.run,
    "UCS":                 ucs.run,
    "IDDFS":               iddfs.run,
    "DLS":                 dls.run,
    "Bidirectional":       bidirectional.run,
    "Greedy Best-First":   greedy.run,
    "A*":                  astar.run,
    "Hill Climbing":       hill_climbing.run,
    "Simulated Annealing": simulated_annealing.run,
}


def _replace_ids_in_message(message, label_map):
    """Replace raw node IDs in a message string with human-readable labels.
    Sort by length descending so longer IDs are replaced before any prefix matches.
    Only replaces in the message string — animation id arrays are left untouched.
    """
    for node_id in sorted(label_map, key=len, reverse=True):
        message = message.replace(node_id, label_map[node_id])
    return message


def _humanise_messages(result, label_map):
    """Rewrite only the message strings in each step. 
    visited/frontier/current/path arrays keep raw IDs so frontend animation works.
    """
    for step in result.get("steps", []):
        if step.get("message"):
            step["message"] = _replace_ids_in_message(step["message"], label_map)
    return result


@algorithm_bp.route("/api/run", methods=["POST"])
def run_algorithm():
    data = request.get_json(silent=True)

    error = validate_payload(data)
    if error:
        return jsonify({"message": error}), 400

    algorithm = data["algorithm"]
    nodes     = data["nodes"]
    edges     = data["edges"]
    start     = data["start"]
    goal      = data["goal"]

    label_map = {n["id"]: n.get("label", n["id"]) for n in nodes}

    runner = ALGORITHM_MAP.get(algorithm)
    if not runner:
        return jsonify({"message": f"Unknown algorithm: {algorithm}"}), 400

    try:
        if algorithm == "DLS":
            depth_limit = int(data.get("depth_limit", 5))
            result = runner(nodes, edges, start, goal, depth_limit=depth_limit)
        else:
            result = runner(nodes, edges, start, goal)

        result = _humanise_messages(result, label_map)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500