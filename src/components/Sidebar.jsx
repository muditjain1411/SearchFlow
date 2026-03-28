// src/components/Sidebar.jsx
import { useState } from "react";
import {
    Play, RotateCcw, Circle, ArrowRight,
    ChevronDown, Cpu, ListOrdered
} from "lucide-react";

const ALGORITHMS = [
    { group: "Uninformed", items: ["BFS", "DFS", "UCS", "IDDFS", "DLS", "Bidirectional"] },
    { group: "Informed", items: ["Greedy Best-First", "A*"] },
    { group: "Local", items: ["Hill Climbing", "Simulated Annealing"] },
];

const PALETTE_ITEMS = [
    { type: "node", label: "Node", color: "bg-cyan-500", icon: <Circle size={14} /> },
    { type: "start", label: "Start", color: "bg-emerald-500", icon: <Circle size={14} /> },
    { type: "end", label: "Goal", color: "bg-rose-500", icon: <Circle size={14} /> },
    { type: "edge", label: "Edge", color: "bg-violet-500", icon: <ArrowRight size={14} /> },
];

// Dummy steps for now — will be replaced by API response
const DEMO_STEPS = [
    "Initializing graph...",
    "Enqueue start node A",
    "Visit A → neighbors: B, C",
    "Enqueue B, C",
    "Visit B → neighbors: D",
];

export default function Sidebar() {
    const [selectedAlgo, setSelectedAlgo] = useState("BFS");
    const [open, setOpen] = useState(false);
    const [steps] = useState(DEMO_STEPS);

    const handleDragStart = (e, type) => {
        e.dataTransfer.setData("nodeType", type);
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <aside className="
      w-72 shrink-0 h-full flex flex-col
      bg-white dark:bg-gray-900
      border-r border-gray-200 dark:border-gray-800
      overflow-y-auto
    ">

            {/* ── Section 1: Algorithm Selector ── */}
            <Section icon={<Cpu size={14} />} title="Algorithm">
                <div className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="
              w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
              bg-gray-100 dark:bg-gray-800
              text-gray-800 dark:text-gray-200
              hover:bg-gray-200 dark:hover:bg-gray-700
              transition-colors duration-150
            "
                    >
                        <span className="font-medium">{selectedAlgo}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                    </button>

                    {open && (
                        <div className="
              absolute z-20 mt-1 w-full rounded-lg shadow-xl overflow-hidden
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
            ">
                            {ALGORITHMS.map((group) => (
                                <div key={group.group}>
                                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50">
                                        {group.group}
                                    </p>
                                    {group.items.map((algo) => (
                                        <button
                                            key={algo}
                                            onClick={() => { setSelectedAlgo(algo); setOpen(false); }}
                                            className={`
                        w-full text-left px-3 py-2 text-sm transition-colors duration-100
                        ${selectedAlgo === algo
                                                    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium"
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

            {/* ── Section 2: Drag & Drop Palette ── */}
            <Section icon={<Circle size={14} />} title="Components">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
                    Drag onto the canvas to build your graph
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {PALETTE_ITEMS.map((item) => (
                        <div
                            key={item.type}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.type)}
                            className="
                flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing
                bg-gray-100 dark:bg-gray-800
                hover:bg-gray-200 dark:hover:bg-gray-700
                border border-gray-200 dark:border-gray-700
                hover:border-violet-400 dark:hover:border-violet-500
                transition-all duration-150 select-none
              "
                        >
                            <span className={`w-5 h-5 rounded-full ${item.color} flex items-center justify-center text-white shrink-0`}>
                                {item.icon}
                            </span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Section 3: Visualize / Reset ── */}
            <Section icon={<Play size={14} />} title="Controls">
                <div className="flex flex-col gap-2">
                    <button className="
            w-full py-2.5 rounded-lg text-sm font-semibold
            bg-linear-to-r from-violet-500 to-cyan-500
            hover:from-violet-600 hover:to-cyan-600
            text-white shadow-md hover:shadow-violet-500/25
            transition-all duration-200 flex items-center justify-center gap-2
          ">
                        <Play size={14} /> Visualize
                    </button>
                    <button className="
            w-full py-2 rounded-lg text-sm font-medium
            bg-gray-100 dark:bg-gray-800
            hover:bg-gray-200 dark:hover:bg-gray-700
            text-gray-600 dark:text-gray-400
            transition-colors duration-150 flex items-center justify-center gap-2
          ">
                        <RotateCcw size={13} /> Reset
                    </button>
                </div>
            </Section>

            {/* ── Section 4: Step Log ── */}
            <Section icon={<ListOrdered size={14} />} title="Step Log" grow>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-56 pr-1">
                    {steps.length === 0 ? (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                            Steps will appear here during visualization...
                        </p>
                    ) : (
                        steps.map((step, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 text-[11px] py-1.5 px-2 rounded-md
                  bg-gray-50 dark:bg-gray-800/60
                  text-gray-600 dark:text-gray-400"
                            >
                                <span className="text-violet-400 font-mono shrink-0">{String(i + 1).padStart(2, "0")}</span>
                                <span>{step}</span>
                            </div>
                        ))
                    )}
                </div>
            </Section>

        </aside>
    );
}

// Reusable section wrapper
function Section({ icon, title, children, grow = false }) {
    return (
        <div className={`px-4 py-4 border-b border-gray-100 dark:border-gray-800 ${grow ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-500">{icon}</span>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}