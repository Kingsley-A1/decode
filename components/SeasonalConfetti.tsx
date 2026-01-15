"use client";

import { useEffect, useState } from "react";

const start = new Date("2025-12-16T00:00:00Z");
const end = new Date("2026-01-02T23:59:59Z");

function inSeasonWindow(now: Date) {
  return now >= start && now <= end;
}

function buildPieces(): Piece[] {
  return Array.from({ length: 60 }).map(() => ({
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 4.2 + Math.random() * 1.8,
    size: 6 + Math.random() * 10,
    color: ["#f97316", "#22d3ee", "#a855f7", "#f43f5e", "#22c55e"][Math.floor(Math.random() * 5)],
    rotation: -40 + Math.random() * 80,
    drift: -18 + Math.random() * 36,
    opacity: 0.7 + Math.random() * 0.3,
    roundness: Math.random() > 0.5 ? `${8 + Math.random() * 20}%` : `${2 + Math.random() * 8}%`,
  }));
}

const confettiPieces = buildPieces();

type Piece = {
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotation: number;
  drift: number;
  opacity: number;
  roundness: string;
};

export function SeasonalConfetti() {
  const [visible, setVisible] = useState(() => inSeasonWindow(new Date()));
  const [showMessage, setShowMessage] = useState(false);
  const [pieces] = useState<Piece[]>(confettiPieces);

  useEffect(() => {
    if (!visible) return;
    const messageTimer = setTimeout(() => setShowMessage(true), 1400);
    const hideTimer = setTimeout(() => setVisible(false), 6200);
    return () => {
      clearTimeout(messageTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style jsx global>{`
        @keyframes decode-confetti-fall {
          0% { transform: translate3d(0,-100%,0) rotate(0deg); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translate3d(0,120vh,0) rotate(360deg); opacity: 0; }
        }
        @keyframes decode-confetti-sway {
          0% { transform: translateX(0); }
          50% { transform: translateX(var(--decode-confetti-drift)); }
          100% { transform: translateX(0); }
        }
        @keyframes decode-confetti-message {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {pieces.map((piece, idx) => (
        <span
          key={idx}
          className="absolute rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 0.5}px`,
            backgroundColor: piece.color,
            opacity: piece.opacity,
            borderRadius: piece.roundness,
            boxShadow: `0 0 0.5px rgba(0,0,0,0.2)`,
            animation: `decode-confetti-fall ${piece.duration}s ease-in forwards, decode-confetti-sway ${piece.duration * 0.7}s ease-in-out infinite`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
            ['--decode-confetti-drift' as string]: `${piece.drift}px`,
          } as React.CSSProperties}
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        {showMessage && (
          <div
            className="rounded-2xl bg-neutral-900/80 px-5 py-3 text-center text-sm font-semibold text-orange-50 shadow-2xl shadow-orange-500/20 border border-orange-400/50"
            style={{ animation: "decode-confetti-message 240ms ease-out forwards" }}
            aria-live="polite"
          >
            Compliment of the Season From Team DECODE!
          </div>
        )}
      </div>
    </div>
  );
}
