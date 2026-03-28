import heapq
import math


def run(nodes, edges, start, goal):
    """
    A* Search — weighted, optimal, informed.

    Expands nodes ordered by f(n) = g(n) + h(n) where:
        g(n) = actual cost from start to n
        h(n) = Euclidean distance from n to goal (admissible heuristic)
        f(n) = estimated total cost of cheapest path through n

    Because h(n) is admissible (never overestimates), A* is guaranteed
    to find the optimal path.

    Args:
        nodes : list of { id, position: { x, y }, type, ... }
        edges : list of { source, target, data: { weight } }
        start : node id string
        goal  : node id string

    Returns:
        {
            steps    : [ { current, visited, frontier, message }, ... ],
            path     : [ node_id, ... ],   # empty if no path found
            cost     : float,              # optimal path cost, -1 if not found
            heuristic: { node_id: h_value },  # for frontend node display
            f_scores : { node_id: f_value }   # for frontend node display
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

    # --- A* state ---
    # Heap entries: (f(n), tie_breaker, node_id)
    counter     = 0
    g_score     = {start: 0}                          # actual cost start → n
    f_score     = {start: heuristic[start]}           # f(n) = g(n) + h(n)
    heap        = [(f_score[start], counter, start)]
    visited     = []
    visited_set = set()
    parent      = {start: None}
    steps       = []

    steps.append({
        "current":  None,
        "visited":  [],
        "frontier": [start],
        "message":  (
            f"Initialising A*. Start: {start} | Goal: {goal} | "
            f"h({start})={heuristic[start]:.1f} | "
            f"f({start})={f_score[start]:.1f}"
        )
    })

    # --- Main A* loop ---
    while heap:
        f_current, _, current = heapq.heappop(heap)

        # Skip stale heap entries — a cheaper path was already found
        if current in visited_set:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": _frontier_ids(heap),
                "message":  (
                    f"Skipping {current} — already settled with lower f score"
                )
            })
            continue

        visited_set.add(current)
        visited.append(current)

        g_current = g_score[current]
        h_current = heuristic[current]

        steps.append({
            "current":  current,
            "visited":  list(visited),
            "frontier": _frontier_ids(heap),
            "message":  (
                f"Settling {current} | "
                f"g={g_current:.1f} + h={h_current:.1f} = f={f_current:.1f}"
            )
        })

        # --- Goal check ---
        if current == goal:
            path = _reconstruct_path(parent, start, goal)
            steps.append({
                "current":  goal,
                "visited":  list(visited),
                "frontier": [],
                "message":  (
                    f"Goal {goal} reached! "
                    f"Path: {' → '.join(path)} | "
                    f"Optimal cost: {g_current:.1f}"
                )
            })
            return {
                "steps":     steps,
                "path":      path,
                "cost":      g_current,
                "heuristic": {k: round(v, 2) for k, v in heuristic.items()},
                "f_scores":  {k: round(v, 2) for k, v in f_score.items()},
            }

        # --- Expand neighbours ---
        neighbours_added = []

        for neighbour, weight in graph[current]:
            if neighbour in visited_set:
                continue

            tentative_g = g_score[current] + weight

            # Only consider this path if it's cheaper than any known path
            if tentative_g < g_score.get(neighbour, math.inf):
                parent[neighbour]    = current
                g_score[neighbour]   = tentative_g
                h_n                  = heuristic[neighbour]
                f_n                  = tentative_g + h_n
                f_score[neighbour]   = f_n

                counter += 1
                heapq.heappush(heap, (f_n, counter, neighbour))
                neighbours_added.append((neighbour, tentative_g, h_n, f_n))

        if neighbours_added:
            added_msg = ", ".join(
                f"{n}(g:{g:.1f}+h:{h:.1f}=f:{f:.1f})"
                for n, g, h, f in neighbours_added
            )
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": _frontier_ids(heap),
                "message":  f"Expanded {current} → pushed: {added_msg}"
            })
        else:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": _frontier_ids(heap),
                "message":  (
                    f"Expanded {current} → "
                    f"no cheaper neighbours found"
                )
            })

    # --- No path found ---
    steps.append({
        "current":  None,
        "visited":  list(visited),
        "frontier": [],
        "message":  f"Open set exhausted. No path from {start} to {goal}."
    })
    return {
        "steps":     steps,
        "path":      [],
        "cost":      -1,
        "heuristic": {k: round(v, 2) for k, v in heuristic.items()},
        "f_scores":  {k: round(v, 2) for k, v in f_score.items()},
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _euclidean(x1, y1, x2, y2):
    """Straight-line distance between two canvas positions."""
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def _parse_weight(edge):
    """Safely extracts edge weight, defaults to 1 if missing or invalid."""
    try:
        return float(edge.get("data", {}).get("weight", 1))
    except (TypeError, ValueError):
        return 1.0


def _frontier_ids(heap):
    """Returns unique node ids currently in the open set."""
    return list({entry[2] for entry in heap})


def _reconstruct_path(parent, start, goal):
    """Walks the parent map backwards from goal → start."""
    path = []
    node = goal
    while node is not None:
        path.append(node)
        node = parent[node]
    path.reverse()
    return path