import { useRef, useState, useCallback } from "react";
import Navbar from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import GraphCanvas from "./components/GraphCanvas";
import { useGraphState } from "./hooks/useGraphState";
import { runAlgorithm } from "./services/api";

const DEFAULT_SPEED = 600; // ms between animation steps

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [stepLog, setStepLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const {
    nodes, edges,
    onNodesChange, onEdgesChange,   // ✅ FIX 2: use real handlers from hook
    isWeighted, setIsWeighted,
    addNode,
    removeNode,
    onConnect,
    updateEdgeWeight,
    removeEdge,
    updateNodeLabel,
    loadPreset,
    clearGraph,
    serializeGraph,
    setNodes,
    setEdges,
  } = useGraphState();

  // ─── Dark mode ────────────────────────────────────────────────────────────
  const handleToggleDark = useCallback(() => {
    setDarkMode(prev => {
      document.documentElement.classList.toggle("dark", !prev);
      return !prev;
    });
  }, []);

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = useCallback((mode) => {
    canvasRef.current?.handleDownload(mode);
  }, []);

  // ─── Reset animation state on all nodes and edges ─────────────────────────
  const resetAnimState = useCallback(() => {
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: { ...n.data, animState: null }
      }))
    );
    setEdges(eds =>
      eds.map(e => ({
        ...e,
        data: { ...e.data, animState: null }
      }))
    );
  }, [setNodes, setEdges]);

  // ─── Apply a single algorithm step to the canvas ──────────────────────────
  const applyStep = useCallback((step) => {
    const { current, visited, frontier, path } = step;

    const visitedSet = new Set(visited || []);
    const frontierSet = new Set(frontier || []);
    const pathSet = new Set(path || []);

    setNodes(nds =>
      nds.map(n => {
        const id = n.id;
        let animState = null;
        if (pathSet.has(id)) animState = "path";
        else if (id === current) animState = "visited";
        else if (visitedSet.has(id)) animState = "visited";
        else if (frontierSet.has(id)) animState = "frontier";
        return { ...n, data: { ...n.data, animState } };
      })
    );

    setEdges(eds =>
      eds.map(e => {
        let animState = null;
        const srcInPath = pathSet.has(e.source);
        const tgtInPath = pathSet.has(e.target);
        const srcVisited = visitedSet.has(e.source);
        const tgtVisited = visitedSet.has(e.target);
        if (srcInPath && tgtInPath) animState = "path";
        else if (srcVisited && tgtVisited) animState = "visited";
        return { ...e, data: { ...e.data, animState } };
      })
    );
  }, [setNodes, setEdges]);

  // ─── Highlight final path after animation completes ───────────────────────
  const applyFinalPath = useCallback((path) => {
    if (!path || path.length === 0) return;
    const pathSet = new Set(path);

    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: {
          ...n.data,
          animState: pathSet.has(n.id) ? "path" : "visited"
        }
      }))
    );

    setEdges(eds =>
      eds.map(e => ({
        ...e,
        data: {
          ...e.data,
          animState: (pathSet.has(e.source) && pathSet.has(e.target)) ? "path" : "visited"
        }
      }))
    );
  }, [setNodes, setEdges]);

  // ─── Main visualize handler ────────────────────────────────────────────────
  const handleVisualize = useCallback(async (algo) => {
    if (isRunning) return;
    if (animationRef.current) clearTimeout(animationRef.current);
    resetAnimState();
    setStepLog([]);

    const graph = serializeGraph();

    if (!graph.start || !graph.goal) {
      setStepLog(["⚠️ Please add a Start node and a Goal node before visualizing."]);
      return;
    }

    setIsRunning(true);
    setStepLog([`Running ${algo}...`]);

    try {
      const result = await runAlgorithm(algo, graph);
      const { steps, path, cost } = result;

      steps.forEach((step, i) => {
        animationRef.current = setTimeout(() => {

          setStepLog(prev => [...prev, `${i + 1}. ${step.message}`]);
          applyStep(step);

          if (i === steps.length - 1) {
            setTimeout(() => {
              applyFinalPath(path);
              const summary = path && path.length > 0
                ? `✅ Path found: ${path.join(" → ")} | Cost: ${cost}`
                : `❌ No path found from ${graph.start} to ${graph.goal}`;
              setStepLog(prev => [...prev, summary]);
              setIsRunning(false);
            }, speed);
          }

        }, i * speed);
      });

    } catch (err) {
      setStepLog([`❌ Error: ${err.message}`]);
      setIsRunning(false);
    }
  }, [
    isRunning, speed,
    serializeGraph, resetAnimState,
    applyStep, applyFinalPath
  ]);

  // ─── Clear canvas + animation state ───────────────────────────────────────
  const handleClear = useCallback(() => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsRunning(false);
    setStepLog([]);
    resetAnimState();
    clearGraph();
  }, [clearGraph, resetAnimState]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex flex-col h-screen bg-gray-950 text-white">

        <Navbar
          darkMode={darkMode}
          toggleTheme={handleToggleDark}
          onExport={handleExport}
        />

        {/* ✅ FIX 1: removed pt-14 — Navbar is in normal flow, not fixed */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            nodes={nodes}
            isWeighted={isWeighted}
            stepLog={stepLog}
            isRunning={isRunning}
            speed={speed}
            onSpeedChange={setSpeed}
            onVisualize={handleVisualize}
            onLoadPreset={loadPreset}
            onToggleWeighted={() => setIsWeighted(prev => !prev)}
            onClear={handleClear}
          />

          <GraphCanvas
            ref={canvasRef}
            nodes={nodes}
            edges={edges}
            darkMode={darkMode}
            onNodesChange={onNodesChange}         
            onEdgesChange={onEdgesChange}         
            onConnect={onConnect}
            addNode={addNode}                     
            removeNode={removeNode}               
            removeEdge={removeEdge}               
            updateEdgeWeight={updateEdgeWeight}   
            updateNodeLabel={updateNodeLabel}     
            isWeighted={isWeighted}
          />
        </div>

      </div>
    </div>
  );
}