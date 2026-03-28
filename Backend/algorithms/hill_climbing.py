import math


def run(nodes, edges, start, goal):
    """
    Hill Climbing (Steepest Ascent) — local search, unweighted, not optimal.

    At each step, moves to the neighbour with the lowest h(n) (greedy local
    move toward goal). Stops when:
        (a) goal is reached — success
        (b) no neighbour improves on current h(n) — local optimum, failure

    No backtracking. No frontier. No memory beyond the current node.

    Heuristic: h(n) = Euclidean distance from n to goal.

    Args:
        nodes : list of { id, position: { x, y }, type, ... }
        edges : list of { source, target, data: { weight } }
        start : node id string
        goal  : node id string

    Returns:
        {
            steps      : [ { current, visited, frontier, message }, ... ],
            path       : [ node_id, ... ],   # nodes visited in order, empty if stuck immediately
            cost       : int,                # steps taken, -1 if local optimum
            heuristic  : { node_id: h_value },
            termination: "goal" | "local_optimum" | "visited_cycle"
        }
    """

    # --- Build position lookup and adjacency list ---
    positions = {}
    graph     = {}

    for node in nodes:
        nid = node["id"]
        positions[nid] = (
            node.get("position", {}).get("x", 0),
            node.get("position", {}).get("y", 0),
        )
        graph[nid] = []

    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        weight   = _parse_weight(edge)
        graph[src].append((tgt, weight))
        graph[tgt].append((src, weight))  # undirected

    # --- Pre-compute heuristic h(n) for every node ---
    goal_x, goal_y = positions[goal]
    heuristic = {
        nid: _euclidean(x, y, goal_x, goal_y)
        for nid, (x, y) in positions.items()
    }

    # --- Hill Climbing state ---
    current     = start
    path        = [start]        # ordered sequence of nodes visited
    visited_set = {start}        # cycle detection — hill climbing can loop
    steps       = []

    steps.append({
        "current":  current,
        "visited":  [start],
        "frontier": [],
        "message":  (
            f"Initialising Hill Climbing. Start: {start} | Goal: {goal} | "
            f"h({start})={heuristic[start]:.1f}"
        )
    })

    # --- Main loop ---
    while True:

        # --- Goal check ---
        if current == goal:
            steps.append({
                "current":  current,
                "visited":  list(path),
                "frontier": [],
                "message":  (
                    f"Goal {goal} reached! "
                    f"Path: {' → '.join(path)} | "
                    f"Steps taken: {len(path) - 1}"
                )
            })
            return {
                "steps":       steps,
                "path":        path,
                "cost":        len(path) - 1,
                "heuristic":   {k: round(v, 2) for k, v in heuristic.items()},
                "termination": "goal"
            }

        # --- Evaluate all neighbours ---
        neighbours = graph[current]

        if not neighbours:
            steps.append({
                "current":  current,
                "visited":  list(path),
                "frontier": [],
                "message":  (
                    f"Dead end at {current} — no neighbours exist. "
                    f"Hill Climbing cannot proceed."
                )
            })
            return {
                "steps":       steps,
                "path":        path,
                "cost":        -1,
                "heuristic":   {k: round(v, 2) for k, v in heuristic.items()},
                "termination": "local_optimum"
            }

        # --- Find the best neighbour (lowest h) ---
        best_neighbour  = None
        best_h          = math.inf
        neighbour_evals = []

        for neighbour, _ in neighbours:
            h_n = heuristic[neighbour]
            neighbour_evals.append((neighbour, h_n))
            if h_n < best_h:
                best_h         = h_n
                best_neighbour = neighbour

        # Log the evaluation of all neighbours
        eval_msg = ", ".join(
            f"{n}(h:{h:.1f})" for n, h in neighbour_evals
        )
        steps.append({
            "current":  current,
            "visited":  list(path),
            "frontier": [best_neighbour],
            "message":  (
                f"At {current} h={heuristic[current]:.1f} | "
                f"Neighbours: {eval_msg} | "
                f"Best: {best_neighbour}(h:{best_h:.1f})"
            )
        })

        # --- Local optimum check ---
        # If best neighbour is no better than current, we are stuck
        if best_h >= heuristic[current]:
            steps.append({
                "current":  current,
                "visited":  list(path),
                "frontier": [],
                "message":  (
                    f"Local optimum at {current} — "
                    f"best neighbour {best_neighbour} has "
                    f"h={best_h:.1f} ≥ current h={heuristic[current]:.1f}. "
                    f"No uphill move available. Stopping."
                )
            })
            return {
                "steps":       steps,
                "path":        path,
                "cost":        -1,
                "heuristic":   {k: round(v, 2) for k, v in heuristic.items()},
                "termination": "local_optimum"
            }

        # --- Cycle detection ---
        # Hill climbing can revisit nodes on graphs with cycles
        if best_neighbour in visited_set:
            steps.append({
                "current":  current,
                "visited":  list(path),
                "frontier": [],
                "message":  (
                    f"Cycle detected — best neighbour {best_neighbour} "
                    f"was already visited. Stopping to avoid infinite loop."
                )
            })
            return {
                "steps":       steps,
                "path":        path,
                "cost":        -1,
                "heuristic":   {k: round(v, 2) for k, v in heuristic.items()},
                "termination": "visited_cycle"
            }

        # --- Move to best neighbour ---
        steps.append({
            "current":  best_neighbour,
            "visited":  list(path) + [best_neighbour],
            "frontier": [],
            "message":  (
                f"Moving {current}(h:{heuristic[current]:.1f}) → "
                f"{best_neighbour}(h:{best_h:.1f}) ↓ improvement: "
                f"{heuristic[current] - best_h:.1f}"
            )
        })

        current = best_neighbour
        path.append(current)
        visited_set.add(current)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _euclidean(x1, y1, x2, y2):
    """Straight-line distance between two canvas positions."""
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def _parse_weight(edge):
    try:
        # Frontend sends flat { source, target, weight } — no data wrapper
        w = edge.get("weight") or edge.get("data", {}).get("weight", 1)
        return float(w)
    except (TypeError, ValueError):
        return 1.0