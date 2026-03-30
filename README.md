# 🌐 SearchFlow – Interactive Graph Algorithm Visualizer

> An interactive, web-based educational tool for visualizing AI and ML search algorithms — built to bridge the gap between abstract algorithmic math and visual comprehension.


![Python](https://img.shields.io/badge/Python-3.8%2B-yellow.svg)
![React](https://img.shields.io/badge/React-Vite-61DAFB.svg)
![Flask](https://img.shields.io/badge/Backend-Flask-black.svg)

🔗 **[Live Demo](https://search-flow-visual.vercel.app/)** &nbsp;|&nbsp; 🖥️ **[Backend API](https://searchflow.onrender.com)**

---

## 📌 Overview

**SearchFlow** lets you dynamically build node-and-edge graphs, configure heuristic values, and watch step-by-step execution of various pathfinding and local search algorithms. It makes it easy to understand how data structures like **Priority Queues** and **Frontiers** operate under the hood — in real time.

---

## ✨ Key Features

- **Interactive Canvas** — Drag-and-drop interface to build complex graphs using React Flow.
- **Customizable Weights & Heuristics** — Toggle directed/undirected edges and assign custom $g(n)$ and $h(n)$ values.
- **Step-by-Step Animation** — Play, pause, and step through algorithm execution sequentially.
- **Live "Under the Hood" Data** — Real-time side panel displaying the current state of the Frontier (Queue/Stack) and Visited Set.
- **Comprehensive Algorithm Suite:**

  | Category | Algorithms |
  |---|---|
  | Uninformed Search | BFS, DFS, Depth-Limited Search (DLS), Iterative Deepening (IDDFS), Uniform Cost Search (UCS) |
  | Informed Search | Greedy Best-First Search, A\* Search |
  | Local Search | Hill Climbing, Simulated Annealing |

---



## 🛠️ Tech Stack

**Frontend:**
- [React.js](https://react.dev/) (Vite)
- [React Flow](https://reactflow.dev/) — Graph visualization
- [Tailwind CSS](https://tailwindcss.com/) — Styling

**Backend:**
- [Python](https://www.python.org/) + [Flask](https://flask.palletsprojects.com/)
- Flask-CORS
- [Gunicorn](https://gunicorn.org/) — Production server




## 🚀 Local Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [Python](https://www.python.org/) v3.8 or higher
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/muditjain1411/SearchFlow.git
cd searchflow
```

### 2. Backend Setup (Flask API)

```bash
cd Backend

# Create and activate a virtual environment
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
python app.py
```

The backend will run at **http://localhost:5000**.

### 3. Frontend Setup (React/Vite)

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run at **http://localhost:5173**. Open this in your browser to view the app.

---

## 📖 How to Use

1. **Draw the Graph** — Click on the canvas to add nodes. Drag between node handles to create edges.
2. **Configure Data** — Click edges to set path costs (weights). Click nodes to set heuristic values for informed searches.
3. **Select Algorithm** — Choose your desired AI search algorithm from the control panel dropdown.
4. **Set Start/End** — Designate your starting node and goal node using the UI toggles.
5. **Visualize** — Click **"Visualize"** to fetch the pathing logic from the backend and watch the step-by-step animation unfold!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 👨‍💻 Author

**Mudit Jain**  
B.Tech Computer Science Student  
*Developed as a Bring Your Own Project (BYOP) for Fundamentals in AI and ML.*

---
