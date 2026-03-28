# backend/routes/algorithm_routes.py

from flask import Blueprint, request, jsonify
from models.graph_validator import validate_payload
from algorithms import bfs, dfs, ucs, iddfs, dls, bidirectional
from algorithms import greedy, astar, hill_climbing, simulated_annealing

algorithm_bp = Blueprint("algorithm_bp", __name__)

# Maps the algorithm name sent from the frontend to its module's run() function
ALGORITHM_MAP = {
    "BFS":                bfs.run,
    "DFS":                dfs.run,
    "UCS":                ucs.run,
    "IDDFS":              iddfs.run,
    "DLS":                dls.run,
    "Bidirectional":      bidirectional.run,
    "Greedy Best-First":  greedy.run,
    "A*":                 astar.run,
    "Hill Climbing":      hill_climbing.run,
    "Simulated Annealing":simulated_annealing.run,
}

@algorithm_bp.route("/api/run", methods=["POST"])
def run_algorithm():
    data = request.get_json(silent=True)

    # --- Validate ---
    error = validate_payload(data)
    if error:
        return jsonify({"message": error}), 400

    algorithm  = data["algorithm"]
    nodes      = data["nodes"]
    edges      = data["edges"]
    start      = data["start"]
    goal       = data["goal"]

    # --- Dispatch ---
    runner = ALGORITHM_MAP.get(algorithm)
    if not runner:
        return jsonify({"message": f"Unknown algorithm: {algorithm}"}), 400

    try:
        result = runner(nodes, edges, start, goal)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500