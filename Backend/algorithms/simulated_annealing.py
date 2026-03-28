import math
import random


def run(nodes, edges, start, goal):
    """
    Simulated Annealing — probabilistic local search, not optimal.

    Escapes local optima by accepting worse moves with probability:

        P(accept) = e^(-Δh / T)

    where:
        Δh = h(neighbour) - h(current)   (positive means worse move)
        T  = current temperature

    As T → 0, P(accept worse) → 0, behaviour converges to Hill Climbing.
    As T → ∞, P(accept worse) → 1, behaviour converges to random walk.

    Temperature schedule: T(t) = T_start × cooling_rate^t

    Args:
        nodes : list of { id, position: { x, y }, type, ... }
        edges : list of { source, target, data: { weight } }
        start : node id string
        goal  : node id string

    Returns:
        {
            steps        : [ { current, visited, frontier, message }, ... ],
            path         : [ node_id, ... ],
            cost         : int,              # steps taken, -1 if not found
            heuristic    : { node_id: h },
            termination  : "goal" | "frozen" | "max_iterations",
            temperatures : [ float, ... ]    # T value at each accepted step
        }
    """

    # --- Temperature schedule constants ---
    T_START      = 100.0   # initial temperature — high = explore freely
    T_MIN        = 0.1     # frozen threshold — stop when T drops below this
    COOLING_RATE = 0.95    # multiply T by this each iteration
    MAX_ITER     = 1000    # hard cap — prevents infinite loops on large graphs

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

    # --- SA state ---
    current      = start
    path         = [start]
    temperatures = []
    T            = T_START
    iteration    = 0
    steps        = []

    steps.append({
        "current":  current,
        "visited":  [start],
        "frontier": [],
        "message":  (
            f"Initialising Simulated Annealing. "
            f"Start: {start} | Goal: {goal} | "
            f"T={T_START} | Cooling: {COOLING_RATE} | "
            f"h({start})={heuristic[start]:.1f}"
        )
    })

    # --- Main SA loop ---
    while T > T_MIN and iteration < MAX_ITER:

        iteration += 1

        # --- Goal check ---
        if current == goal:
            steps.append({
                "current":  current,
                "visited":  list(path),
                "frontier": [],
                "message":  (
                    f"Goal {goal} reached at iteration {iteration}! "
                    f"T={T:.2f} | "
                    f"Path: {' → '.join(path)} | "
                    f"Steps: {len(path) - 1}"
                )
            })
            return {
                "steps":        steps,
                "path":         path,
                "cost":         len(path) - 1,
                "heuristic":    {k: round(v, 2) for k, v in heuristic.items()},
                "termination":  "goal",
                "temperatures": temperatures
            }

        # --- Pick a random neighbour ---
        neighbours = graph[current]

        if not neighbours:
            steps.append({
                "current":  current,
                "visited":  list(path),
                "frontier": [],
                "message":  (
                    f"Dead end at {current} — no neighbours. "
                    f"Cannot continue."
                )
            })
            break

        neighbour, _ = random.choice(neighbours)
        delta_h      = heuristic[neighbour] - heuristic[current]

        # --- Acceptance decision ---
        if delta_h < 0:
            # Better move — always accept
            accept      = True
            probability = 1.0
            decision    = "better move → accepted"
        else:
            # Worse or equal move — accept probabilistically
            probability = math.exp(-delta_h / T)
            accept      = random.random() < probability
            decision    = (
                f"worse move (Δh=+{delta_h:.1f}) → "
                f"P(accept)={probability:.3f} → "
                f"{'ACCEPTED ✓' if accept else 'rejected ✗'}"
            )

        steps.append({
            "current":  current,
            "visited":  list(path),
            "frontier": [neighbour],
            "message":  (
                f"Iter {iteration} | T={T:.2f} | "
                f"{current}(h:{heuristic[current]:.1f}) → "
                f"{neighbour}(h:{heuristic[neighbour]:.1f}) | "
                f"{decision}"
            )
        })

        # --- Move if accepted ---
        if accept:
            current = neighbour
            path.append(current)
            temperatures.append(round(T, 3))

            steps.append({
                "current":  current,
                "visited":  list(path),
                "frontier": [],
                "message":  (
                    f"Moved to {current} | "
                    f"h={heuristic[current]:.1f} | "
                    f"T={T:.2f}"
                )
            })

        # --- Cool the temperature ---
        T *= COOLING_RATE

    # --- Termination: frozen or max iterations ---
    if current == goal:
        # Caught by cooling — goal was reached on final iteration
        path_display = ' → '.join(path)
        steps.append({
            "current":  current,
            "visited":  list(path),
            "frontier": [],
            "message":  (
                f"Goal {goal} reached as temperature froze. "
                f"Path: {path_display} | Steps: {len(path) - 1}"
            )
        })
        return {
            "steps":        steps,
            "path":         path,
            "cost":         len(path) - 1,
            "heuristic":    {k: round(v, 2) for k, v in heuristic.items()},
            "termination":  "frozen",
            "temperatures": temperatures
        }

    termination = "frozen" if T <= T_MIN else "max_iterations"
    reason = (
        f"Temperature frozen (T={T:.2f} ≤ {T_MIN})"
        if termination == "frozen"
        else f"Max iterations ({MAX_ITER}) reached"
    )

    steps.append({
        "current":  current,
        "visited":  list(path),
        "frontier": [],
        "message":  (
            f"{reason}. "
            f"Goal not reached. Final node: {current} | "
            f"h={heuristic[current]:.1f} | "
            f"Tip: increase T_START or decrease cooling rate."
        )
    })
    return {
        "steps":        steps,
        "path":         path,
        "cost":         -1,
        "heuristic":    {k: round(v, 2) for k, v in heuristic.items()},
        "termination":  termination,
        "temperatures": temperatures
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _euclidean(x1, y1, x2, y2):
    """Straight-line distance between two canvas positions."""
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def _parse_weight(edge):
    """Safely extracts edge weight, defaults to 1."""
    try:
        return float(edge.get("data", {}).get("weight", 1))
    except (TypeError, ValueError):
        return 1.0