// src/hooks/useGraphState.js
import { useCallback, useState } from "react";
import {
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
} from "@xyflow/react";

// ─── Preset Graphs ────────────────────────────────────────────────────────────
const PRESETS = {
    "Simple Graph": {
        nodes: [
            { id: "A", position: { x: 250, y: 80 }, data: { label: "A", type: "start" } },
            { id: "B", position: { x: 100, y: 220 }, data: { label: "B", type: "default" } },
            { id: "C", position: { x: 400, y: 220 }, data: { label: "C", type: "default" } },
            { id: "D", position: { x: 100, y: 360 }, data: { label: "D", type: "default" } },
            { id: "E", position: { x: 400, y: 360 }, data: { label: "E", type: "goal" } },
        ],
        edges: [
            { id: "A-B", source: "A", target: "B", data: { weight: 1 } },
            { id: "A-C", source: "A", target: "C", data: { weight: 4 } },
            { id: "B-D", source: "B", target: "D", data: { weight: 2 } },
            { id: "C-E", source: "C", target: "E", data: { weight: 3 } },
            { id: "D-E", source: "D", target: "E", data: { weight: 1 } },
        ],
    },
    "Binary Tree": {
        nodes: [
            { id: "1", position: { x: 300, y: 60 }, data: { label: "1", type: "start" } },
            { id: "2", position: { x: 150, y: 180 }, data: { label: "2", type: "default" } },
            { id: "3", position: { x: 450, y: 180 }, data: { label: "3", type: "default" } },
            { id: "4", position: { x: 75, y: 300 }, data: { label: "4", type: "default" } },
            { id: "5", position: { x: 225, y: 300 }, data: { label: "5", type: "default" } },
            { id: "6", position: { x: 375, y: 300 }, data: { label: "6", type: "default" } },
            { id: "7", position: { x: 525, y: 300 }, data: { label: "7", type: "goal" } },
        ],
        edges: [
            { id: "1-2", source: "1", target: "2", data: { weight: 1 } },
            { id: "1-3", source: "1", target: "3", data: { weight: 1 } },
            { id: "2-4", source: "2", target: "4", data: { weight: 1 } },
            { id: "2-5", source: "2", target: "5", data: { weight: 1 } },
            { id: "3-6", source: "3", target: "6", data: { weight: 1 } },
            { id: "3-7", source: "3", target: "7", data: { weight: 1 } },
        ],
    },
    "Weighted Graph": {
        nodes: [
            { id: "S", position: { x: 100, y: 200 }, data: { label: "S", type: "start" } },
            { id: "A", position: { x: 280, y: 80 }, data: { label: "A", type: "default" } },
            { id: "B", position: { x: 280, y: 320 }, data: { label: "B", type: "default" } },
            { id: "C", position: { x: 460, y: 80 }, data: { label: "C", type: "default" } },
            { id: "D", position: { x: 460, y: 320 }, data: { label: "D", type: "default" } },
            { id: "G", position: { x: 620, y: 200 }, data: { label: "G", type: "goal" } },
        ],
        edges: [
            { id: "S-A", source: "S", target: "A", data: { weight: 3 } },
            { id: "S-B", source: "S", target: "B", data: { weight: 5 } },
            { id: "A-C", source: "A", target: "C", data: { weight: 2 } },
            { id: "B-D", source: "B", target: "D", data: { weight: 4 } },
            { id: "C-G", source: "C", target: "G", data: { weight: 6 } },
            { id: "D-G", source: "D", target: "G", data: { weight: 2 } },
            { id: "A-B", source: "A", target: "B", data: { weight: 1 } },
            { id: "C-D", source: "C", target: "D", data: { weight: 3 } },
        ],
    },
};

// ─── Unique label generator ───────────────────────────────────────────────────
// Generates next available label that doesn't already exist in the graph.
// Uses A-Z first, then A1, B1, C1... to stay short and readable.
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function nextUniqueLabel(existingLabels, nodeType) {
    if (nodeType === "start") return "S";
    if (nodeType === "goal") return "G";
    const used = new Set(existingLabels);
    // Try single letters first
    for (const letter of LETTERS) {
        if (!used.has(letter)) return letter;
    }
    // Then letter+number
    for (let n = 1; n <= 99; n++) {
        for (const letter of LETTERS) {
            const candidate = `${letter}${n}`;
            if (!used.has(candidate)) return candidate;
        }
    }
    return `N${Date.now()}`;
}

// ─── Default edge style factory ───────────────────────────────────────────────
const makeEdge = (source, target, weight = 1) => ({
    id: `${source}-${target}-${Date.now()}`,
    source,
    target,
    type: "customEdge",
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    data: { weight },
});

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGraphState() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isWeighted, setIsWeighted] = useState(false);

    // ── Load a named preset ──────────────────────────────────────────────────
    const loadPreset = useCallback((presetName) => {
        const preset = PRESETS[presetName];
        if (!preset) return;

        const styledNodes = preset.nodes.map((n) => ({
            ...n,
            type: "customNode",
        }));

        const styledEdges = preset.edges.map((e) => ({
            ...e,
            type: "customEdge",
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        }));

        setNodes(styledNodes);
        setEdges(styledEdges);
    }, [setNodes, setEdges]);

    // ── Add a node at a canvas position ──────────────────────────────────────
    const addNode = useCallback(
        (nodeType, position) => {
            const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

            // Enforce single start / single goal — demote existing one to default
            if (nodeType === "start" || nodeType === "goal") {
                setNodes((nds) =>
                    nds.map((n) =>
                        n.data.type === nodeType
                            ? { ...n, data: { ...n.data, type: "default" } }
                            : n
                    )
                );
            }

            // Generate a label that doesn't clash with any existing node label
            const label = (nds) => nextUniqueLabel(nds.map(n => n.data.label), nodeType);

            setNodes((nds) => {
                const newLabel = label(nds);
                const newNode = {
                    id,
                    type: "customNode",
                    position,
                    data: { label: newLabel, type: nodeType },
                };
                return [...nds, newNode];
            });

            return id;
        },
        [setNodes]
    );

    // ── Remove a node and all its connected edges ────────────────────────────
    const removeNode = useCallback(
        (nodeId) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) =>
                eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
            );
        },
        [setNodes, setEdges]
    );

    // ── Handle new edge drawn by user on canvas ──────────────────────────────
    const onConnect = useCallback(
        (params) => {
            const edge = makeEdge(params.source, params.target);
            setEdges((eds) => addEdge({ ...params, ...edge }, eds));
        },
        [setEdges]
    );

    // ── Update edge weight ───────────────────────────────────────────────────
    const updateEdgeWeight = useCallback(
        (edgeId, weight) => {
            setEdges((eds) =>
                eds.map((e) =>
                    e.id === edgeId
                        ? { ...e, data: { ...e.data, weight: Number(weight) } }
                        : e
                )
            );
        },
        [setEdges]
    );

    // ── Remove an edge ───────────────────────────────────────────────────────
    const removeEdge = useCallback(
        (edgeId) => {
            setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        },
        [setEdges]
    );

    // ── Update node label ────────────────────────────────────────────────────
    const updateNodeLabel = useCallback(
        (nodeId, label) => {
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
                )
            );
        },
        [setNodes]
    );

    // ── Change node type (start / goal / default) ────────────────────────────
    const updateNodeType = useCallback(
        (nodeId, type) => {
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, type } } : n
                )
            );
        },
        [setNodes]
    );

    // ── Serialise graph for API call ─────────────────────────────────────────
    const serializeGraph = useCallback(() => {
        const startNode = nodes.find((n) => n.data.type === "start");
        const goalNode = nodes.find((n) => n.data.type === "goal");

        return {
            nodes: nodes.map((n) => ({
                id: n.id,
                label: n.data.label,   // for backend message humanisation
                type: n.data.type,
                position: n.position,     // for h(n) = Euclidean distance in A*/Greedy
            })),
            edges: edges.map((e) => ({
                source: e.source,
                target: e.target,
                weight: e.data?.weight ?? 1,
            })),
            start: startNode?.id ?? null,
            goal: goalNode?.id ?? null,
        };
    }, [nodes, edges]);

    // ── Clear the canvas ─────────────────────────────────────────────────────
    const clearGraph = useCallback(() => {
        setNodes([]);
        setEdges([]);
    }, [setNodes, setEdges]);

    return {
        // React Flow core
        nodes, edges,
        onNodesChange, onEdgesChange, onConnect,
        // ✅ FIX 5: export setNodes/setEdges — App.jsx animation system needs them
        setNodes, setEdges,
        // Node actions
        addNode, removeNode, updateNodeLabel, updateNodeType,
        // Edge actions
        updateEdgeWeight, removeEdge,
        // Graph-level
        loadPreset, serializeGraph, clearGraph,
        // Weighted mode
        isWeighted, setIsWeighted,
        // Preset names
        presetNames: Object.keys(PRESETS),
    };
}