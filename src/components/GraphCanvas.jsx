// src/components/GraphCanvas.jsx
import { useRef, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
    ReactFlow, Background, MiniMap,
    BackgroundVariant, useReactFlow, useViewport,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { Plus, Minus, Maximize2, GripHorizontal } from "lucide-react";
import "@xyflow/react/dist/style.css";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";

const NODE_TYPES = { customNode: CustomNode };
const EDGE_TYPES = { customEdge: CustomEdge };

// ── Drag ghost ────────────────────────────────────────────────────────────────
function createDragGhost(type) {
    const colorMap = { start: "#10b981", goal: "#f43f5e", default: "#6b7280" };
    const canvas = document.createElement("canvas");
    canvas.width = 52;
    canvas.height = 52;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(26, 26, 22, 0, Math.PI * 2);
    ctx.fillStyle = colorMap[type] ?? "#6b7280";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(type === "start" ? "S" : type === "goal" ? "G" : "N", 26, 26);
    return canvas;
}

export { createDragGhost };

// ── MiniMap node color ────────────────────────────────────────────────────────
const miniMapNodeColor = (n) => {
    const t = n.data?.type;
    if (t === "start") return "#10b981";
    if (t === "goal") return "#f43f5e";
    if (t === "visited") return "#7c3aed";
    if (t === "path") return "#06b6d4";
    return "#374151";
};

// ── Draggable horizontal controls ─────────────────────────────────────────────
function FloatingControls({ wrapperRef, darkMode }) {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const [pos, setPos] = useState({ left: 16, bottom: 16 });
    const dragging = useRef(false);
    const startRef = useRef(null);

    const onMouseDown = (e) => {
        if (e.target.closest("button")) return;
        dragging.current = true;
        startRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startLeft: pos.left,
            startBottom: pos.bottom,
        };
        e.preventDefault();
    };

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current || !startRef.current) return;
            const { mouseX, mouseY, startLeft, startBottom } = startRef.current;
            setPos({
                left: Math.max(8, startLeft + (e.clientX - mouseX)),
                bottom: Math.max(8, startBottom - (e.clientY - mouseY)),
            });
        };
        const onMouseUp = () => { dragging.current = false; };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    const bg = darkMode ? "#111827" : "#ffffff";
    const border = darkMode ? "#374151" : "#e5e7eb";
    const gripCl = darkMode ? "#4b5563" : "#9ca3af";

    return (
        <div
            className="absolute z-40 flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg select-none nodrag nopan cursor-grab active:cursor-grabbing"
            style={{ left: pos.left, bottom: pos.bottom, background: bg, border: `1px solid ${border}` }}
            onMouseDown={onMouseDown}
        >
            {/* Grip indicator */}
            <GripHorizontal size={13} color={gripCl} className="mr-0.5 pointer-events-none" />

            <CtrlBtn onClick={() => zoomIn()} title="Zoom in" darkMode={darkMode}><Plus size={13} /></CtrlBtn>
            <CtrlBtn onClick={() => zoomOut()} title="Zoom out" darkMode={darkMode}><Minus size={13} /></CtrlBtn>
            <div style={{ width: 1, height: 16, background: border, margin: "0 2px" }} />
            <CtrlBtn onClick={() => fitView({ padding: 0.2 })} title="Fit view" darkMode={darkMode}><Maximize2 size={13} /></CtrlBtn>
        </div>
    );
}

function CtrlBtn({ onClick, title, children, darkMode }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode ? "#1f2937" : "#f3f4f6";
                e.currentTarget.style.color = darkMode ? "#ffffff" : "#111827";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = darkMode ? "#9ca3af" : "#6b7280";
            }}
        >
            {children}
        </button>
    );
}

// ── Traversal Overlay ─────────────────────────────────────────────────────────
// Draws numbered dotted arrows along visited edges directly on the canvas.
function TraversalOverlay({ nodes, edges, lastResult }) {
    const { x, y, zoom } = useViewport();
    if (!lastResult) return null;

    const { visitedOrder } = lastResult;
    if (!visitedOrder || visitedOrder.length < 2) return null;

    // label → flow-space centre position
    const labelToPos = {};
    nodes.forEach(n => {
        labelToPos[n.data.label] = { x: n.position.x + 28, y: n.position.y + 28 };
    });

    // Build segments, deduplicating repeated edges.
    // For each unique (A,B) pair, track how many times it has appeared
    // so we can stagger the perpendicular offset to avoid overlap.
    const pairCount = {};
    const segments = [];

    for (let i = 0; i < visitedOrder.length - 1; i++) {
        const aLabel = visitedOrder[i];
        const bLabel = visitedOrder[i + 1];
        const a = labelToPos[aLabel];
        const b = labelToPos[bLabel];
        if (!a || !b) continue;

        // Canonical key (undirected) so A→B and B→A share the same counter
        const key = [aLabel, bLabel].sort().join("↔");
        pairCount[key] = (pairCount[key] ?? 0) + 1;
        const occurence = pairCount[key]; // 1st, 2nd, 3rd time this pair appears

        segments.push({ from: a, to: b, step: i + 1, occurence });
    }

    if (segments.length === 0) return null;

    const toScreen = (p) => ({ x: p.x * zoom + x, y: p.y * zoom + y });

    return (
        <svg
            className="absolute inset-0 pointer-events-none nodrag nopan"
            style={{ width: "100%", height: "100%", zIndex: 5, overflow: "visible" }}
            data-traversal="true"
        >
            <defs>
                <marker id="tv-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <path d="M0,0 L0,7 L7,3.5 z" fill="#a78bfa" opacity="0.75" />
                </marker>
            </defs>
            {segments.map(({ from, to, step, occurence }) => {
                const s = toScreen(from);
                const e2 = toScreen(to);
                const mx = (s.x + e2.x) / 2;
                const my = (s.y + e2.y) / 2;

                // Perpendicular direction
                const dx = e2.x - s.x;
                const dy = e2.y - s.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const perpX = -dy / len;
                const perpY = dx / len;

                // Stagger offset: 1st pass = 12px, 2nd = -18px, 3rd = 24px…
                const baseOffset = 12;
                const sign = occurence % 2 === 1 ? 1 : -1;
                const magnitude = baseOffset + Math.floor((occurence - 1) / 2) * 12;
                const ox = perpX * sign * magnitude;
                const oy = perpY * sign * magnitude;

                // Shorten line to avoid overlapping node circles (r≈28px in flow space → zoom)
                const shortenPx = 20;
                const ratio = shortenPx / len;
                const sx1 = s.x + dx * ratio + ox;
                const sy1 = s.y + dy * ratio + oy;
                const sx2 = e2.x - dx * ratio + ox;
                const sy2 = e2.y - dy * ratio + oy;

                return (
                    <g key={`${step}`}>
                        <line
                            x1={sx1} y1={sy1} x2={sx2} y2={sy2}
                            stroke="#a78bfa"
                            strokeWidth={1.5}
                            strokeDasharray="5 3"
                            strokeOpacity={0.65}
                            markerEnd="url(#tv-arrow)"
                        />
                        <circle cx={mx + ox} cy={my + oy} r={7} fill="rgba(109,40,217,0.8)" />
                        <text
                            x={mx + ox} y={my + oy + 3}
                            textAnchor="middle"
                            fill="white"
                            fontSize={7}
                            fontWeight="700"
                            fontFamily="monospace"
                        >{step}</text>
                    </g>
                );
            })}
        </svg>
    );
}

// ── Canvas Legend ─────────────────────────────────────────────────────────────
const LEGEND_ITEMS = [
    { color: "#10b981", label: "Start" },
    { color: "#f43f5e", label: "Goal" },
    { color: "#f59e0b", label: "Frontier" },
    { color: "#7c3aed", label: "Visited" },
    { color: "#06b6d4", label: "Path" },
];

function CanvasLegend({ darkMode, canvasRef }) {
    // Use left/top so drag deltas map 1-to-1 with mouse movement
    // We compute initial position lazily from canvas size on first render
    const [pos, setPos] = useState(null);
    const dragging = useRef(false);
    const startRef = useRef(null);

    // Set initial position once canvas is mounted
    useEffect(() => {
        if (pos !== null) return;
        const el = canvasRef?.current;
        if (!el) { setPos({ left: 0, top: 0 }); return; }
        const { width, height } = el.getBoundingClientRect();
        // bottom-right: 12px from right edge, 226px from bottom (above minimap)
        setPos({ left: width - 12 - 120, top: height - 226 - 130 });
    }, [canvasRef, pos]);

    const onMouseDown = (e) => {
        dragging.current = true;
        startRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startLeft: pos.left,
            startTop: pos.top,
        };
        e.preventDefault();
        e.stopPropagation();
    };

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current || !startRef.current) return;
            const { mouseX, mouseY, startLeft, startTop } = startRef.current;
            const canvas = canvasRef?.current;
            const { width, height } = canvas?.getBoundingClientRect() ?? { width: 9999, height: 9999 };
            setPos({
                left: Math.max(8, Math.min(width - 130, startLeft + (e.clientX - mouseX))),
                top: Math.max(8, Math.min(height - 150, startTop + (e.clientY - mouseY))),
            });
        };
        const onMouseUp = () => { dragging.current = false; };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [canvasRef]);

    if (!pos) return null;

    const bg = darkMode ? "#111827" : "#ffffff";
    const border = darkMode ? "#374151" : "#cbd5e1";
    const text = darkMode ? "#9ca3af" : "#6b7280";
    const title = darkMode ? "#d1d5db" : "#374151";

    return (
        <div
            className="absolute z-40 nodrag nopan select-none"
            style={{ left: pos.left, top: pos.top }}
            data-legend="true"
            onMouseDown={onMouseDown}
        >
            <div
                className="flex flex-col gap-2 px-3 py-2.5 rounded-xl shadow-lg cursor-grab active:cursor-grabbing"
                style={{ background: bg, border: `1px solid ${border}` }}
            >
                <p style={{
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: title, marginBottom: 2,
                }}>
                    Legend
                </p>
                {LEGEND_ITEMS.map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                        <span style={{
                            width: 13, height: 13, borderRadius: "50%",
                            background: color, flexShrink: 0,
                            boxShadow: `0 0 6px ${color}88`,
                        }} />
                        <span style={{ fontSize: 11.5, color: text, fontWeight: 500 }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Result Banner ─────────────────────────────────────────────────────────────
function ResultBanner({ result, darkMode }) {
    const [expanded, setExpanded] = useState(false);
    if (!result) return null;
    const { pathLabels, visitedOrder, cost, algo } = result;
    const bg = darkMode ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.97)";
    const border = darkMode ? "#374151" : "#e2e8f0";
    const muted = darkMode ? "#6b7280" : "#9ca3af";
    const subtle = darkMode ? "#374151" : "#e5e7eb";
    const pathSet = new Set(pathLabels);

    return (
        <div
            className="absolute z-40 nodrag nopan select-none"
            style={{ top: 12, left: "50%", transform: "translateX(-50%)" }}
            data-result="true"
        >
            <div
                className="flex flex-col items-center rounded-2xl shadow-xl overflow-hidden"
                style={{ background: bg, border: `1px solid ${border}`, backdropFilter: "blur(10px)", minWidth: 220 }}
            >
                {/* ── Always-visible compact header ── */}
                <button
                    onClick={() => setExpanded(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 w-full hover:opacity-80 transition-opacity"
                    style={{ cursor: "pointer" }}
                >
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed" }}>
                        {algo}
                    </span>
                    <span style={{ flex: 1 }} />
                    {/* Inline path pill */}
                    <div className="flex items-center gap-0.5">
                        {pathLabels.map((label, i) => (
                            <div key={i} className="flex items-center gap-0.5">
                                <span
                                    className="flex items-center justify-center rounded-full font-bold text-white"
                                    style={{
                                        width: 20, height: 20, fontSize: 9, flexShrink: 0,
                                        background: i === 0 ? "#10b981" : i === pathLabels.length - 1 ? "#f43f5e" : "#06b6d4",
                                    }}
                                >{label}</span>
                                {i < pathLabels.length - 1 && (
                                    <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                                        <path d="M1 3.5h7M6 1l2.5 2.5L6 6" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                    <span style={{ fontSize: 9, color: muted, marginLeft: 4 }}>cost {cost}</span>
                    {/* Chevron */}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <path d="M2 3.5l3 3 3-3" stroke={muted} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* ── Expanded traversal section ── */}
                {expanded && visitedOrder && visitedOrder.length > 0 && (
                    <div style={{ borderTop: `1px solid ${subtle}`, padding: "8px 12px 10px" }}>
                        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 6, textAlign: "center" }}>
                            Traversal Order
                        </p>
                        <div className="flex items-end gap-0.5 flex-wrap justify-center">
                            {visitedOrder.map((label, i) => {
                                const onPath = pathSet.has(label);
                                return (
                                    <div key={i} className="flex items-center gap-0.5">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span style={{ fontSize: 7, color: muted, fontWeight: 600, lineHeight: 1 }}>{i + 1}</span>
                                            <span
                                                className="flex items-center justify-center rounded-full font-bold text-white"
                                                style={{
                                                    width: 20, height: 20, fontSize: 9, flexShrink: 0,
                                                    background: onPath ? "#7c3aed" : "#374151",
                                                    border: onPath ? "1.5px solid #a78bfa" : `1.5px solid ${subtle}`,
                                                }}
                                            >{label}</span>
                                        </div>
                                        {i < visitedOrder.length - 1 && (
                                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" style={{ marginBottom: 2 }}>
                                                <path d="M1 4h7M6 1.5l2.5 2.5L6 6.5" stroke={muted} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 1.5" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-3 mt-1.5">
                            <span style={{ fontSize: 8, color: muted }}><span style={{ color: "#7c3aed" }}>●</span> on-path</span>
                            <span style={{ fontSize: 8, color: muted }}><span style={{ color: "#374151" }}>●</span> explored</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


// ── Main Component
// ── Main Component ────────────────────────────────────────────────────────────
const GraphCanvas = forwardRef(function GraphCanvas({
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, removeNode, removeEdge,
    updateEdgeWeight, updateNodeLabel,
    isWeighted, darkMode, lastResult,
}, ref) {
    const reactFlowWrapper = useRef(null);
    const reactFlowInstance = useRef(null);

    // Expose download to parent via ref
    useImperativeHandle(ref, () => ({
        handleDownload,
    }));

    const nodesWithCallbacks = nodes.map((n) => ({
        ...n,
        data: { ...n.data, onRemove: removeNode, onLabelChange: updateNodeLabel },
    }));

    const edgesWithCallbacks = edges.map((e) => ({
        ...e,
        data: { ...e.data, showWeight: isWeighted, onRemove: removeEdge, onWeightChange: updateEdgeWeight },
    }));

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData("nodeType");
            if (!nodeType) return;

            const position = reactFlowInstance.current.screenToFlowPosition({
                x: e.clientX,
                y: e.clientY,
            });

            addNode(nodeType, position);
        },
        [addNode]
    );

    // ── Download ────────────────────────────────────────────────────────────
    // mode: "full" | "path" | "traversal" | "mixed"
    // allNodes/allEdges: current React state passed in from App so we can
    // compute which elements to highlight WITHOUT touching React state.
    // We restyle cloned DOM nodes via onCloneNode — zero flicker.
    const handleDownload = useCallback(
        async (mode, allNodes = [], allEdges = []) => {
            const rfViewport = reactFlowWrapper.current?.querySelector(".react-flow__viewport");
            if (!rfViewport) return;

            // Build id → desired animState maps based on mode
            const nodeAnimMap = {};
            const edgeAnimMap = {};

            if (mode === "full") {
                // all null — clean graph, no highlights
            } else if (mode === "path") {
                allNodes.forEach(n => { if (n.data.animState === "path") nodeAnimMap[n.id] = "path"; });
                allEdges.forEach(e => { if (e.data.animState === "path") edgeAnimMap[e.id] = "path"; });
            } else if (mode === "traversal") {
                allNodes.forEach(n => {
                    if (n.data.animState === "visited" || n.data.animState === "path") nodeAnimMap[n.id] = "visited";
                });
                allEdges.forEach(e => {
                    if (e.data.animState === "visited" || e.data.animState === "path") edgeAnimMap[e.id] = "visited";
                });
            } else {
                // mixed — use current animState as-is
                allNodes.forEach(n => { if (n.data.animState) nodeAnimMap[n.id] = n.data.animState; });
                allEdges.forEach(e => { if (e.data.animState) edgeAnimMap[e.id] = e.data.animState; });
            }

            // Color maps matching CustomNode TYPE_STYLES and CustomEdge colors
            const NODE_COLORS = {
                path: { bg: "#06b6d4", border: "#22d3ee" },
                visited: { bg: "#7c3aed", border: "#8b5cf6" },
                frontier: { bg: "#f59e0b", border: "#fbbf24" },
                start: { bg: "#10b981", border: "#34d399" },
                goal: { bg: "#f43f5e", border: "#fb7185" },
                default: { bg: "#374151", border: "#6b7280" },
            };
            const EDGE_COLORS = { path: "#06b6d4", visited: "#7c3aed", default: "#9ca3af" };

            try {
                const dataUrl = await toPng(rfViewport, {
                    backgroundColor: darkMode ? "#030712" : "#f9fafb",
                    pixelRatio: 2,
                    filter: (el) => {
                        if (el.classList?.contains("react-flow__minimap")) return false;
                        if (el.classList?.contains("react-flow__controls")) return false;
                        if (el.classList?.contains("react-flow__panel")) return false;
                        if (el.dataset?.legend === "true") return false;
                        if (el.dataset?.result === "true") return false;
                        if (el.dataset?.traversal === "true") return false;
                        return true;
                    },
                    onCloneNode: (node) => {
                        // Restyle React Flow node wrappers
                        const nodeId = node.dataset?.id;
                        if (nodeId && node.classList?.contains("react-flow__node")) {
                            const desired = nodeAnimMap[nodeId];
                            const nodeData = allNodes.find(n => n.id === nodeId);
                            const colorKey = desired ?? nodeData?.data?.type ?? "default";
                            const colors = NODE_COLORS[colorKey] ?? NODE_COLORS.default;
                            // Find the inner circle div and restyle it
                            const circle = node.querySelector(".rounded-full.border-2");
                            if (circle) {
                                circle.style.backgroundColor = colors.bg;
                                circle.style.borderColor = colors.border;
                            }
                        }
                        // Restyle edges — find SVG paths inside edge groups
                        if (node.classList?.contains("react-flow__edge")) {
                            const edgeId = node.dataset?.id;
                            if (edgeId) {
                                const desired = edgeAnimMap[edgeId];
                                const color = EDGE_COLORS[desired] ?? EDGE_COLORS.default;
                                const paths = node.querySelectorAll("path.react-flow__edge-path");
                                paths.forEach(p => { p.style.stroke = color; });
                            }
                        }
                        return node;
                    },
                });
                const link = document.createElement("a");
                link.download = `pathfinder-${mode}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error("Download failed:", err);
            }
        },
        [darkMode]
    );

    const canvasBg = darkMode ? "#030712" : "#f9fafb";
    const dotColor = darkMode ? "#1f2937" : "#d1d5db";

    return (
        <div
            ref={reactFlowWrapper}
            className="relative w-full h-full"
            style={{ background: canvasBg }}
        >
            <ReactFlow
                nodes={nodesWithCallbacks}
                edges={edgesWithCallbacks}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={(instance) => { reactFlowInstance.current = instance; }}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                fitView
                deleteKeyCode="Delete"
                proOptions={{ hideAttribution: true }}
                style={{ background: canvasBg }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color={dotColor}
                />

                {/* MiniMap — no border, tight corner */}
                <MiniMap
                    nodeColor={miniMapNodeColor}
                    maskColor={darkMode ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)"}
                    style={{
                        background: darkMode ? "#0f172a" : "#e2e8f0",
                        border: darkMode ? "none" : "1px solid #94a3b8",
                        borderRadius: "10px",
                        bottom: 12,
                        right: 12,
                        width: 140,
                        height: 90,
                    }}
                    nodeStrokeWidth={0}
                    pannable
                    zoomable
                />

                {/* Traversal overlay — dotted numbered arrows on visited edges */}
                <TraversalOverlay nodes={nodes} edges={edges} lastResult={lastResult} />

                {/* Result banner — top-center, shown after visualization */}
                <ResultBanner result={lastResult} darkMode={darkMode} />

                {/* Draggable horizontal controls */}
                <FloatingControls wrapperRef={reactFlowWrapper} darkMode={darkMode} />

                {/* Draggable legend — left/top coords so drag tracks mouse correctly */}
                <CanvasLegend darkMode={darkMode} canvasRef={reactFlowWrapper} />

            </ReactFlow>
        </div>
    );
});

export default GraphCanvas;