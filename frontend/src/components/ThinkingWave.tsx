"use client";

import { motion } from "framer-motion";

export function ThinkingWave() {
  return (
    <div className="flex items-center gap-1 h-4">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-indigo-400 rounded-full"
          animate={{
            height: ["20%", "100%", "20%"], // Grow and shrink
            opacity: [0.5, 1, 0.5], // Pulse
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1, // Stagger them for a wave effect
            ease: "easeInOut",
          }}
          style={{ height: "40%" }}
        />
      ))}
    </div>
  );
}