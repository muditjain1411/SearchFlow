// src/components/Sidebar.jsx
import { useState } from "react";
import {
    Play, RotateCcw, Circle,
    ChevronDown, Cpu, ListOrdered, LayoutTemplate,
} from "lucide-react";
import { createDragGhost } from "./GraphCanvas";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export function Sidebar({
    nodes,
    isWeighted,
    stepLog,
    isRunning,
    speed,
    onSpeedChange,
    onVisualize,
    onLoadPreset,
    onToggleWeighted,
    onClear,
}) {
    const [selectedAlgo, setSelectedAlgo] = useState("BFS");
    const [algoOpen, setAlgoOpen] = useState(false);

    const handleDragStart = (e, type) => {
        const ghost = createDragGhost(type);
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 26, 26);
        e.dataTransfer.setData("nodeType", type);
        setTimeout(() => ghost.remove(), 0);
    };

    return (
        <aside className="
      w-72 shrink-0 h-full flex flex-col
      bg-white dark:bg-gray-900
      border-r border-gray-200 dark:border-gray-800
      overflow-y-auto overflow-x-hidden
    ">

            {/* ══ 1. ALGORITHM SELECTOR ══════════════════════════════════════════ */}
            <Section icon={<Cpu size={14} />} title="Algorithm">
                <div className="relative">
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
                            size={14}
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
                    px-3 py-1.5 text-[10px] uppercase tracking-widest
                    text-gray-400 dark:text-gray-500
                    bg-gray-50 dark:bg-gray-900/60
                  ">
                                        {group.group}
                                    </p>
                                    {group.items.map((algo) => (
                                        <button
                                            key={algo}
                                            onClick={() => { setSelectedAlgo(algo); setAlgoOpen(false); }}
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
            </Section>

            {/* ══ 2. DRAG & DROP PALETTE ════════════════════════════════════════ */}
            <Section icon={<Circle size={14} />} title="Components">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
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
                            <span className={`
                w-8 h-8 rounded-full ${item.color}
                flex items-center justify-center text-white
              `}>
                                {item.icon}
                            </span>
                            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                <p className="mt-3 text-[10px] text-gray-400 dark:text-gray-500 italic leading-relaxed">
                    💡 Hover a node to see handle dots, then drag between them to draw edges.
                </p>
            </Section>

            {/* ══ 3. PRESETS ═══════════════════════════════════════════════════ */}
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

            {/* ══ 4. CONTROLS ══════════════════════════════════════════════════ */}
            <Section icon={<Play size={14} />} title="Controls">

                {/* Weighted toggle */}
                <div
                    onClick={onToggleWeighted}
                    className="
            flex items-center justify-between
            px-3 py-2 rounded-lg mb-3 cursor-pointer
            bg-gray-100 dark:bg-gray-800
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition-colors duration-150
          "
                >
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        Weighted edges
                    </span>
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

                {/* Speed Control */}
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

                {/* Visualize button */}
                <button
                    onClick={() => onVisualize?.(selectedAlgo)}
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
                    <Play size={14} /> {isRunning ? "Running..." : "Visualize"}
                </button>

                {/* Reset button */}
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
                    <RotateCcw size={13} /> Reset
                </button>
            </Section>

            {/* ══ 5. STEP LOG ══════════════════════════════════════════════════ */}
            <Section icon={<ListOrdered size={14} />} title="Step Log" grow>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-60 pr-1">
                    {stepLog.length === 0 ? (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 italic leading-relaxed">
                            Steps will appear here once you hit Visualize...
                        </p>
                    ) : (
                        stepLog.map((step, i) => (
                            <div
                                key={i}
                                className="
                  flex items-start gap-2 px-2 py-1.5 rounded-md text-[11px]
                  bg-gray-50 dark:bg-gray-800/60
                  text-gray-600 dark:text-gray-400
                "
                            >
                                <span className="text-violet-400 font-mono shrink-0">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                            </div>
                        ))
                    )}
                </div>
            </Section>

        </aside>
    );
}

// ─── Reusable Section Wrapper ─────────────────────────────────────────────────

function Section({ icon, title, children, grow = false }) {
    return (
        <div className={`
      px-4 py-4
      border-b border-gray-100 dark:border-gray-800
      ${grow ? "flex-1 flex flex-col" : ""}
    `}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-500">{icon}</span>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {title}
                </h3>
            </div>
            <div className={grow ? "flex-1 flex flex-col" : ""}>
                {children}
            </div>
        </div>
    );
}