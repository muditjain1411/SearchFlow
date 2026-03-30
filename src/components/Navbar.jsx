import { useState } from "react";
import { Sun, Moon, Share2, Download, GitBranch, Route, Layers, Image, X } from "lucide-react";

const DOWNLOAD_OPTIONS = [
    { id: "full", label: "Full Graph", desc: "All nodes and edges", icon: <GitBranch size={13} />, color: "text-cyan-400" },
    { id: "path", label: "Shortest Route", desc: "Path nodes/edges only", icon: <Route size={13} />, color: "text-emerald-400" },
    { id: "traversal", label: "Traversal", desc: "Visited nodes highlighted", icon: <Layers size={13} />, color: "text-violet-400" },
    { id: "mixed", label: "Mixed View", desc: "Full graph + highlights", icon: <Image size={13} />, color: "text-amber-400" },
];

export default function Navbar({ darkMode, toggleTheme, onExport }) {
    const [showExport, setShowExport] = useState(false);

    return (
        <nav className="
      h-16 px-6 flex items-center justify-between shrink-0 relative z-50
      bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-800
      shadow-sm
    ">

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-md">
                    <Share2 size={16} className="text-white rotate-90" />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        SearchFlow
                    </span>
                    <span className="text-[12px] text-gray-400 dark:text-gray-500 tracking-widest uppercase">
                        Search Algorithm Visualizer
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">

                <div className="relative">
                    <button
                        onClick={() => setShowExport((v) => !v)}
                        className={`
              flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium
              border transition-all duration-200
              ${showExport
                                ? "bg-violet-500 border-violet-400 text-white"
                                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400 hover:text-violet-500 dark:hover:text-violet-400"
                            }
            `}
                    >
                        <Download size={16} />
                        Export
                    </button>

                    {showExport && (
                        <div className="
              absolute right-0 top-11 w-52 rounded-xl overflow-hidden
              bg-white dark:bg-gray-900
              border border-gray-200 dark:border-gray-700
              shadow-2xl shadow-black/20 dark:shadow-black/60
            ">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
                                    Download as
                                </span>
                                <button
                                    onClick={() => setShowExport(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {DOWNLOAD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { onExport?.(opt.id); setShowExport(false); }}
                                    className="
                    w-full flex items-center gap-3 px-3 py-2.5
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    transition-colors duration-150 group
                  "
                                >
                                    <span className={`${opt.color} shrink-0`}>{opt.icon}</span>
                                    <div className="text-left">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                                            {opt.label}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            {opt.desc}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={toggleTheme}
                    className="
            w-10 h-10 rounded-lg flex items-center justify-center
            bg-gray-100 dark:bg-gray-800
            hover:bg-gray-200 dark:hover:bg-gray-700
            text-gray-600 dark:text-gray-300
            border border-gray-200 dark:border-gray-700
            transition-all duration-200
          "
                    aria-label="Toggle theme"
                >
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>
        </nav>
    );
}