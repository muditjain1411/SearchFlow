// src/components/CustomNode.jsx
import { useState, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { X, Check, Pencil } from "lucide-react";

const TYPE_STYLES = {
    start: "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/40",
    goal: "bg-rose-500    border-rose-400    text-white shadow-rose-500/40",
    default: "bg-gray-700    border-gray-500    text-gray-100 shadow-gray-900/40 dark:bg-gray-800 dark:border-gray-600",
    visited: "bg-violet-600  border-violet-400  text-white shadow-violet-500/40",
    frontier: "bg-amber-500   border-amber-400   text-white shadow-amber-500/40",
    path: "bg-cyan-500    border-cyan-400    text-white shadow-cyan-500/40",
};

// Glow ring shown during animation states
const ANIM_GLOW = {
    visited: "ring-2 ring-violet-400/50",
    frontier: "ring-2 ring-amber-400/50",
    path: "ring-2 ring-cyan-400/60",
};

// Handle style — hidden until hover
const HANDLE_BASE = `
    !w-3 !h-3 !rounded-full
    !bg-violet-400 !border-2 !border-violet-300
    !opacity-0 group-hover:!opacity-100
    !transition-opacity !duration-200
`;

export default function CustomNode({ id, data, selected }) {
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(data.label);
    const inputRef = useRef(null);

    const resolvedType = data.animState ?? data.type;
    const typeStyle = TYPE_STYLES[resolvedType] ?? TYPE_STYLES.default;
    const animGlow = ANIM_GLOW[data.animState] ?? "";

    const commitLabel = () => {
        data.onLabelChange?.(id, label || data.label);
        setEditing(false);
    };

    return (
        <div
            className={`
                group relative w-14 h-14 rounded-full
                flex items-center justify-center
                border-2 shadow-lg font-bold text-sm
                transition-all duration-300 cursor-default
                ${typeStyle}
                ${animGlow}
                ${selected
                    ? "ring-2 ring-white ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-950"
                    : ""
                }
            `}
        >
            {/* Delete button */}
            <button
                onClick={() => data.onRemove?.(id)}
                className={`
                    absolute -top-2 -right-2 w-5 h-5 rounded-full z-10
                    bg-red-500 hover:bg-red-600 text-white shadow-md
                    flex items-center justify-center
                    transition-all duration-150
                    ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                `}
            >
                <X size={10} />
            </button>

            {/* Edit button */}
            <button
                onClick={() => {
                    setEditing(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`
                    absolute -top-2 -left-2 w-5 h-5 rounded-full z-10
                    bg-gray-600 hover:bg-gray-500 text-white shadow-md
                    flex items-center justify-center
                    transition-all duration-150
                    ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                `}
            >
                <Pencil size={9} />
            </button>

            {/* Label / inline edit */}
            {editing ? (
                <div className="flex flex-col items-center gap-0.5">
                    <input
                        ref={inputRef}
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && commitLabel()}
                        onBlur={commitLabel}
                        className="w-10 text-center text-xs bg-transparent border-b border-white outline-none"
                        maxLength={4}
                    />
                    <button onClick={commitLabel}>
                        <Check size={10} className="text-white" />
                    </button>
                </div>
            ) : (
                <span className="select-none pointer-events-none">{data.label}</span>
            )}

            {/* Type badge — theme-aware color */}
            {(data.type === "start" || data.type === "goal") && (
                <span className="
                    absolute -bottom-5 left-1/2 -translate-x-1/2
                    text-[9px] uppercase tracking-widest
                    text-gray-500 dark:text-gray-500
                    whitespace-nowrap pointer-events-none font-medium
                ">
                    {data.type}
                </span>
            )}

            {/* Handles — hidden until hover */}
            <Handle type="target" position={Position.Top} className={HANDLE_BASE} />
            <Handle type="source" position={Position.Bottom} className={HANDLE_BASE} />
            <Handle type="target" position={Position.Left} className={HANDLE_BASE} />
            <Handle type="source" position={Position.Right} className={HANDLE_BASE} />
        </div>
    );
}