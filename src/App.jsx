// src/App.jsx
import { useState, useRef } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import GraphCanvas from "./components/GraphCanvas";
import { useGraphState } from "./hooks/useGraphState";

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [steps, setSteps] = useState([]);
  const graph = useGraphState();
  const canvasRef = useRef(null);

  const handleVisualize = (algorithm) => {
    console.log("Visualizing:", algorithm);
    setSteps([`Starting ${algorithm}...`, "Building graph...", "Sending to backend..."]);
  };

  const handleExport = (mode) => {
    canvasRef.current?.handleDownload(mode);
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">

        <Navbar
          darkMode={darkMode}
          toggleTheme={() => setDarkMode((d) => !d)}
          onExport={handleExport}
        />

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
            ref={canvasRef}
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
            darkMode={darkMode}
          />
        </div>

      </div>
    </div>
  );
}

export default App;