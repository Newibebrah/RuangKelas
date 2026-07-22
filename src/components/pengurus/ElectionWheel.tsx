"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { HiRefresh, HiCheck } from "react-icons/hi";

const SEGMENT_COLORS = [
  "#F87171", "#60A5FA", "#34D399", "#FBBF24",
  "#A78BFA", "#F472B6", "#FB923C", "#2DD4BF",
  "#818CF8", "#E879F9", "#FCD34D", "#6EE7B7",
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

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  drift: number;
}

const CONFETTI_COLORS = [
  "#F87171", "#60A5FA", "#34D399", "#FBBF24",
  "#A78BFA", "#F472B6", "#FB923C", "#2DD4BF",
  "#E879F9", "#FCD34D",
];

export function ElectionWheel({ members, onConfirm, label }: ElectionWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);

  const N = members.length;

  useEffect(() => {
    if (confetti.length > 0) {
      const timer = setTimeout(() => setConfetti([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [confetti]);

  const gradient = useMemo(() => {
    if (N === 0) return "";
    const seg = 360 / N;
    return `conic-gradient(${members.map((_, i) => {
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      const start = i * seg;
      const end = (i + 1) * seg;
      return `${color} ${start}deg ${end}deg`;
    }).join(", ")})`;
  }, [members]);

  const spin = useCallback(() => {
    if (spinning || N === 0) return;
    setWinner(null);
    setConfetti([]);
    setSpinning(true);

    const winnerIndex = Math.floor(Math.random() * N);
    const seg = 360 / N;
    const target = (winnerIndex + 0.5) * seg;
    const extra = 360 * (5 + Math.floor(Math.random() * 5));
    const currentAngle = rotation % 360;
    const diff = target - currentAngle;
    const adjustedTarget = diff >= 0 ? diff : diff + 360;
    const total = adjustedTarget + extra;

    setRotation((prev) => prev + total);

    setTimeout(() => {
      setWinner(members[winnerIndex]);
      setSpinning(false);
      const pieces: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.4,
        drift: (Math.random() - 0.5) * 40,
      }));
      setConfetti(pieces);
    }, 4000);
  }, [spinning, N, members, rotation]);

  const handleConfirm = async (member?: Member) => {
    const target = member || winner;
    if (!target) return;
    setSaving(true);
    try {
      await onConfirm(target);
    } finally {
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
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
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
        </div>
      )}

      <div
        className="relative w-80 h-80 group"
        style={{ perspective: "1000px" }}
      >
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[22px] border-l-transparent border-r-transparent border-t-indigo-500 drop-shadow-lg" />
        </div>
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full shadow-2xl ring-4 ring-white/50 dark:ring-slate-800/50 transition-transform duration-300"
          style={{
            background: gradient,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
          }}
          onMouseEnter={(e) => {
            if (!spinning) {
              e.currentTarget.style.transform = `rotate(${rotation}deg) scale(1.03)`;
            }
          }}
          onMouseLeave={(e) => {
            if (!spinning) {
              e.currentTarget.style.transform = `rotate(${rotation}deg) scale(1)`;
            }
          }}
        >
          {/* Center hub */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 shadow-inner ring-2 ring-white/60 dark:ring-slate-700/60" />
          </div>

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
                className="absolute text-xs font-bold text-white drop-shadow-lg pointer-events-none"
                style={{
                  left: x,
                  top: y,
                  transform: "translate(-50%, -50%)",
                  maxWidth: 90,
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  lineHeight: 1.2,
                }}
              >
                {m.displayName.length > 10
                  ? m.displayName.slice(0, 10) + "…"
                  : m.displayName}
              </span>
            );
          })}
        </div>
      </div>

      {winner && !spinning && (
        <div className="w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 p-6 text-center animate-bounce-in">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Hasil Pemilihan {label}
          </p>
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {winner.displayName}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {!singleMember && (
          <Button
            onClick={spin}
            isLoading={spinning}
            disabled={spinning}
            variant="primary"
            size="lg"
          >
            <HiRefresh className="h-4 w-4 mr-1" />
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
            <HiCheck className="h-4 w-4 mr-1" />
            Konfirmasi
          </Button>
        )}
      </div>
    </div>
  );
}
