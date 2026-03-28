import heapq
import math


def run(nodes, edges, start, goal):
    """
    Greedy Best-First Search — weighted (heuristic), not optimal.

    Expands the node that appears closest to the goal by straight-line
    (Euclidean) distance, ignoring the actual cost to reach it.

    Heuristic: h(n) = Euclidean distance between node n and goal positions.
    Positions are taken from node["position"]["x"] / node["position"]["y"]
    as sent by the frontend.

    Args:
        nodes : list of { id, position: { x, y }, type, ... }
        edges : list of { source, target, data: { weight } }
        start : node id string
        goal  : node id string

    Returns:
        {
            steps    : [ { current, visited, frontier, message }, ... ],
            path     : [ node_id, ... ],   # empty if no path found
            cost     : float,              # actual edge cost of path, -1 if not found
            heuristic: { node_id: h_value } # sent back for frontend display
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

    # --- Pre-compute heuristic for every node ---
    goal_x, goal_y = positions[goal]
    heuristic = {
        nid: _euclidean(x, y, goal_x, goal_y)
        for nid, (x, y) in positions.items()
    }

    # --- Greedy state ---
    # Heap entries: (h(n), tie_breaker, node_id)
    counter     = 0
    heap        = [(heuristic[start], counter, start)]
    visited     = []
    visited_set = set()
    parent      = {start: None}
    cost_so_far = {start: 0}   # track actual cost for the return payload
    steps       = []

    steps.append({
        "current":  None,
        "visited":  [],
        "frontier": [start],
        "message":  (
            f"Initialising Greedy Best-First. Start: {start} | Goal: {goal} | "
            f"h({start})={heuristic[start]:.1f} | h({goal})=0.0"
        )
    })

    # --- Main loop ---
    while heap:
        h_current, _, current = heapq.heappop(heap)

        # Skip already-settled nodes
        if current in visited_set:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": _frontier_ids(heap),
                "message":  f"Skipping {current} — already visited"
            })
            continue

        visited_set.add(current)
        visited.append(current)

        steps.append({
            "current":  current,
            "visited":  list(visited),
            "frontier": _frontier_ids(heap),
            "message":  (
                f"Visiting {current} | "
                f"h({current})={h_current:.1f} — "
                f"{'goal!' if current == goal else 'not goal, expanding'}"
            )
        })

        # --- Goal check ---
        if current == goal:
            path = _reconstruct_path(parent, start, goal)
            total_cost = cost_so_far[goal]
            steps.append({
                "current":  goal,
                "visited":  list(visited),
                "frontier": [],
                "message":  (
                    f"Goal {goal} reached! "
                    f"Path: {' → '.join(path)} | "
                    f"Actual cost: {total_cost} | "
                    f"Note: Greedy is NOT guaranteed to find the cheapest path."
                )
            })
            return {
                "steps":     steps,
                "path":      path,
                "cost":      total_cost,
                "heuristic": {k: round(v, 2) for k, v in heuristic.items()}
            }

        # --- Expand neighbours ---
        neighbours_added = []
        for neighbour, weight in graph[current]:
            if neighbour in visited_set:
                continue

            # Greedy only cares about h(n) — actual cost is tracked but
            # not used for ordering
            h_n        = heuristic[neighbour]
            new_cost   = cost_so_far[current] + weight

            # Push even if already in heap — stale entries get skipped above
            if neighbour not in parent:
                parent[neighbour]      = current
                cost_so_far[neighbour] = new_cost

            counter += 1
            heapq.heappush(heap, (h_n, counter, neighbour))
            neighbours_added.append((neighbour, round(h_n, 1)))

        if neighbours_added:
            added_msg = ", ".join(f"{n}(h:{h})" for n, h in neighbours_added)
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
                "message":  f"Expanded {current} → dead end, no new neighbours"
            })

    # --- No path found ---
    steps.append({
        "current":  None,
        "visited":  list(visited),
        "frontier": [],
        "message":  f"Frontier exhausted. No path from {start} to {goal}."
    })
    return {
        "steps":     steps,
        "path":      [],
        "cost":      -1,
        "heuristic": {k: round(v, 2) for k, v in heuristic.items()}
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
    """Returns unique node ids currently in the heap."""
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