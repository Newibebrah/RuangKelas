"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
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

export function ElectionWheel({ members, onConfirm, label }: ElectionWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const N = members.length;

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
    setSpinning(true);

    const winnerIndex = Math.floor(Math.random() * N);
    const seg = 360 / N;
    const target = (winnerIndex + 0.5) * seg;
    const extra = 360 * (5 + Math.floor(Math.random() * 5));
    const total = target + extra;

    setRotation((prev) => prev + total);

    setTimeout(() => {
      setWinner(members[winnerIndex]);
      setSpinning(false);
    }, 4000);
  }, [spinning, N, members]);

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
        <p className="text-sm text-gray-400">Belum ada anggota untuk dipilih</p>
      </div>
    );
  }

  const singleMember = N === 1 ? members[0] : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-72 h-72">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[20px] border-l-transparent border-r-transparent border-t-blue-600 drop-shadow" />
        </div>
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full shadow-lg"
          style={{
            background: gradient,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
          }}
        >
          {members.map((m, i) => {
            const seg = 360 / N;
            const angle = (i + 0.5) * seg;
            const rad = (angle * Math.PI) / 180;
            const r = 110;
            const cx = 144;
            const cy = 144;
            const x = cx + r * Math.sin(rad);
            const y = cy - r * Math.cos(rad);
            return (
              <span
                key={m.userId}
                className="absolute text-xs font-bold text-white drop-shadow"
                style={{
                  left: x,
                  top: y,
                  transform: "translate(-50%, -50%)",
                  maxWidth: 80,
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
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
        <Card className="w-full max-w-sm border-green-200">
          <CardBody>
            <p className="text-sm text-gray-500 text-center mb-1">
              Hasil Pemilihan {label}
            </p>
            <p className="text-lg font-bold text-center text-green-700">
              {winner.displayName}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="flex gap-3">
        {!singleMember && (
          <Button
            onClick={spin}
            isLoading={spinning}
            disabled={spinning}
          >
            <HiRefresh className="h-4 w-4 mr-1" />
            {spinning ? "Memutar…" : winner ? "Putar Ulang" : "Putar"}
          </Button>
        )}
        {((winner && !spinning) || singleMember) && (
          <Button
            onClick={singleMember ? () => handleConfirm(singleMember) : () => handleConfirm()}
            isLoading={saving}
            variant="primary"
          >
            <HiCheck className="h-4 w-4 mr-1" />
            Konfirmasi
          </Button>
        )}
      </div>
    </div>
  );
}
