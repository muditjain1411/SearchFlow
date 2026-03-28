// src/components/GraphCanvas.jsx
import { useRef, useCallback, useEffect } from "react";
import ReactFlow, {
    Background, Controls, MiniMap,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";

const NODE_TYPES = { customNode: CustomNode };
const EDGE_TYPES = { customEdge: CustomEdge };

// ── Invisible drag ghost (just the circle symbol) ──────────────────────────
function createDragGhost(type) {
    const colorMap = {
        start: "#10b981",
        goal: "#f43f5e",
        default: "#6b7280",
        edge: "#8b5cf6",
    };

    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(24, 24, 20, 0, Math.PI * 2);
    ctx.fillStyle = colorMap[type] ?? "#6b7280";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(type === "start" ? "S" : type === "goal" ? "G" : "N", 24, 24);

    return canvas;
}

export default function GraphCanvas({
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, removeNode, removeEdge,
    updateEdgeWeight, updateNodeLabel,
    isWeighted,
}) {
    const reactFlowWrapper = useRef(null);
    const reactFlowInstance = useRef(null);

    // ── Inject callbacks into node/edge data so CustomNode/CustomEdge can call them
    const nodesWithCallbacks = nodes.map((n) => ({
        ...n,
        data: {
            ...n.data,
            onRemove: removeNode,
            onLabelChange: updateNodeLabel,
        },
    }));

    const edgesWithCallbacks = edges.map((e) => ({
        ...e,
        data: {
            ...e.data,
            showWeight: isWeighted,
            onRemove: removeEdge,
            onWeightChange: updateEdgeWeight,
        },
    }));

    // ── Drag over: allow drop ──────────────────────────────────────────────
    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    // ── Drop handler ──────────────────────────────────────────────────────
    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData("nodeType");
            if (!nodeType || nodeType === "edge") return;

            const bounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.current.screenToFlowPosition({
                x: e.clientX - bounds.left,
                y: e.clientY - bounds.top,
            });

            // Check if dropped ON an existing node (auto-parent)
            const targetNode = nodes.find((n) => {
                const dx = n.position.x + 28 - position.x; // 28 = half node width
                const dy = n.position.y + 28 - position.y;
                return Math.sqrt(dx * dx + dy * dy) < 40;
            });

            addNode(nodeType, position, targetNode?.id ?? null);
        },
        [nodes, addNode]
    );

    // ── Custom drag image (ghost) ─────────────────────────────────────────
    const onSidebarDragStart = useCallback((e, type) => {
        const ghost = createDragGhost(type);
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 24, 24);
        e.dataTransfer.setData("nodeType", type);
        // Clean up ghost after drag ends
        setTimeout(() => ghost.remove(), 0);
    }, []);

    return (
        <div ref={reactFlowWrapper} className="w-full h-full bg-gray-950">
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
                className="!bg-gray-950"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="#374151"
                />
                <Controls className="!bg-gray-800 !border-gray-700 !text-gray-300" />
                <MiniMap
                    nodeColor={(n) =>
                        n.data?.type === "start" ? "#10b981"
                            : n.data?.type === "goal" ? "#f43f5e"
                                : "#6b7280"
                    }
                    className="!bg-gray-900 !border-gray-700"
                />
            </ReactFlow>
        </div>
    );
}

// Export the ghost creator so Sidebar can use it
export { createDragGhost };