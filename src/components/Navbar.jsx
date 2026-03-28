// src/components/Navbar.jsx
import { Sun, Moon, Share2 } from "lucide-react";

export default function Navbar({ darkMode, toggleTheme }) {
    return (
        <nav className="
      h-14 px-6 flex items-center justify-between shrink-0
      bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-800
      shadow-sm z-50
    ">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-md">
                    <Share2 size={16} className="text-white rotate-90" />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Search Algorithm Visualizer
                    </span>
                </div>
            </div>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="
          w-9 h-9 rounded-lg flex items-center justify-center
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-600 dark:text-gray-300
          transition-all duration-200
        "
                aria-label="Toggle theme"
            >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
        </nav>
    );
}