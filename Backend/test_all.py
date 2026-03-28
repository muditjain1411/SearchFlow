# backend/test_all.py
import requests

BASE_URL = "http://localhost:5000/api/run"

NODES = [
    {"id": "A", "position": {"x": 0,   "y": 0}},
    {"id": "B", "position": {"x": 100, "y": 0}},
    {"id": "C", "position": {"x": 200, "y": 0}},
    {"id": "D", "position": {"x": 100, "y": 100}},
    {"id": "E", "position": {"x": 200, "y": 100}},
]

# ✅ FIX: flat format matching frontend serializeGraph output
EDGES = [
    {"source": "A", "target": "B", "weight": 1},
    {"source": "B", "target": "C", "weight": 1},
    {"source": "B", "target": "D", "weight": 2},
    {"source": "D", "target": "E", "weight": 1},
]

ALGORITHMS = [
    "BFS", "DFS", "UCS", "IDDFS", "DLS",
    "Bidirectional", "Greedy Best-First", "A*",
    "Hill Climbing", "Simulated Annealing",
]

print(f"\n{'='*60}")
print(f"  PathFinder Backend — Full Algorithm Test")
print(f"{'='*60}\n")

passed = 0
failed = 0

for algo in ALGORITHMS:
    payload = {
        "algorithm": algo,
        "nodes":     NODES,
        "edges":     EDGES,
        "start":     "A",
        "goal":      "E",
    }
    # DLS gets an extra param
    if algo == "DLS":
        payload["depth_limit"] = 6

    try:
        res  = requests.post(BASE_URL, json=payload, timeout=5)
        data = res.json()

        if res.status_code == 200:
            path  = data.get("path", [])
            cost  = data.get("cost")
            steps = len(data.get("steps", []))
            print(f"  ✅ {algo:<22} path={path}  cost={cost}  steps={steps}")
            passed += 1
        else:
            print(f"  ❌ {algo:<22} HTTP {res.status_code} → {data.get('message')}")
            failed += 1

    except Exception as e:
        print(f"  💥 {algo:<22} Exception: {e}")
        failed += 1

print(f"\n{'='*60}")
print(f"  Results: {passed} passed, {failed} failed")
print(f"{'='*60}\n")