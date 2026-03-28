// src/components/GraphCanvas.jsx
import { useRef, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
    ReactFlow, Background, MiniMap,
    BackgroundVariant, useReactFlow,
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

// ── Main Component ────────────────────────────────────────────────────────────
const GraphCanvas = forwardRef(function GraphCanvas({
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, removeNode, removeEdge,
    updateEdgeWeight, updateNodeLabel,
    isWeighted, darkMode,
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

            const parentNode = nodes.find((n) => {
                const dx = (n.position.x + 28) - position.x;
                const dy = (n.position.y + 28) - position.y;
                return Math.sqrt(dx * dx + dy * dy) < 50;
            });

            addNode(nodeType, position, parentNode?.id ?? null);
        },
        [nodes, addNode]
    );

    // ── Download ────────────────────────────────────────────────────────────
    const handleDownload = useCallback(
        async (mode) => {
            const rfViewport = reactFlowWrapper.current?.querySelector(".react-flow__viewport");
            if (!rfViewport) return;

            try {
                const dataUrl = await toPng(rfViewport, {
                    backgroundColor: darkMode ? "#030712" : "#f9fafb",
                    width: 1400,
                    height: 900,
                    filter: (el) => {
                        if (el.classList?.contains("react-flow__minimap")) return false;
                        if (el.classList?.contains("react-flow__controls")) return false;
                        if (el.classList?.contains("react-flow__panel")) return false;
                        return true;
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
                        background: darkMode ? "#0f172a" : "#f1f5f9",
                        border: "none",
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

                {/* Draggable horizontal controls */}
                <FloatingControls wrapperRef={reactFlowWrapper} darkMode={darkMode} />

            </ReactFlow>
        </div>
    );
});

export default GraphCanvas;