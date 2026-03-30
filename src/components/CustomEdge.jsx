
import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, Position } from "@xyflow/react";
import { X } from "lucide-react";


function inferPositions(sourceX, sourceY, targetX, targetY) {
    const dx = Math.abs(targetX - sourceX);
    const dy = Math.abs(targetY - sourceY);

    if (dx > dy * 2) {
       
        return targetX > sourceX
            ? { src: Position.Right, tgt: Position.Left }
            : { src: Position.Left, tgt: Position.Right };
    }
    if (dy > dx * 0.5) {
        // Vertical or diagonal — use Top/Bottom
        return targetY > sourceY
            ? { src: Position.Bottom, tgt: Position.Top }
            : { src: Position.Top, tgt: Position.Bottom };
    }

    return targetY > sourceY
        ? { src: Position.Bottom, tgt: Position.Top }
        : { src: Position.Top, tgt: Position.Bottom };
}

export default function CustomEdge({
    id, sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    data, selected,
}) {
    const [editing, setEditing] = useState(false);
    const [weight, setWeight] = useState(data?.weight ?? 1);

    const { src, tgt } = (sourcePosition && targetPosition)
        ? { src: sourcePosition, tgt: targetPosition }
        : inferPositions(sourceX, sourceY, targetX, targetY);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition: src,
        targetX, targetY, targetPosition: tgt,
    });

    const commitWeight = () => {
        data?.onWeightChange?.(id, weight);
        setEditing(false);
    };

    const isPath = data?.animState === "path";
    const isVisited = data?.animState === "visited";
    const edgeColor = isPath ? "#06b6d4" : isVisited ? "#7c3aed" : "#9ca3af";
    const strokeWidth = isPath ? 2.5 : selected ? 2 : 1.5;

    return (
        <>
            {isPath && (
                <BaseEdge
                    path={edgePath}
                    style={{ stroke: "#06b6d4", strokeWidth: 8, opacity: 0.18, transition: "all 0.3s" }}
                />
            )}
            <BaseEdge
                path={edgePath}
                style={{ stroke: edgeColor, strokeWidth, transition: "stroke 0.3s, stroke-width 0.2s" }}
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
                    {data?.showWeight && (
                        editing ? (
                            <input
                                autoFocus
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                onBlur={commitWeight}
                                onKeyDown={(e) => e.key === "Enter" && commitWeight()}
                                className="w-10 text-center text-xs rounded px-1 py-0.5 bg-white dark:bg-gray-900 border border-violet-500 text-gray-900 dark:text-white outline-none shadow-md"
                            />
                        ) : (
                            <button
                                onClick={() => setEditing(true)}
                                className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm transition-colors duration-150"
                            >
                                {data?.weight ?? weight}
                            </button>
                        )
                    )}
                    {selected && (
                        <button
                            onClick={() => data?.onRemove?.(id)}
                            className="w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-sm transition-colors duration-150"
                        >
                            <X size={8} />
                        </button>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}