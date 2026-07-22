"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { HiRefresh, HiCheck } from "react-icons/hi";

const SEGMENT_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981",
  "#8B5CF6", "#F97316", "#06B6D4", "#EF4444",
  "#3B82F6", "#84CC16", "#D946EF", "#14B8A6",
];

interface Member {
  userId: string;
  displayName: string;
}

interface ElectionWheelProps {
  members: Member[];
  onConfirm: (winner: Member) => Promise<void>;
  label: string;
}

const CONFETTI_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981",
  "#8B5CF6", "#F97316", "#06B6D4", "#EF4444",
];

function createConfetti(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.4,
    drift: (Math.random() - 0.5) * 40,
  }));
}

export function ElectionWheel({ members, onConfirm, label }: ElectionWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [confetti, setConfetti] = useState<ReturnType<typeof createConfetti>>([]);
  const wheelRef = useRef<HTMLDivElement>(null);

  const N = members.length;

  useEffect(() => {
    if (confetti.length > 0) {
      const timer = setTimeout(() => setConfetti([]), 3500);
      return () => clearTimeout(timer);
    }
  }, [confetti]);

  const gradient = useMemo(() => {
    if (N === 0) return "";
    const seg = 360 / N;
    return `conic-gradient(${members.map((_, i) => {
      const c = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      const s = i * seg;
      const e = (i + 1) * seg;
      return `${c} ${s}deg ${e}deg`;
    }).join(", ")})`;
  }, [members]);

  const spin = useCallback(() => {
    if (spinning || N === 0) return;
    setWinner(null);
    setConfetti([]);
    setSpinning(true);

    const winnerIndex = Math.floor(Math.random() * N);
    const seg = 360 / N;
    const centerAngle = (winnerIndex + 0.5) * seg;
    // Pointer is at 12 o'clock (270° from 3 o'clock in standard position)
    // For segment center to align with pointer: rotation = 270 - centerAngle
    const target = ((270 - centerAngle) % 360 + 360) % 360;
    const extra = 360 * (5 + Math.floor(Math.random() * 5));
    const currentAngle = ((rotation % 360) + 360) % 360;
    let diff = target - currentAngle;
    if (diff < 0) diff += 360;
    const total = diff + extra;

    setRotation((prev) => prev + total);

    setTimeout(() => {
      setWinner(members[winnerIndex]);
      setSpinning(false);
      setConfetti(createConfetti());
    }, 4500);
  }, [spinning, N, members, rotation]);

  const handleConfirm = async (member?: Member) => {
    const target = member || winner;
    if (!target) return;
    setSaving(true);
    try {
      await onConfirm(target);
      setSaving(false);
    } catch {
      setSaving(false);
    }
  };

  if (N === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-text-muted">Belum ada anggota untuk dipilih</p>
      </div>
    );
  }

  const singleMember = N === 1 ? members[0] : null;

  return (
    <div className="flex flex-col items-center gap-6 relative">

      {/* Confetti */}
      <AnimatePresence>
        {confetti.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
          >
            {confetti.map((piece) => (
              <div
                key={piece.id}
                className="absolute top-0 animate-confetti-fall"
                style={{
                  left: `${piece.x}%`,
                  width: piece.size,
                  height: piece.size * 0.6,
                  backgroundColor: piece.color,
                  borderRadius: 2,
                  transform: `rotate(${piece.rotation}deg)`,
                  animationDelay: `${piece.delay}s`,
                  "--drift": `${piece.drift}px`,
                } as React.CSSProperties}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wheel container */}
      <div
        className="relative flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 -mt-1.5">
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[20px] border-l-transparent border-r-transparent border-t-indigo-500 drop-shadow-lg" />
        </div>

        {/* Glow behind wheel */}
        <div className="absolute w-[90%] h-[90%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl" />

        {/* The wheel */}
        <div
          ref={wheelRef}
          className="relative w-[min(80vw,320px)] h-[min(80vw,320px)] rounded-full shadow-2xl ring-[3px] ring-white/40 dark:ring-slate-700/60"
          style={{
            background: gradient,
            transform: `rotate(${rotation}deg) rotateX(8deg)`,
            transition: spinning
              ? "transform 4.5s cubic-bezier(0.08, 0.72, 0.12, 1)"
              : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: spinning
              ? "0 0 40px rgba(99,102,241,0.3), 0 20px 60px rgba(0,0,0,0.2)"
              : "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          {/* Segment labels */}
          {members.map((m, i) => {
            const seg = 360 / N;
            const angle = (i + 0.5) * seg;
            const rad = (angle * Math.PI) / 180;
            const r = 125;
            const cx = 160;
            const cy = 160;
            const x = cx + r * Math.sin(rad);
            const y = cy - r * Math.cos(rad);
            return (
              <span
                key={m.userId}
                className="absolute text-xs font-bold text-white drop-shadow-lg pointer-events-none select-none"
                style={{
                  left: x,
                  top: y,
                  transform: "translate(-50%, -50%)",
                  maxWidth: 90,
                  textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                  lineHeight: 1.15,
                  rotate: `${-(rotation + angle)}deg`,
                }}
              >
                {m.displayName.length > 10
                  ? m.displayName.slice(0, 10) + "…"
                  : m.displayName}
              </span>
            );
          })}

          {/* Center hub */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 shadow-inner ring-2 ring-white/60 dark:ring-slate-700/60 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Outer ring decoration */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "calc(min(80vw,320px) + 16px)",
          height: "calc(min(80vw,320px) + 16px)",
          border: "4px solid rgba(99,102,241,0.15)",
          borderRadius: "50%",
        }}
      />

      {/* Winner announcement */}
      <AnimatePresence>
        {winner && !spinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="w-full max-w-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 dark:border-slate-700/40 p-6 text-center overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
              className="text-4xl mb-2"
            >
              🎉
            </motion.div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
              {label}
            </p>
            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {winner.displayName}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-3">
        {!singleMember && (
          <Button
            onClick={spin}
            isLoading={spinning}
            disabled={spinning}
            variant="primary"
            size="lg"
          >
            <HiRefresh className="h-4 w-4" />
            {spinning ? "Memutar…" : winner ? "Putar Ulang" : "Putar Roda"}
          </Button>
        )}
        {((winner && !spinning) || singleMember) && (
          <Button
            onClick={singleMember ? () => handleConfirm(singleMember) : () => handleConfirm()}
            isLoading={saving}
            variant="primary"
            size="lg"
          >
            <HiCheck className="h-4 w-4" />
            Konfirmasi
          </Button>
        )}
      </div>
    </div>
  );
}