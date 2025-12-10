"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700 hover:border-orange-500/50 transition-all shadow-lg"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-orange-400" />
        ) : (
          <Moon className="w-5 h-5 text-amber-600" />
        )}
      </motion.div>
    </motion.button>
  );
}
