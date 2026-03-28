// src/App.jsx
import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import GraphCanvas from "./components/GraphCanvas";
import { useGraphState } from "./hooks/useGraphState";

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const graph = useGraphState();
  const [steps, setSteps] = useState([]);

  const handleVisualize = (algorithm) => {
    // Will call api.js here in the next module
    console.log("Visualizing with:", algorithm);
    setSteps([`Starting ${algorithm}...`, "Fetching graph data...", "Sending to backend..."]);
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            presetNames={graph.presetNames}
            onLoadPreset={graph.loadPreset}
            onClear={graph.clearGraph}
            isWeighted={graph.isWeighted}
            onToggleWeighted={() => graph.setIsWeighted((w) => !w)}
            steps={steps}
            onVisualize={handleVisualize}
          />
          <GraphCanvas
            nodes={graph.nodes}
            edges={graph.edges}
            onNodesChange={graph.onNodesChange}
            onEdgesChange={graph.onEdgesChange}
            onConnect={graph.onConnect}
            addNode={graph.addNode}
            removeNode={graph.removeNode}
            removeEdge={graph.removeEdge}
            updateEdgeWeight={graph.updateEdgeWeight}
            updateNodeLabel={graph.updateNodeLabel}
            isWeighted={graph.isWeighted}
          />
        </div>
      </div>
    </div>
  );
}

export default App;