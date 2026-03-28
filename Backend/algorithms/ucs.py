import heapq


def run(nodes, edges, start, goal):
    """
    Uniform Cost Search — weighted, optimal by path cost.

    Args:
        nodes : list of { id, position: { x, y }, ... }
        edges : list of { source, target, data: { weight } }
        start : node id string
        goal  : node id string

    Returns:
        {
            steps : [ { current, visited, frontier, message }, ... ],
            path  : [ node_id, ... ],   # empty if no path found
            cost  : float               # total path cost, -1 if no path
        }
    """

    # --- Build weighted adjacency list (undirected) ---
    graph = {node["id"]: [] for node in nodes}
    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        weight = _parse_weight(edge)
        graph[src].append((tgt, weight))
        graph[tgt].append((src, weight))  # undirected

    # --- UCS state ---
    # Heap entries: (cumulative_cost, tie_breaker, node_id)
    # tie_breaker ensures stable ordering when costs are equal
    counter  = 0
    heap     = [(0, counter, start)]
    visited  = []          # ordered visited list for animation
    visited_set = set()    # fast membership check
    cost_so_far = {start: 0}        # best known cost to reach each node
    parent      = {start: None}     # to reconstruct path
    steps       = []

    steps.append({
        "current":  None,
        "visited":  [],
        "frontier": [start],
        "message":  f"Initialising UCS. Start: {start} | Goal: {goal} | All edge weights loaded."
    })

    # --- Main UCS loop ---
    while heap:
        current_cost, _, current = heapq.heappop(heap)

        # Skip if we already found a cheaper path to this node
        if current in visited_set:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": _frontier_ids(heap),
                "message":  f"Skipping {current} — already settled at lower cost"
            })
            continue

        visited_set.add(current)
        visited.append(current)

        steps.append({
            "current":  current,
            "visited":  list(visited),
            "frontier": _frontier_ids(heap),
            "message":  f"Settling {current} | Cost so far: {current_cost}"
        })

        # --- Goal check ---
        if current == goal:
            path = _reconstruct_path(parent, start, goal)
            steps.append({
                "current":  goal,
                "visited":  list(visited),
                "frontier": [],
                "message":  f"Goal {goal} reached! Path: {' → '.join(path)} | Total cost: {current_cost}"
            })
            return {
                "steps": steps,
                "path":  path,
                "cost":  current_cost
            }

        # --- Expand neighbours ---
        neighbours_added = []
        for neighbour, weight in graph[current]:
            if neighbour in visited_set:
                continue

            new_cost = current_cost + weight

            # Only push if we found a cheaper route to this neighbour
            if neighbour not in cost_so_far or new_cost < cost_so_far[neighbour]:
                cost_so_far[neighbour] = new_cost
                parent[neighbour] = current
                counter += 1
                heapq.heappush(heap, (new_cost, counter, neighbour))
                neighbours_added.append((neighbour, new_cost))

        if neighbours_added:
            added_msg = ", ".join(f"{n}(cost:{c})" for n, c in neighbours_added)
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
                "message":  f"Expanded {current} → no cheaper neighbours found"
            })

    # --- No path found ---
    steps.append({
        "current":  None,
        "visited":  list(visited),
        "frontier": [],
        "message":  f"Priority queue exhausted. No path from {start} to {goal}."
    })
    return {
        "steps": steps,
        "path":  [],
        "cost":  -1
    }


# --- Helpers ---

def _parse_weight(edge):
    """Safely extracts edge weight, defaults to 1 if missing or invalid."""
    try:
        return float(edge.get("data", {}).get("weight", 1))
    except (TypeError, ValueError):
        return 1.0


def _frontier_ids(heap):
    """Returns just the node ids currently in the heap for frontend display."""
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