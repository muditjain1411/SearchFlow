# Sentinel return values from _recurse
FOUND   = "found"
CUTOFF  = "cutoff"   # depth limit was hit — path may exist deeper
FAILURE = "failure"  # no path exists at or below this depth


def run(nodes, edges, start, goal, depth_limit=5):
    """
    Depth-Limited Search — unweighted, single pass, user-defined depth ceiling.

    Distinguishes between two failure modes:
        CUTOFF  — goal not found but depth limit was hit (try deeper)
        FAILURE — goal provably unreachable (all branches exhausted)

    Args:
        nodes       : list of { id, position: { x, y }, ... }
        edges       : list of { source, target, data: { weight } }
        start       : node id string
        goal        : node id string
        depth_limit : int, default 5 (frontend sends this as a parameter)

    Returns:
        {
            steps  : [ { current, visited, frontier, message }, ... ],
            path   : [ node_id, ... ],   # empty if not found
            cost   : int,                # edge count, -1 if not found
            cutoff : bool                # True if limit was hit before exhaustion
        }
    """

    # --- Build adjacency list (undirected) ---
    graph = {node["id"]: [] for node in nodes}
    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        graph[src].append(tgt)
        graph[tgt].append(src)  # undirected

    # --- Shared mutable state across recursive calls ---
    state = {
        "visited_log": [],   # ordered list for animation
        "visited_set": set(),
        "cutoff_hit":  False,
        "steps":       [],
    }

    state["steps"].append({
        "current":  None,
        "visited":  [],
        "frontier": [start],
        "message":  (
            f"Initialising DLS. Start: {start} | Goal: {goal} | "
            f"Depth limit: {depth_limit}"
        )
    })

    # --- Run single DLS pass ---
    path   = [start]
    result = _recurse(graph, start, goal, depth_limit, 0, path, state)

    steps = state["steps"]

    # --- Goal found ---
    if result == FOUND:
        final_path = path
        steps.append({
            "current":  goal,
            "visited":  list(state["visited_log"]),
            "frontier": [],
            "message":  (
                f"Goal {goal} found at depth {len(final_path) - 1}! "
                f"Path: {' → '.join(final_path)} | Cost: {len(final_path) - 1} edges"
            )
        })
        return {
            "steps":  steps,
            "path":   final_path,
            "cost":   len(final_path) - 1,
            "cutoff": False,
        }

    # --- Cut-off — limit hit before exhausting the graph ---
    if result == CUTOFF:
        steps.append({
            "current":  None,
            "visited":  list(state["visited_log"]),
            "frontier": [],
            "message":  (
                f"Cut-off: depth limit {depth_limit} was reached before finding {goal}. "
                f"A path may exist — try increasing the depth limit."
            )
        })
        return {
            "steps":  steps,
            "path":   [],
            "cost":   -1,
            "cutoff": True,
        }

    # --- Failure — no path exists at any depth ---
    steps.append({
        "current":  None,
        "visited":  list(state["visited_log"]),
        "frontier": [],
        "message":  (
            f"Failure: all branches exhausted. "
            f"No path from {start} to {goal} exists in this graph."
        )
    })
    return {
        "steps":  steps,
        "path":   [],
        "cost":   -1,
        "cutoff": False,
    }


# ---------------------------------------------------------------------------
# Internal recursive engine
# ---------------------------------------------------------------------------

def _recurse(graph, node, goal, depth_limit, depth, path, state):
    """
    Recursive DLS engine.

    Returns one of: FOUND | CUTOFF | FAILURE
    `path` is mutated in place — caller must pop after a non-FOUND return.
    """
    state["visited_log"].append(node)
    state["visited_set"].add(node)

    state["steps"].append({
        "current":  node,
        "visited":  list(state["visited_log"]),
        "frontier": [],
        "message":  (
            f"Depth {depth}/{depth_limit} | Visiting {node}"
            + (" ← at limit" if depth == depth_limit else "")
        )
    })

    # --- Goal check ---
    if node == goal:
        return FOUND

    # --- Hard depth ceiling ---
    if depth >= depth_limit:
        state["cutoff_hit"] = True
        state["steps"].append({
            "current":  node,
            "visited":  list(state["visited_log"]),
            "frontier": [],
            "message":  (
                f"Cut-off at {node} (depth {depth}) — "
                f"not expanding further, backtracking"
            )
        })
        return CUTOFF

    # --- Expand neighbours ---
    result = FAILURE   # assume failure unless we find otherwise

    for neighbour in graph[node]:
        if neighbour in state["visited_set"]:
            continue

        path.append(neighbour)
        child_result = _recurse(
            graph, neighbour, goal,
            depth_limit, depth + 1, path, state
        )

        if child_result == FOUND:
            return FOUND   # propagate success immediately

        if child_result == CUTOFF:
            result = CUTOFF  # note the cutoff but keep exploring siblings

        path.pop()  # backtrack

        state["steps"].append({
            "current":  node,
            "visited":  list(state["visited_log"]),
            "frontier": [],
            "message":  f"Backtracked to {node} from {neighbour}"
        })

    return result