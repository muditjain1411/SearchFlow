// src/components/GraphCanvas.jsx
import { useRef, useCallback, useState } from "react";
import {
    ReactFlow, Background, Controls, MiniMap,
    BackgroundVariant, useReactFlow,
    getNodesBounds, getViewportForBounds,
} from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import "@xyflow/react/dist/style.css";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import { Download, Image, Route, GitBranch, Layers, X } from "lucide-react";

const NODE_TYPES = { customNode: CustomNode };
const EDGE_TYPES = { customEdge: CustomEdge };

// ── Drag ghost ───────────────────────────────────────────────────────────────
function createDragGhost(type) {
    const colorMap = {
        start: "#10b981",
        goal: "#f43f5e",
        default: "#6b7280",
    };
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

// ── MiniMap node color ───────────────────────────────────────────────────────
const miniMapNodeColor = (n) => {
    const t = n.data?.type;
    if (t === "start") return "#10b981";
    if (t === "goal") return "#f43f5e";
    if (t === "visited") return "#7c3aed";
    if (t === "path") return "#06b6d4";
    return "#374151";
};

// ── Download options config ──────────────────────────────────────────────────
const DOWNLOAD_OPTIONS = [
    {
        id: "full",
        label: "Full Graph",
        desc: "All nodes and edges",
        icon: <GitBranch size={14} />,
        color: "text-cyan-400",
    },
    {
        id: "path",
        label: "Shortest Route",
        desc: "Path nodes/edges only",
        icon: <Route size={14} />,
        color: "text-emerald-400",
    },
    {
        id: "traversal",
        label: "Traversal",
        desc: "Visited nodes highlighted",
        icon: <Layers size={14} />,
        color: "text-violet-400",
    },
    {
        id: "mixed",
        label: "Mixed View",
        desc: "Full graph + highlights",
        icon: <Image size={14} />,
        color: "text-amber-400",
    },
];

// ── Download Panel ────────────────────────────────────────────────────────────
function DownloadPanel({ onDownload, onClose }) {
    return (
        <div className="
      absolute bottom-16 right-3 z-50
      w-56 rounded-xl overflow-hidden
      bg-gray-900 border border-gray-700
      shadow-2xl shadow-black/60
    ">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Download as
                </span>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
                    <X size={13} />
                </button>
            </div>
            {DOWNLOAD_OPTIONS.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => { onDownload(opt.id); onClose(); }}
                    className="
            w-full flex items-center gap-3 px-3 py-2.5
            hover:bg-gray-800 transition-colors duration-150
            group
          "
                >
                    <span className={`${opt.color} shrink-0`}>{opt.icon}</span>
                    <div className="text-left">
                        <p className="text-xs font-medium text-gray-200 group-hover:text-white">
                            {opt.label}
                        </p>
                        <p className="text-[10px] text-gray-500">{opt.desc}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GraphCanvas({
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, removeNode, removeEdge,
    updateEdgeWeight, updateNodeLabel,
    isWeighted,
}) {
    const reactFlowWrapper = useRef(null);
    const reactFlowInstance = useRef(null);
    const [showDownload, setShowDownload] = useState(false);

    // Inject callbacks into node data
    const nodesWithCallbacks = nodes.map((n) => ({
        ...n,
        data: {
            ...n.data,
            onRemove: removeNode,
            onLabelChange: updateNodeLabel,
        },
    }));

    // Inject callbacks into edge data
    const edgesWithCallbacks = edges.map((e) => ({
        ...e,
        data: {
            ...e.data,
            showWeight: isWeighted,
            onRemove: removeEdge,
            onWeightChange: updateEdgeWeight,
        },
    }));

    // ── Drag handlers ─────────────────────────────────────────────────────
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

            // Auto-parent: dropped within 50px of existing node center
            const parentNode = nodes.find((n) => {
                const cx = n.position.x + 28;
                const cy = n.position.y + 28;
                const dx = cx - position.x;
                const dy = cy - position.y;
                return Math.sqrt(dx * dx + dy * dy) < 50;
            });

            addNode(nodeType, position, parentNode?.id ?? null);
        },
        [nodes, addNode]
    );

    // ── Download handler ──────────────────────────────────────────────────
    const handleDownload = useCallback(
        async (mode) => {
            const rfViewport = reactFlowWrapper.current?.querySelector(".react-flow__viewport");
            if (!rfViewport) return;

            // Filter which nodes to highlight based on mode
            const filterNode = (node) => {
                if (mode === "full" || mode === "mixed") return true;
                if (mode === "path") return node.data?.animState === "path" || node.data?.type === "start" || node.data?.type === "goal";
                if (mode === "traversal") return node.data?.animState === "visited" || node.data?.animState === "path";
                return true;
            };

            const visibleNodes = nodes.filter(filterNode);
            const bounds = getNodesBounds(visibleNodes.length > 0 ? visibleNodes : nodes);
            const padding = 60;
            const imgWidth = 1200;
            const imgHeight = 800;

            try {
                const dataUrl = await toPng(rfViewport, {
                    backgroundColor: "#030712",
                    width: imgWidth,
                    height: imgHeight,
                    style: {
                        width: imgWidth,
                        height: imgHeight,
                        transform: `translate(${padding}px, ${padding}px)`,
                    },
                    filter: (node) => {
                        // Hide React Flow UI chrome in screenshot
                        if (node.classList?.contains("react-flow__minimap")) return false;
                        if (node.classList?.contains("react-flow__controls")) return false;
                        if (node.classList?.contains("react-flow__panel")) return false;
                        return true;
                    },
                });

                // Trigger download
                const link = document.createElement("a");
                link.download = `graph-${mode}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error("Download failed:", err);
            }
        },
        [nodes]
    );

    return (
        <div ref={reactFlowWrapper} className="relative w-full h-full bg-gray-950">
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
                className="bg-gray-950!"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="#1f2937"
                />

                {/* Controls */}
                <Controls
                    className="bg-gray-900! border! border-gray-700! rounded-xl! shadow-xl!"
                    style={{ bottom: 16, left: 16 }}
                />

                {/* MiniMap — thin border, tight corner */}
                <MiniMap
                    nodeColor={miniMapNodeColor}
                    maskColor="rgba(0,0,0,0.55)"
                    style={{
                        background: "#0f172a",
                        border: "1px solid #1f2937",
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

                {/* Download button + panel — sits above minimap */}
                <div
                    className="absolute z-40"
                    style={{ bottom: 114, right: 12 }}
                >
                    {showDownload && (
                        <DownloadPanel
                            onDownload={handleDownload}
                            onClose={() => setShowDownload(false)}
                        />
                    )}
                    <button
                        onClick={() => setShowDownload((v) => !v)}
                        className={`
              flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
              border transition-all duration-200 shadow-lg
              ${showDownload
                                ? "bg-violet-500 border-violet-400 text-white"
                                : "bg-gray-900 border-gray-700 text-gray-300 hover:border-violet-500 hover:text-violet-400"
                            }
            `}
                    >
                        <Download size={13} />
                        Export
                    </button>
                </div>

            </ReactFlow>
        </div>
    );
}