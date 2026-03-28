// src/components/CustomNode.jsx
import { useState, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { X, Check, Pencil } from "lucide-react";

const TYPE_STYLES = {
    start: "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/40",
    goal: "bg-rose-500 border-rose-400 text-white shadow-rose-500/40",
    default: "bg-gray-800 border-gray-600 text-gray-100 shadow-gray-900/40",
    // Animation states injected by visualizer
    visited: "bg-violet-600 border-violet-400 text-white shadow-violet-500/40",
    frontier: "bg-amber-500 border-amber-400 text-white shadow-amber-500/40",
    path: "bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/40",
};

export default function CustomNode({ id, data, selected }) {
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(data.label);
    const inputRef = useRef(null);

    const typeStyle = TYPE_STYLES[data.animState ?? data.type] ?? TYPE_STYLES.default;

    const commitLabel = () => {
        data.onLabelChange?.(id, label);
        setEditing(false);
    };

    return (
        <div
            className={`
        relative w-14 h-14 rounded-full flex items-center justify-center
        border-2 shadow-lg font-bold text-sm
        transition-all duration-300
        ${typeStyle}
        ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""}
      `}
        >
            {/* Delete button */}
            <button
                onClick={() => data.onRemove?.(id)}
                className="
          absolute -top-2 -right-2 w-5 h-5 rounded-full
          bg-red-500 hover:bg-red-600
          text-white flex items-center justify-center
          opacity-0 group-hover:opacity-100
          shadow-md transition-all duration-150
          z-10
        "
                style={{ opacity: selected ? 1 : undefined }}
            >
                <X size={10} />
            </button>

            {/* Edit button */}
            <button
                onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="
          absolute -top-2 -left-2 w-5 h-5 rounded-full
          bg-gray-600 hover:bg-gray-500
          text-white flex items-center justify-center
          shadow-md transition-all duration-150
        "
                style={{ opacity: selected ? 1 : undefined }}
            >
                <Pencil size={9} />
            </button>

            {/* Label / Input */}
            {editing ? (
                <div className="flex flex-col items-center gap-1">
                    <input
                        ref={inputRef}
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && commitLabel()}
                        className="w-10 text-center text-xs bg-transparent border-b border-white outline-none"
                        maxLength={4}
                    />
                    <button onClick={commitLabel}>
                        <Check size={10} className="text-white" />
                    </button>
                </div>
            ) : (
                <span className="select-none">{data.label}</span>
            )}

            {/* Type badge */}
            {(data.type === "start" || data.type === "goal") && (
                <span className="
          absolute -bottom-5 left-1/2 -translate-x-1/2
          text-[9px] uppercase tracking-widest
          text-gray-400 whitespace-nowrap
        ">
                    {data.type}
                </span>
            )}

            {/* Handles */}
            <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-gray-500 !border-gray-400" />
            <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-gray-500 !border-gray-400" />
            <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gray-500 !border-gray-400" />
            <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gray-500 !border-gray-400" />
        </div>
    );
}