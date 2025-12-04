"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface TypewriterProps {
  content: string;
  speed?: number;
  onComplete?: () => void;
}

export function Typewriter({ content, speed = 10, onComplete }: TypewriterProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If we've typed everything, stop.
    if (currentIndex >= content.length) {
      if (onComplete) onComplete();
      return;
    }

    // Typing interval
    const timer = setTimeout(() => {
      setDisplayedContent((prev) => prev + content[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, content, speed, onComplete]);

  return (
    <div className="prose prose-invert max-w-none text-sm">
      <ReactMarkdown>{displayedContent}</ReactMarkdown>
      {/* Blinking Cursor while typing */}
      {currentIndex < content.length && (
        <span className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-1 animate-pulse" />
      )}
    </div>
  );
}