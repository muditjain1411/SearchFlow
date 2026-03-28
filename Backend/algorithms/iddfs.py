def run(nodes, edges, start, goal):
    """
    Iterative Deepening Depth-First Search — unweighted, optimal by edge count.

    Repeatedly runs DFS with depth limit 0, 1, 2, ... until goal is found.
    Memory efficient — only keeps the current path in memory at any time.

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
        graph[tgt].append(src)  # undirected

    max_depth = len(nodes)  # upper bound — no path can be longer than node count
    steps     = []

    steps.append({
        "current":  None,
        "visited":  [],
        "frontier": [start],
        "message":  f"Initialising IDDFS. Start: {start} | Goal: {goal} | Max depth: {max_depth}"
    })

    # --- Outer loop — increase depth limit each iteration ---
    for depth_limit in range(max_depth):

        steps.append({
            "current":  None,
            "visited":  [],
            "frontier": [start],
            "message":  f"── Iteration {depth_limit}: DFS with depth limit {depth_limit} ──"
        })

        visited_this_pass = []  # reset per iteration for clean animation

        found, path, inner_steps = _dls(
            graph, start, goal,
            depth_limit, visited_this_pass
        )

        steps.extend(inner_steps)

        if found:
            steps.append({
                "current":  goal,
                "visited":  visited_this_pass,
                "frontier": [],
                "message":  f"Goal {goal} found at depth {depth_limit}! "
                            f"Path: {' → '.join(path)} | Cost: {len(path) - 1} edges"
            })
            return {
                "steps": steps,
                "path":  path,
                "cost":  len(path) - 1
            }

    # --- No path found within max depth ---
    steps.append({
        "current":  None,
        "visited":  [],
        "frontier": [],
        "message":  f"No path from {start} to {goal} within depth {max_depth}."
    })
    return {
        "steps": steps,
        "path":  [],
        "cost":  -1
    }


def _dls(graph, start, goal, depth_limit, visited_log):
    """
    Depth-Limited Search — one pass of DFS capped at depth_limit.

    Returns:
        (found: bool, path: list, steps: list)
    """
    steps = []

    # Recursive DLS — path tracks current route for backtracking
    def _recurse(node, depth, path, visited_set):
        visited_log.append(node)
        visited_set.add(node)

        steps.append({
            "current":  node,
            "visited":  list(visited_log),
            "frontier": [],
            "message":  f"Depth {depth} | Visiting {node}"
                        + (" ← at depth limit" if depth == depth_limit else "")
        })

        # --- Goal check ---
        if node == goal:
            return True, list(path)

        # --- Depth limit reached ---
        if depth >= depth_limit:
            steps.append({
                "current":  node,
                "visited":  list(visited_log),
                "frontier": [],
                "message":  f"Depth limit {depth_limit} reached at {node} — backtracking"
            })
            return False, []

        # --- Expand neighbours ---
        for neighbour in graph[node]:
            if neighbour not in visited_set:
                path.append(neighbour)
                found, result_path = _recurse(neighbour, depth + 1, path, visited_set)
                if found:
                    return True, result_path
                path.pop()  # backtrack

                steps.append({
                    "current":  node,
                    "visited":  list(visited_log),
                    "frontier": [],
                    "message":  f"Backtracked to {node} from {neighbour}"
                })

        return False, []

    # Kick off recursion from start at depth 0
    path = [start]
    visited_set = set()
    found, result_path = _recurse(start, 0, path, visited_set)
    return found, result_path, steps