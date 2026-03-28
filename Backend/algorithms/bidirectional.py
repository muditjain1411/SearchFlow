from collections import deque


def run(nodes, edges, start, goal):
    """
    Bidirectional BFS — unweighted, optimal by edge count.

    Expands two frontiers simultaneously:
        Forward  : BFS from start → goal
        Backward : BFS from goal  → start

    Terminates as soon as the two frontiers share a node (meeting point).

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
        graph[tgt].append(src)  # undirected — both frontiers use same graph

    # --- Forward BFS state (start → goal) ---
    fwd_queue   = deque([start])
    fwd_visited = {start}
    fwd_parent  = {start: None}

    # --- Backward BFS state (goal → start) ---
    bwd_queue   = deque([goal])
    bwd_visited = {goal}
    bwd_parent  = {goal: None}

    # --- Shared animation state ---
    all_visited = []   # combined ordered log of every node settled by either frontier
    steps       = []

    steps.append({
        "current":  None,
        "visited":  [],
        "frontier": [start, goal],
        "message":  (
            f"Initialising Bidirectional BFS. "
            f"Forward frontier: [{start}] | Backward frontier: [{goal}]"
        )
    })

    # --- Main loop — alternate between forward and backward expansions ---
    while fwd_queue or bwd_queue:

        # ── Forward expansion ──────────────────────────────────────────────
        if fwd_queue:
            fwd_current = fwd_queue.popleft()
            all_visited.append(fwd_current)

            steps.append({
                "current":  fwd_current,
                "visited":  list(all_visited),
                "frontier": _combined_frontier(fwd_queue, bwd_queue),
                "message":  f"[Forward]  Visiting {fwd_current}"
            })

            # --- Intersection check after forward step ---
            if fwd_current in bwd_visited:
                meeting = fwd_current
                path    = _build_path(fwd_parent, bwd_parent, meeting, start, goal)
                steps.append({
                    "current":  meeting,
                    "visited":  list(all_visited),
                    "frontier": [],
                    "message":  (
                        f"Frontiers met at [{meeting}]! "
                        f"Path: {' → '.join(path)} | Cost: {len(path) - 1} edges"
                    )
                })
                return {
                    "steps": steps,
                    "path":  path,
                    "cost":  len(path) - 1
                }

            # --- Expand forward neighbours ---
            fwd_added = []
            for neighbour in graph[fwd_current]:
                if neighbour not in fwd_visited:
                    fwd_visited.add(neighbour)
                    fwd_parent[neighbour] = fwd_current
                    fwd_queue.append(neighbour)
                    fwd_added.append(neighbour)

            if fwd_added:
                steps.append({
                    "current":  fwd_current,
                    "visited":  list(all_visited),
                    "frontier": _combined_frontier(fwd_queue, bwd_queue),
                    "message":  f"[Forward]  Expanded {fwd_current} → {fwd_added}"
                })

        # ── Backward expansion ─────────────────────────────────────────────
        if bwd_queue:
            bwd_current = bwd_queue.popleft()
            all_visited.append(bwd_current)

            steps.append({
                "current":  bwd_current,
                "visited":  list(all_visited),
                "frontier": _combined_frontier(fwd_queue, bwd_queue),
                "message":  f"[Backward] Visiting {bwd_current}"
            })

            # --- Intersection check after backward step ---
            if bwd_current in fwd_visited:
                meeting = bwd_current
                path    = _build_path(fwd_parent, bwd_parent, meeting, start, goal)
                steps.append({
                    "current":  meeting,
                    "visited":  list(all_visited),
                    "frontier": [],
                    "message":  (
                        f"Frontiers met at [{meeting}]! "
                        f"Path: {' → '.join(path)} | Cost: {len(path) - 1} edges"
                    )
                })
                return {
                    "steps": steps,
                    "path":  path,
                    "cost":  len(path) - 1
                }

            # --- Expand backward neighbours ---
            bwd_added = []
            for neighbour in graph[bwd_current]:
                if neighbour not in bwd_visited:
                    bwd_visited.add(neighbour)
                    bwd_parent[neighbour] = bwd_current
                    bwd_queue.append(neighbour)
                    bwd_added.append(neighbour)

            if bwd_added:
                steps.append({
                    "current":  bwd_current,
                    "visited":  list(all_visited),
                    "frontier": _combined_frontier(fwd_queue, bwd_queue),
                    "message":  f"[Backward] Expanded {bwd_current} → {bwd_added}"
                })

    # --- No path found ---
    steps.append({
        "current":  None,
        "visited":  list(all_visited),
        "frontier": [],
        "message":  (
            f"Both queues exhausted. "
            f"No path exists from {start} to {goal}."
        )
    })
    return {
        "steps": steps,
        "path":  [],
        "cost":  -1
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _combined_frontier(fwd_queue, bwd_queue):
    """
    Merges both frontiers into a single deduplicated list for the frontend.
    Frontend uses this to colour all frontier nodes amber simultaneously.
    """
    return list({*fwd_queue, *bwd_queue})


def _build_path(fwd_parent, bwd_parent, meeting, start, goal):
    """
    Stitches the forward and backward parent maps into a single path.

    Forward  half : meeting → start  (walk fwd_parent backwards)
    Backward half : meeting → goal   (walk bwd_parent backwards)

    Final path: start → ... → meeting → ... → goal
    """

    # Forward half: meeting back to start
    fwd_half = []
    node = meeting
    while node is not None:
        fwd_half.append(node)
        node = fwd_parent.get(node)
    fwd_half.reverse()  # now start → meeting

    # Backward half: meeting's parent back to goal
    bwd_half = []
    node = bwd_parent.get(meeting)  # skip meeting — already in fwd_half
    while node is not None:
        bwd_half.append(node)
        node = bwd_parent.get(node)
    # bwd_half is currently meeting_parent → goal — reverse to get meeting → goal
    bwd_half.reverse()

    return fwd_half + bwd_half