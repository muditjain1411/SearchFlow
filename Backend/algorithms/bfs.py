# backend/algorithms/bfs.py

from collections import deque


def run(nodes, edges, start, goal):
    """
    Breadth-First Search — unweighted, optimal by edge count.

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

    # --- BFS state ---
    queue    = deque([start])
    visited  = []          # ordered list of visited node ids (for animation)
    visited_set = {start}  # fast membership check
    parent   = {start: None}  # to reconstruct path
    steps    = []

    # Record the initial state before the loop starts
    steps.append({
        "current":  None,
        "visited":  [],
        "frontier": [start],
        "message":  f"Initialising BFS. Start node: {start} | Goal: {goal}"
    })

    # --- Main BFS loop ---
    while queue:
        current = queue.popleft()
        visited.append(current)

        # Snapshot frontier AFTER dequeuing current
        frontier = list(queue)

        steps.append({
            "current":  current,
            "visited":  list(visited),
            "frontier": frontier,
            "message":  f"Visiting {current} | Queue: {frontier if frontier else 'empty'}"
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
        neighbours_added = []
        for neighbour in graph[current]:
            if neighbour not in visited_set:
                visited_set.add(neighbour)
                parent[neighbour] = current
                queue.append(neighbour)
                neighbours_added.append(neighbour)

        if neighbours_added:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": list(queue),
                "message":  f"Expanded {current} → added to frontier: {neighbours_added}"
            })
        else:
            steps.append({
                "current":  current,
                "visited":  list(visited),
                "frontier": list(queue),
                "message":  f"Expanded {current} → no new neighbours found"
            })

    # --- No path found ---
    steps.append({
        "current":  None,
        "visited":  list(visited),
        "frontier": [],
        "message":  f"Queue exhausted. No path exists from {start} to {goal}."
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