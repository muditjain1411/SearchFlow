// src/App.jsx
import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          {/* GraphCanvas will slot in here next */}
          <main className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm font-mono">
            [ Graph Canvas coming next ]
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;