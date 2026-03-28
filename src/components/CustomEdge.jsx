// src/components/CustomEdge.jsx
import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getStraightPath } from "@xyflow/react";
import { X } from "lucide-react";

export default function CustomEdge({
    id, sourceX, sourceY, targetX, targetY,
    data, selected,
}) {
    const [editing, setEditing] = useState(false);
    const [weight, setWeight] = useState(data?.weight ?? 1);

    const [edgePath, labelX, labelY] = getStraightPath({
        sourceX, sourceY, targetX, targetY,
    });

    const commitWeight = () => {
        data?.onWeightChange?.(id, weight);
        setEditing(false);
    };

    const edgeColor = data?.animState === "path"
        ? "#06b6d4"   // cyan  — final path
        : data?.animState === "visited"
            ? "#7c3aed"   // violet — visited
            : "#6b7280";  // gray  — default

    return (
        <>
            <BaseEdge
                path={edgePath}
                style={{
                    stroke: edgeColor,
                    strokeWidth: selected ? 2.5 : 1.5,
                    transition: "stroke 0.3s",
                }}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: "all",
                    }}
                    className="flex items-center gap-1 nodrag nopan"
                >
                    {/* Weight badge */}
                    {data?.showWeight && (
                        editing ? (
                            <input
                                autoFocus
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                onBlur={commitWeight}
                                onKeyDown={(e) => e.key === "Enter" && commitWeight()}
                                className="
                  w-10 text-center text-xs rounded px-1 py-0.5
                  bg-gray-900 border border-violet-500
                  text-white outline-none
                "
                            />
                        ) : (
                            <button
                                onClick={() => setEditing(true)}
                                className="
                  px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold
                  bg-gray-800 border border-gray-600
                  text-gray-200 hover:border-violet-400
                  transition-colors duration-150
                "
                            >
                                {weight}
                            </button>
                        )
                    )}

                    {/* Delete edge button */}
                    {selected && (
                        <button
                            onClick={() => data?.onRemove?.(id)}
                            className="
                w-4 h-4 rounded-full bg-red-500 hover:bg-red-600
                text-white flex items-center justify-center
                transition-colors duration-150
              "
                        >
                            <X size={8} />
                        </button>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}