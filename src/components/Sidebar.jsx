import { useState, useEffect, useRef } from "react";
import {
    Play, RotateCcw, Circle, Lock,
    ChevronDown, Cpu, ListOrdered, LayoutTemplate, Layers, Info,
} from "lucide-react";
import { createDragGhost } from "./GraphCanvas";


const PRESET_NAMES = ["Simple Graph", "Binary Tree", "Weighted Graph"];
const ALGORITHMS = [
    { group: "Uninformed", items: ["BFS", "DFS", "UCS", "IDDFS", "DLS", "Bidirectional"] },
    { group: "Informed", items: ["Greedy Best-First", "A*"] },
    { group: "Local", items: ["Hill Climbing", "Simulated Annealing"] },
];

const PALETTE_ITEMS = [
    { type: "default", label: "Node", color: "bg-gray-500", icon: <Circle size={12} /> },
    { type: "start", label: "Start", color: "bg-emerald-500", icon: <Circle size={12} /> },
    { type: "goal", label: "Goal", color: "bg-rose-500", icon: <Circle size={12} /> },
];



const ALGO_INFO = {
    "BFS": {
        description: "Explores all neighbours level by level, guaranteeing the shortest path by edge count.",
        timeExpr: ({ V, E }) => `O(V+E) = O(${V}+${E}) = O(${V + E})`,
        spaceExpr: ({ V }) => `O(V) = O(${V})`,
        optimal: true, weighted: false,
        useWhen: "Unweighted graphs where fewest hops matter.",
    },
    "DFS": {
        description: "Dives deep along each branch before backtracking. Fast but may miss the optimal path.",
        timeExpr: ({ V, E }) => `O(V+E) = O(${V}+${E}) = O(${V + E})`,
        spaceExpr: ({ V }) => `O(V) = O(${V})`,
        optimal: false, weighted: false,
        useWhen: "Maze solving, cycle detection, or when any path is acceptable.",
    },
    "UCS": {
        description: "Expands the lowest-cost frontier node first, guaranteeing the cheapest path.",
        timeExpr: ({ V, E }) => `O((V+E) log V) = O(${V + E} × log ${V} ≈ ${Math.round((V + E) * Math.log2(Math.max(V, 2)))})`,
        spaceExpr: ({ V }) => `O(V) = O(${V})`,
        optimal: true, weighted: true,
        useWhen: "Weighted graphs where total cost must be minimised.",
    },
    "IDDFS": {
        description: "Runs DFS iteratively with increasing depth limits — DFS memory efficiency with BFS optimality.",
        timeExpr: ({ b, d }) => `O(b^d) = O(${b}^${d}) ≈ O(${Math.round(Math.pow(b, d))})`,
        spaceExpr: ({ d }) => `O(d) = O(${d})`,
        optimal: true, weighted: false,
        useWhen: "Memory-constrained environments needing an optimal unweighted path.",
    },
    "DLS": {
        description: "DFS capped at a user-defined depth limit. Will not find paths deeper than the limit.",
        timeExpr: ({ b, l }) => `O(b^l) = O(${b}^${l}) ≈ O(${Math.round(Math.pow(b, l))})`,
        spaceExpr: ({ l }) => `O(b×l) = O(${l})`,
        optimal: false, weighted: false,
        useWhen: "When the solution depth is roughly known in advance.",
    },
    "Bidirectional": {
        description: "Runs two simultaneous BFS searches from start and goal, meeting in the middle.",
        timeExpr: ({ b, d }) => `O(b^(d/2)) = O(${b}^${Math.ceil(d / 2)}) ≈ O(${Math.round(Math.pow(b, Math.ceil(d / 2)))})`,
        spaceExpr: ({ b, d }) => `O(b^(d/2)) ≈ O(${Math.round(Math.pow(b, Math.ceil(d / 2)))})`,
        optimal: true, weighted: false,
        useWhen: "Large unweighted graphs where full BFS would be too slow.",
    },
    "Greedy Best-First": {
        description: "Always expands the node closest to the goal by heuristic h(n). Fast but not optimal.",
        timeExpr: ({ V, E }) => `O((V+E) log V) = O(${V + E} × log ${V} ≈ ${Math.round((V + E) * Math.log2(Math.max(V, 2)))})`,
        spaceExpr: ({ V }) => `O(V) = O(${V})`,
        optimal: false, weighted: true,
        useWhen: "When speed matters more than path quality.",
    },
    "A*": {
        description: "Combines actual cost g(n) and heuristic h(n) into f(n)=g+h. Optimal when heuristic is admissible.",
        timeExpr: ({ V, E }) => `O((V+E) log V) = O(${V + E} × log ${V} ≈ ${Math.round((V + E) * Math.log2(Math.max(V, 2)))})`,
        spaceExpr: ({ V }) => `O(V) = O(${V})`,
        optimal: true, weighted: true,
        useWhen: "Best general-purpose weighted pathfinding.",
    },
    "Hill Climbing": {
        description: "Greedily moves to the best neighbouring node. Can get permanently stuck at local optima.",
        timeExpr: ({ V }) => `O(V) = O(${V}) per restart`,
        spaceExpr: () => `O(1) — constant`,
        optimal: false, weighted: false,
        useWhen: "Quick approximations; demonstrating local search limitations.",
    },
    "Simulated Annealing": {
        description: "Like hill climbing but occasionally accepts worse moves to escape local optima via a cooling schedule.",
        timeExpr: () => `O(iterations) = O(1000) fixed`,
        spaceExpr: () => `O(1) — constant`,
        optimal: false, weighted: false,
        useWhen: "Optimisation problems where escaping local optima is critical.",
    },
};

const WEIGHTED_REQUIRED = new Set(["UCS", "Greedy Best-First", "A*"]);

const WEIGHTED_FORBIDDEN = new Set(["BFS", "DFS", "IDDFS", "DLS", "Bidirectional", "Hill Climbing", "Simulated Annealing"]);


function AlgoInfoCard({ algo, nodes, edges, dlsDepthLimit }) {
    const info = ALGO_INFO[algo];
    if (!info) return null;

    const V = nodes.length;
    const E = edges.length;
    // Estimate branching factor & depth from graph shape
    const b = Math.max(2, Math.round(E / Math.max(V, 1)));
    const d = Math.max(1, Math.round(Math.log2(Math.max(V, 2))));
    const l = dlsDepthLimit;

    const timeStr = info.timeExpr({ V, E, b, d, l });
    const spaceStr = info.spaceExpr({ V, E, b, d, l });

    return (
        <div className="mt-2 rounded-lg overflow-hidden bg-violet-500/5 border border-violet-500/20 text-[12px] leading-relaxed">

            <div className="px-3 pt-2.5 pb-2 text-gray-600 dark:text-gray-400">
                {info.description}
            </div>

            <div className="px-3 py-2 border-t border-violet-500/10 space-y-1.5">
                <ComplexityRow label="Time" value={timeStr} />
                <ComplexityRow label="Space" value={spaceStr} />
            </div>

            <div className="flex gap-3 px-3 py-2 border-t border-violet-500/10">
                <StatBadge
                    label="Optimal"
                    value={info.optimal ? "Yes" : "No"}
                    valueColor={info.optimal ? "text-emerald-500" : "text-rose-400"}
                />
                <StatBadge
                    label="Weighted"
                    value={info.weighted ? "Required" : "Ignored"}
                    valueColor={info.weighted ? "text-cyan-500" : "text-gray-400 dark:text-gray-500"}
                />
            </div>

            <div className="px-3 py-2 border-t border-violet-500/10 text-gray-500 dark:text-gray-500 italic">
                <span className="not-italic font-semibold text-violet-500 dark:text-violet-400">
                    Use when:{" "}
                </span>
                {info.useWhen}
            </div>
        </div>
    );
}

function ComplexityRow({ label, value }) {
    return (
        <div className="flex items-start gap-2">
            <span className="shrink-0 text-gray-400 dark:text-gray-500 w-9">{label}:</span>
            <span className="font-mono text-violet-600 dark:text-violet-400 break-all">{value}</span>
        </div>
    );
}

function StatBadge({ label, value, valueColor }) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-500">{label}:</span>
            <span className={`font-semibold ${valueColor}`}>{value}</span>
        </div>
    );
}


export function Sidebar({
    nodes,
    edges,
    isWeighted,
    stepLog,
    isRunning,
    speed,
    onSpeedChange,
    onVisualize,
    onLoadPreset,
    onToggleWeighted,
    onClear,
    onAlgoChange,
}) {
    const [selectedAlgo, setSelectedAlgo] = useState("BFS");
    const [algoOpen, setAlgoOpen] = useState(false);
    const [dlsDepthLimit, setDlsDepthLimit] = useState(5);
    const [showInfo, setShowInfo] = useState(false);

    const handleAlgoSelect = (algo) => {
        setSelectedAlgo(algo);
        setAlgoOpen(false);
        onAlgoChange?.();
    };


    useEffect(() => {
        if (WEIGHTED_REQUIRED.has(selectedAlgo) && !isWeighted) {
            onToggleWeighted();   // force ON
        } else if (WEIGHTED_FORBIDDEN.has(selectedAlgo) && isWeighted) {
            onToggleWeighted();   // force OFF
        }

    }, [selectedAlgo]);

    const weightedLocked = WEIGHTED_REQUIRED.has(selectedAlgo) || WEIGHTED_FORBIDDEN.has(selectedAlgo);

    const handleDragStart = (e, type) => {
        const ghost = createDragGhost(type);
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 26, 26);
        e.dataTransfer.setData("nodeType", type);
        setTimeout(() => ghost.remove(), 0);
    };

    return (
        <aside className="
            w-82 shrink-0 h-full flex flex-col
            bg-white dark:bg-gray-900
            border-r border-gray-200 dark:border-gray-800
            overflow-y-auto overflow-x-hidden
        ">

            <Section icon={<Cpu size={18} />} title="Algorithm">

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <button
                            onClick={() => setAlgoOpen(!algoOpen)}
                            className="
                                w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
                                bg-gray-100 dark:bg-gray-800
                                text-gray-800 dark:text-gray-200
                                hover:bg-gray-200 dark:hover:bg-gray-700
                                border border-gray-200 dark:border-gray-700
                                transition-colors duration-150
                            "
                        >
                            <span className="font-medium">{selectedAlgo}</span>
                            <ChevronDown
                                size={18}
                                className={`transition-transform duration-200 ${algoOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {algoOpen && (
                            <div className="
                                absolute z-20 mt-1 w-full rounded-lg shadow-xl overflow-hidden
                                bg-white dark:bg-gray-800
                                border border-gray-200 dark:border-gray-700
                            ">
                                {ALGORITHMS.map((group) => (
                                    <div key={group.group}>
                                        <p className="
                                            px-3 py-1.5 text-[12px] uppercase tracking-widest
                                            text-gray-400 dark:text-gray-500
                                            bg-gray-50 dark:bg-gray-900/60
                                        ">
                                            {group.group}
                                        </p>
                                        {group.items.map((algo) => (
                                            <button
                                                key={algo}
                                                onClick={() => {
                                                    handleAlgoSelect(algo);
                                                    setShowInfo(false);
                                                }}
                                                className={`
                                                    w-full text-left px-3 py-2 text-sm transition-colors duration-100
                                                    ${selectedAlgo === algo
                                                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    }
                                                `}
                                            >
                                                {algo}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowInfo(prev => !prev)}
                        title="Algorithm info"
                        className={`
                            w-10 h-10 shrink-0 rounded-lg flex items-center justify-center
                            border transition-all duration-150
                            ${showInfo
                                ? "bg-violet-500/10 border-violet-400/50 text-violet-500 dark:text-violet-400"
                                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-violet-500 hover:border-violet-400/50"
                            }
                        `}
                    >
                        <Info size={18} />
                    </button>
                </div>

                {showInfo && (
                    <AlgoInfoCard
                        algo={selectedAlgo}
                        nodes={nodes}
                        edges={edges ?? []}
                        dlsDepthLimit={dlsDepthLimit}
                    />
                )}

            </Section>

            <Section icon={<Circle size={18} />} title="Components">
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-3">
                    Drag onto the canvas to place nodes
                </p>

                <div className="grid grid-cols-3 gap-2">
                    {PALETTE_ITEMS.map((item) => (
                        <div
                            key={item.type}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.type)}
                            className="
                                flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg
                                bg-gray-100 dark:bg-gray-800
                                border border-gray-200 dark:border-gray-700
                                hover:border-violet-400 dark:hover:border-violet-500
                                hover:bg-gray-200 dark:hover:bg-gray-700
                                cursor-grab active:cursor-grabbing
                                transition-all duration-150 select-none
                            "
                        >
                            <span className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white`}>
                                {item.icon}
                            </span>
                            <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                <p className="mt-3 text-[12px] text-gray-400 dark:text-gray-500 italic leading-relaxed">
                    💡 Drag and Drop a node on canvas to use.
                </p>
                <p className="mt-3 text-[12px] text-gray-400 dark:text-gray-500 italic leading-relaxed">
                    💡 Hover a node to see handle dots, then drag between them to draw edges.
                </p>
            </Section>

            <Section icon={<LayoutTemplate size={14} />} title="Presets">
                <div className="flex flex-col gap-1.5">
                    {PRESET_NAMES.map((name) => (
                        <button
                            key={name}
                            onClick={() => onLoadPreset?.(name)}
                            className="
                                w-full text-left px-3 py-2 rounded-lg text-xs font-medium
                                bg-gray-100 dark:bg-gray-800
                                text-gray-700 dark:text-gray-300
                                border border-transparent
                                hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400
                                hover:border-violet-400/30
                                transition-all duration-150
                            "
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </Section>

            <Section icon={<Play size={18} />} title="Controls">

                <div
                    onClick={weightedLocked ? undefined : onToggleWeighted}
                    className={`
                        flex items-center justify-between px-3 py-2 rounded-lg mb-3
                        transition-colors duration-150
                        ${weightedLocked
                            ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                            : "cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }
                    `}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Weighted edges
                        </span>
                        {weightedLocked && (
                            <Lock size={12} className="text-gray-400 dark:text-gray-500" />
                        )}
                    </div>
                    <div className={`
                        w-9 h-5 rounded-full relative transition-colors duration-200
                        ${isWeighted ? "bg-violet-500" : "bg-gray-400 dark:bg-gray-600"}
                    `}>
                        <div className={`
                            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow
                            transition-all duration-200
                            ${isWeighted ? "left-4" : "left-0.5"}
                        `} />
                    </div>
                </div>

                {selectedAlgo === "DLS" && (
                    <div className="
                        flex items-center justify-between px-3 py-2 rounded-lg mb-3
                        bg-amber-500/10 border border-amber-500/30
                    ">
                        <div className="flex items-center gap-2">
                            <Layers size={13} className="text-amber-400 shrink-0" />
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Depth limit
                            </span>
                        </div>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={dlsDepthLimit}
                            onChange={e =>
                                setDlsDepthLimit(Math.max(1, Math.min(20, Number(e.target.value))))
                            }
                            className="
                                w-12 text-center text-xs font-mono font-semibold
                                rounded-md px-1 py-1
                                bg-gray-100 dark:bg-gray-800
                                border border-amber-400/40
                                text-gray-800 dark:text-gray-200
                                outline-none focus:border-amber-400
                                transition-colors duration-150
                            "
                        />
                    </div>
                )}

                <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Speed</span>
                        <span>{speed < 300 ? "Fast" : speed < 700 ? "Medium" : "Slow"}</span>
                    </div>
                    <input
                        type="range"
                        min={100}
                        max={2000}
                        step={100}
                        value={speed}
                        onChange={e => onSpeedChange(Number(e.target.value))}
                        className="w-full accent-violet-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>100ms</span>
                        <span>2000ms</span>
                    </div>
                </div>

                <button
                    onClick={() => onVisualize?.(selectedAlgo, dlsDepthLimit)}
                    disabled={isRunning}
                    className="
                        w-full py-2.5 rounded-lg text-sm font-semibold
                        bg-linear-to-r from-violet-500 to-cyan-500
                        hover:from-violet-600 hover:to-cyan-600
                        disabled:opacity-50 disabled:cursor-not-allowed
                        text-white shadow-md hover:shadow-violet-500/25
                        transition-all duration-200
                        flex items-center justify-center gap-2
                    "
                >
                    <Play size={18} /> {isRunning ? "Running..." : "Visualize"}
                </button>

                <button
                    onClick={onClear}
                    disabled={isRunning}
                    className="
                        w-full mt-2 py-2 rounded-lg text-sm font-medium
                        bg-gray-100 dark:bg-gray-800
                        hover:bg-gray-200 dark:hover:bg-gray-700
                        disabled:opacity-50 disabled:cursor-not-allowed
                        text-gray-600 dark:text-gray-400
                        transition-colors duration-150
                        flex items-center justify-center gap-2
                    "
                >
                    <RotateCcw size={18} /> Reset
                </button>
            </Section>

            <Section icon={<ListOrdered size={18} />} title="Step Log" grow>
                <StepLog entries={stepLog} />
            </Section>

        </aside>
    );
}


function classifyStep(text) {
    if (!text) return "default";
    if (text.startsWith("✅")) return "success";
    if (text.startsWith("❌")) return "error";
    if (text.startsWith("⚠️")) return "warn";
    if (/running/i.test(text)) return "init";
    if (/initialising|initializing|iteration/i.test(text)) return "init";
    if (/goal.*reached|reached.*goal/i.test(text)) return "success";
    if (/visiting|settling|visiting/i.test(text)) return "visiting";
    if (/expanded|pushed|added to frontier/i.test(text)) return "expanded";
    if (/backtrack|skipping|no path|exhausted|dead end|cutoff/i.test(text)) return "warn";
    if (/forward|backward/i.test(text)) return "bidir";
    return "default";
}

const STEP_STYLES = {
    success: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/5 dark:bg-emerald-500/10" },
    error: { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/5 dark:bg-rose-500/10" },
    warn: { dot: "bg-amber-400", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/5 dark:bg-amber-500/10" },
    init: { dot: "bg-violet-400", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/5 dark:bg-violet-500/10" },
    visiting: { dot: "bg-violet-500", text: "text-gray-700 dark:text-gray-300", bg: "bg-gray-50 dark:bg-gray-800/60" },
    expanded: { dot: "bg-cyan-400", text: "text-gray-700 dark:text-gray-300", bg: "bg-gray-50 dark:bg-gray-800/60" },
    bidir: { dot: "bg-sky-400", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/5 dark:bg-sky-500/10" },
    default: { dot: "bg-gray-400", text: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/40" },
};

function StepLog({ entries }) {
    const bottomRef = useRef(null);

    
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [entries]);

    if (entries.length === 0) {
        return (
            <p className="text-[14px] text-gray-400 dark:text-gray-500 italic leading-relaxed">
                Steps will appear here once you hit Visualize...
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 pr-1">
            {entries.map((entry, i) => {
                
                const text = entry.replace(/^\d+\.\s*/, "");
                const kind = classifyStep(text);
                const s = STEP_STYLES[kind];
                const isHeader = kind === "success" || kind === "error" || kind === "init";

                return (
                    <div
                        key={i}
                        className={`
                            flex items-start gap-2 px-2 py-1.5 rounded-md text-[11px]
                            ${s.bg}
                            ${isHeader ? "font-medium" : ""}
                        `}
                    >

                        <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                        <span className={`leading-relaxed ${s.text}`}>{text}</span>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}


function Section({ icon, title, children, grow = false }) {
    return (
        <div className={`
            px-4 py-4
            border-b border-gray-100 dark:border-gray-800
            ${grow ? "flex-1 flex flex-col" : ""}
        `}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-500">{icon}</span>
                <h3 className="text-[14px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {title}
                </h3>
            </div>
            <div className={grow ? "flex-1 flex flex-col" : ""}>
                {children}
            </div>
        </div>
    );
}