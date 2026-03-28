def run(nodes, edges, start, goal):
    """
    Depth-First Search — unweighted, not optimal.

    Args:
        nodes : list of { id, position: { x, y }, ... }
        edges : list of { source, target, data: { weight } }
        start : node id string
        goal  : node id string

    Returns:
        {
            steps : [ { current, visited, frontier, message }, ... ],
            path  : [ node_id, ... ],   # empty if no path found
            cost  : int                 # edge count, -1 if no path
        }
    """

    # --- Build adjacency list (undirected) ---
    graph = {node["id"]: [] for node in nodes}
    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        graph[src].append(tgt)
        graph[tgt].append(src)  # undirected — both directions

    # --- DFS state ---
    stack        = [start]         # LIFO — top of stack is next to explore
    visited      = []              # ordered visited list for animation
    visited_set  = set()           # fast membership check
    parent       = {start: None}   # to reconstruct path
    steps        = []

    # Record the initial state before the loop starts
    steps.append({
        "current":  None,
        "visited":  [],
        "frontier": [start],
        "message":  f"Initialising DFS. Start node: {start} | Goal: {goal}"
    })

    # --- Main DFS loop ---
    while stack:
        current = stack.pop()  # LIFO — deepest node first

        # Skip if already visited (can reach same node via multiple paths)
        if current in visited_set:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": list(stack),
                "message":  f"Skipping {current} — already visited"
            })
            continue

        visited_set.add(current)
        visited.append(current)

        steps.append({
            "current":  current,
            "visited":  list(visited),
            "frontier": list(stack),
            "message":  f"Visiting {current} | Stack: {list(stack) if stack else 'empty'}"
        })

        # --- Goal check ---
        if current == goal:
            path = _reconstruct_path(parent, start, goal)
            steps.append({
                "current":  goal,
                "visited":  list(visited),
                "frontier": [],
                "message":  f"Goal {goal} reached! Path: {' → '.join(path)} | Cost: {len(path) - 1} edges"
            })
            return {
                "steps": steps,
                "path":  path,
                "cost":  len(path) - 1
            }

        # --- Expand neighbours ---
        # Push in reverse order so the first neighbour is explored first
        neighbours = graph[current]
        neighbours_to_push = []

        for neighbour in reversed(neighbours):
            if neighbour not in visited_set:
                if neighbour not in parent:
                    parent[neighbour] = current  # record first time seen
                stack.append(neighbour)
                neighbours_to_push.append(neighbour)

        neighbours_to_push.reverse()  # restore natural order for the message

        if neighbours_to_push:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": list(stack),
                "message":  f"Expanded {current} → pushed to stack: {neighbours_to_push}"
            })
        else:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": list(stack),
                "message":  f"Expanded {current} → dead end, backtracking"
            })

    # --- No path found ---
    steps.append({
        "current":  None,
        "visited":  list(visited),
        "frontier": [],
        "message":  f"Stack exhausted. No path exists from {start} to {goal}."
    })
    return {
        "steps": steps,
        "path":  [],
        "cost":  -1
    }


def _reconstruct_path(parent, start, goal):
    """Walks the parent map backwards from goal → start."""
    path = []
    node = goal
    while node is not None:
        path.append(node)
        node = parent[node]
    path.reverse()
    return path