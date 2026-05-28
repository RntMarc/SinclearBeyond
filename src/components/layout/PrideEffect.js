"use client";

import { useEffect, useState } from "react";

export default function PrideEffect({ count = 10 }) {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const symbols = ["🌈", "🏳️‍🌈", "✨", "💖"];
    const newElements = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      size: `${Math.random() * 20 + 10}px`,
      duration: `${Math.random() * 10 + 10}s`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.3 + 0.2,
    }));
    setElements(newElements);
  }, [count]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-[60]"
      aria-hidden="true"
    >
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute top-[-50px] animate-fall-slow"
          style={{
            left: el.left,
            fontSize: el.size,
            animationDuration: el.duration,
            animationDelay: el.delay,
            opacity: el.opacity,
          }}
        >
          {el.symbol}
        </div>
      ))}
      <style jsx global>{`
        @keyframes fall-slow {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(360deg); }
        }
        .animate-fall-slow {
          animation: fall-slow linear infinite;
        }
      `}</style>
    </div>
  );
}
