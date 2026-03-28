# Backend/test_all.py
import requests
import json

BASE_URL = "http://localhost:5000/api/run"

# --- Test graph ---
# A - B - C
#     |
#     D - E
NODES = [
    {"id": "A", "position": {"x": 0,   "y": 0}},
    {"id": "B", "position": {"x": 100, "y": 0}},
    {"id": "C", "position": {"x": 200, "y": 0}},
    {"id": "D", "position": {"x": 100, "y": 100}},
    {"id": "E", "position": {"x": 200, "y": 100}},
]

EDGES = [
    {"source": "A", "target": "B", "data": {"weight": 1}},
    {"source": "B", "target": "C", "data": {"weight": 1}},
    {"source": "B", "target": "D", "data": {"weight": 2}},
    {"source": "D", "target": "E", "data": {"weight": 1}},
]

ALGORITHMS = [
    "BFS",
    "DFS",
    "UCS",
    "IDDFS",
    "DLS",
    "Bidirectional",
    "Greedy Best-First",
    "A*",
    "Hill Climbing",
    "Simulated Annealing",
]

# --- Run each algorithm ---
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