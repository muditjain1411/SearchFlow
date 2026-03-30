import { useRef, useState, useCallback } from "react";
import Navbar from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import GraphCanvas from "./components/GraphCanvas";
import { useGraphState } from "./hooks/useGraphState";
import { runAlgorithm } from "./services/api";

const DEFAULT_SPEED = 600;

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [stepLog, setStepLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [lastResult, setLastResult] = useState(null); // { path, cost, algo }
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const {
    nodes, edges,
    onNodesChange, onEdgesChange,
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
  // Each mode temporarily sets the right animState on nodes/edges,
  // ─── Export ───────────────────────────────────────────────────────────────
  // Mode logic is handled inside GraphCanvas.handleDownload via onCloneNode —
  // no React state mutation needed, zero flicker.
  const handleExport = useCallback((mode) => {
    canvasRef.current?.handleDownload(mode, nodes, edges);
  }, [nodes, edges]);

  // ─── Reset animation state ────────────────────────────────────────────────
  const resetAnimState = useCallback(() => {
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, animState: null } })));
    setEdges(eds => eds.map(e => ({ ...e, data: { ...e.data, animState: null } })));
  }, [setNodes, setEdges]);

  // ─── Clear result + anim when user edits the graph ───────────────────────
  const handleGraphEdit = useCallback(() => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsRunning(false);
    setStepLog([]);
    setLastResult(null);
    resetAnimState();
  }, [resetAnimState]);

  // ─── Apply a single step to the canvas ───────────────────────────────────
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
        if (pathSet.has(e.source) && pathSet.has(e.target)) animState = "path";
        else if (visitedSet.has(e.source) && visitedSet.has(e.target)) animState = "visited";
        return { ...e, data: { ...e.data, animState } };
      })
    );
  }, [setNodes, setEdges]);

  // ─── Lock in final path highlight ─────────────────────────────────────────
  // Only upgrades path nodes to "path" color.
  // Everything else stays at whatever applyStep last set — traversal remains visible.
  const applyFinalPath = useCallback((path) => {
    if (!path || path.length === 0) return;
    const pathSet = new Set(path);
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: {
          ...n.data,
          animState: pathSet.has(n.id)
            ? "path"
            : n.data.animState  // keep visited/frontier/null as-is
        }
      }))
    );
    setEdges(eds =>
      eds.map(e => ({
        ...e,
        data: {
          ...e.data,
          animState: (pathSet.has(e.source) && pathSet.has(e.target))
            ? "path"
            : e.data.animState  // keep visited/null as-is
        }
      }))
    );
  }, [setNodes, setEdges]);

  // ─── Main visualize handler ────────────────────────────────────────────────
  // 6b: accepts depthLimit as second param, adds depth_limit to payload for DLS
  const handleVisualize = useCallback(async (algo, depthLimit = 5) => {
    if (isRunning) return;
    if (animationRef.current) clearTimeout(animationRef.current);
    resetAnimState();
    setStepLog([]);

    const graph = serializeGraph();

    if (!graph.start || !graph.goal) {
      setStepLog(["⚠️ Please add a Start node and a Goal node before visualizing."]);
      return;
    }

    // ── Attach depth_limit for DLS ──────────────────────────────────────────
    if (algo === "DLS") {
      graph.depth_limit = depthLimit;
    }

    setIsRunning(true);
    setStepLog([`Running ${algo}${algo === "DLS" ? ` (depth limit: ${depthLimit})` : ""}...`]);

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
              const labelOf = (id) => nodes.find(n => n.id === id)?.data?.label ?? id;
              const pathLabels = path.map(labelOf);
              const visitedOrder = steps[steps.length - 1]?.visited?.map(labelOf) ?? [];
              const summary = path && path.length > 0
                ? `✅ Path found: ${pathLabels.join(" → ")} | Cost: ${cost}`
                : `❌ No path found from ${labelOf(graph.start)} to ${labelOf(graph.goal)}`;
              setStepLog(prev => [...prev, summary]);
              if (path && path.length > 0) {
                setLastResult({ pathLabels, visitedOrder, cost, algo });
              }
              setIsRunning(false);
            }, speed);
          }

        }, i * speed);
      });

    } catch (err) {
      setStepLog([`❌ Error: ${err.message}`]);
      setIsRunning(false);
    }
  }, [isRunning, speed, nodes, serializeGraph, resetAnimState, applyStep, applyFinalPath]);

  // ─── Wrap graph-mutating actions to clear result on edit ─────────────────
  const handleAddNode = useCallback((type, pos) => {
    handleGraphEdit();
    addNode(type, pos);
  }, [handleGraphEdit, addNode]);

  const handleRemoveNode = useCallback((id) => {
    handleGraphEdit();
    removeNode(id);
  }, [handleGraphEdit, removeNode]);

  const handleRemoveEdge = useCallback((id) => {
    handleGraphEdit();
    removeEdge(id);
  }, [handleGraphEdit, removeEdge]);

  const handleLoadPreset = useCallback((name) => {
    handleGraphEdit();
    loadPreset(name);
  }, [handleGraphEdit, loadPreset]);
  const handleClear = useCallback(() => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsRunning(false);
    setStepLog([]);
    setLastResult(null);
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

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            nodes={nodes}
            edges={edges}
            isWeighted={isWeighted}
            stepLog={stepLog}
            isRunning={isRunning}
            speed={speed}
            onSpeedChange={setSpeed}
            onVisualize={handleVisualize}
            onLoadPreset={handleLoadPreset}
            onToggleWeighted={useCallback(() => setIsWeighted(prev => !prev), [])}
            onClear={handleClear}
            onAlgoChange={handleGraphEdit}
          />

          <GraphCanvas
            ref={canvasRef}
            nodes={nodes}
            edges={edges}
            darkMode={darkMode}
            lastResult={lastResult}
            onNodesChange={(changes) => {
              const structural = changes.some(c => c.type === "remove" || c.type === "add");
              if (structural) handleGraphEdit();
              onNodesChange(changes);
            }}
            onEdgesChange={(changes) => {
              const structural = changes.some(c => c.type === "remove" || c.type === "add");
              if (structural) handleGraphEdit();
              onEdgesChange(changes);
            }}
            onConnect={(params) => { handleGraphEdit(); onConnect(params); }}
            addNode={handleAddNode}
            removeNode={handleRemoveNode}
            removeEdge={handleRemoveEdge}
            updateEdgeWeight={updateEdgeWeight}
            updateNodeLabel={updateNodeLabel}
            isWeighted={isWeighted}
          />
        </div>

      </div>
    </div>
  );
}