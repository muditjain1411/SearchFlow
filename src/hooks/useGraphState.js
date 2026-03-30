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
            { id: "A", position: { x: 400, y: 80 }, data: { label: "A", type: "start" } },
            { id: "B", position: { x: 200, y: 260 }, data: { label: "B", type: "default" } },
            { id: "C", position: { x: 600, y: 260 }, data: { label: "C", type: "default" } },
            { id: "D", position: { x: 200, y: 440 }, data: { label: "D", type: "default" } },
            { id: "E", position: { x: 600, y: 440 }, data: { label: "E", type: "goal" } },
        ],
        edges: [
            // A centered above B and C — straight bottom-src down to top-tgt
            { id: "A-B", source: "A", target: "B", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 1 } },
            { id: "A-C", source: "A", target: "C", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 4 } },
            // B directly above D
            { id: "B-D", source: "B", target: "D", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 2 } },
            // C directly above E
            { id: "C-E", source: "C", target: "E", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 3 } },
            // D and E same row — horizontal
            { id: "D-E", source: "D", target: "E", sourceHandle: "right-src", targetHandle: "left-tgt", data: { weight: 1 } },
        ],
    },

    "Binary Tree": {
        nodes: [
            { id: "1", position: { x: 350, y: 60 }, data: { label: "1", type: "start" } },
            { id: "2", position: { x: 175, y: 200 }, data: { label: "2", type: "default" } },
            { id: "3", position: { x: 525, y: 200 }, data: { label: "3", type: "default" } },
            { id: "4", position: { x: 75, y: 340 }, data: { label: "4", type: "default" } },
            { id: "5", position: { x: 275, y: 340 }, data: { label: "5", type: "default" } },
            { id: "6", position: { x: 425, y: 340 }, data: { label: "6", type: "default" } },
            { id: "7", position: { x: 625, y: 340 }, data: { label: "7", type: "goal" } },
        ],
        edges: [
            { id: "1-2", source: "1", target: "2", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 1 } },
            { id: "1-3", source: "1", target: "3", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 1 } },
            { id: "2-4", source: "2", target: "4", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 1 } },
            { id: "2-5", source: "2", target: "5", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 1 } },
            { id: "3-6", source: "3", target: "6", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 1 } },
            { id: "3-7", source: "3", target: "7", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 1 } },
        ],
    },

    "Weighted Graph": {
        nodes: [
            { id: "S", position: { x: 80, y: 240 }, data: { label: "S", type: "start" } },
            { id: "A", position: { x: 300, y: 100 }, data: { label: "A", type: "default" } },
            { id: "B", position: { x: 300, y: 380 }, data: { label: "B", type: "default" } },
            { id: "C", position: { x: 520, y: 100 }, data: { label: "C", type: "default" } },
            { id: "D", position: { x: 520, y: 380 }, data: { label: "D", type: "default" } },
            { id: "G", position: { x: 720, y: 240 }, data: { label: "G", type: "goal" } },
        ],
        edges: [
            // S → A: diagonal up-right — bottom-src to left-tgt
            { id: "S-A", source: "S", target: "A", sourceHandle: "right-src", targetHandle: "left-tgt", data: { weight: 3 } },
            // S → B: diagonal down-right — top-src to left-tgt
            { id: "S-B", source: "S", target: "B", sourceHandle: "right-src", targetHandle: "left-tgt", data: { weight: 5 } },
            // A → C: same row horizontal
            { id: "A-C", source: "A", target: "C", sourceHandle: "right-src", targetHandle: "left-tgt", data: { weight: 2 } },
            // B → D: same row horizontal
            { id: "B-D", source: "B", target: "D", sourceHandle: "right-src", targetHandle: "left-tgt", data: { weight: 4 } },
            // C → G: diagonal down-right — right-src to top-tgt
            { id: "C-G", source: "C", target: "G", sourceHandle: "right-src", targetHandle: "left-tgt", data: { weight: 6 } },
            // D → G: diagonal up-right — right-src to bottom-tgt
            { id: "D-G", source: "D", target: "G", sourceHandle: "right-src", targetHandle: "left-tgt", data: { weight: 2 } },
            // A → B: same column vertical
            { id: "A-B", source: "A", target: "B", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 1 } },
            // C → D: same column vertical
            { id: "C-D", source: "C", target: "D", sourceHandle: "bottom-src", targetHandle: "top-tgt", data: { weight: 3 } },
        ],
    },
};

// ─── Unique label generator ───────────────────────────────────────────────────
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function nextUniqueLabel(existingLabels, nodeType) {
    if (nodeType === "start") return "S";
    if (nodeType === "goal") return "G";
    const used = new Set(existingLabels);
    for (const letter of LETTERS) {
        if (!used.has(letter)) return letter;
    }
    for (let n = 1; n <= 99; n++) {
        for (const letter of LETTERS) {
            const candidate = `${letter}${n}`;
            if (!used.has(candidate)) return candidate;
        }
    }
    return `N${Date.now()}`;
}

// ─── Default edge factory ─────────────────────────────────────────────────────
const makeEdge = (source, target, weight = 1, sourcePosition, targetPosition) => ({
    id: `${source}-${target}-${Date.now()}`,
    source,
    target,
    type: "customEdge",
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    ...(sourcePosition && { sourcePosition }),
    ...(targetPosition && { targetPosition }),
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
            // ✅ Pass explicit handle IDs through so CustomEdge renders clean beziers
            sourceHandle: e.sourceHandle ?? null,
            targetHandle: e.targetHandle ?? null,
        }));

        setNodes(styledNodes);
        setEdges(styledEdges);
    }, [setNodes, setEdges]);

    const addNode = useCallback(
        (nodeType, position) => {
            const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

            if (nodeType === "start" || nodeType === "goal") {
                setNodes((nds) =>
                    nds.map((n) =>
                        n.data.type === nodeType
                            ? { ...n, data: { ...n.data, type: "default", animState: null } }
                            : n
                    )
                );
            }

            setNodes((nds) => {
                const newLabel = nextUniqueLabel(nds.map(n => n.data.label), nodeType);
                // ✅ Clear all animStates on existing nodes + add new node clean
                return [
                    ...nds.map(n => ({ ...n, data: { ...n.data, animState: null } })),
                    {
                        id,
                        type: "customNode",
                        position,
                        data: { label: newLabel, type: nodeType, animState: null },
                    },
                ];
            });

            // ✅ Clear all edge animStates too
            setEdges(eds => eds.map(e => ({ ...e, data: { ...e.data, animState: null } })));

            return id;
        },
        [setNodes, setEdges]  // ← add setEdges to deps
    );

    const removeNode = useCallback(
        (nodeId) => {
            setNodes((nds) =>
                nds
                    .filter((n) => n.id !== nodeId)
                    .map(n => ({ ...n, data: { ...n.data, animState: null } })) // ✅
            );
            setEdges((eds) =>
                eds
                    .filter((e) => e.source !== nodeId && e.target !== nodeId)
                    .map(e => ({ ...e, data: { ...e.data, animState: null } })) // ✅
            );
        },
        [setNodes, setEdges]
    );

    const onConnect = useCallback(
        (params) => {
            const edge = makeEdge(
                params.source,
                params.target,
                1,
                params.sourcePosition,
                params.targetPosition,
            );
            setEdges((eds) =>
                addEdge(
                    { ...params, ...edge },
                    eds.map(e => ({ ...e, data: { ...e.data, animState: null } })) // ✅
                )
            );
            // ✅ Clear node animStates too
            setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, animState: null } })));
        },
        [setEdges, setNodes]  // ← add setNodes to deps
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

    const removeEdge = useCallback(
        (edgeId) => {
            setEdges((eds) =>
                eds
                    .filter((e) => e.id !== edgeId)
                    .map(e => ({ ...e, data: { ...e.data, animState: null } })) // ✅
            );
            // ✅ Clear node animStates too
            setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, animState: null } })));
        },
        [setEdges, setNodes]  // ← add setNodes to deps
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

    // ── Change node type ─────────────────────────────────────────────────────
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
                label: n.data.label,
                type: n.data.type,
                position: n.position,       // needed for A*/Greedy Euclidean h(n)
            })),
            edges: edges.map((e) => ({
                source: e.source,
                target: e.target,
                data: { weight: e.data?.weight ?? 1 },  // nested for backend _parse_weight
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
        nodes, edges,
        onNodesChange, onEdgesChange, onConnect,
        setNodes, setEdges,
        addNode, removeNode, updateNodeLabel, updateNodeType,
        updateEdgeWeight, removeEdge,
        loadPreset, serializeGraph, clearGraph,
        isWeighted, setIsWeighted,
        presetNames: Object.keys(PRESETS),
    };
}