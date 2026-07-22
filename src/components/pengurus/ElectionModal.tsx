"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ElectionWheel } from "./ElectionWheel";
import { motion } from "framer-motion";
import { MemberOption } from "./types";

interface ElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberOption[];
  excludeIds?: string[];
  pjSubjects: string[];
  onConfirmPJ: (subjectName: string, winner: MemberOption) => Promise<void>;
  onConfirmPengurus: (jabatan: string, winner: MemberOption) => Promise<void>;
}

export type ElectionType = "pj" | "pengurus";

export function ElectionModal({
  isOpen,
  onClose,
  members,
  excludeIds,
  pjSubjects,
  onConfirmPJ,
  onConfirmPengurus,
}: ElectionModalProps) {
  const [type, setType] = useState<ElectionType>("pj");
  const [target, setTarget] = useState("");
  const [step, setStep] = useState<"select" | "wheel">("select");

  const handleConfirm = async (winner: { userId: string; displayName: string }) => {
    if (type === "pj") {
      await onConfirmPJ(target, winner);
    } else {
      await onConfirmPengurus(target, winner);
    }
    setStep("select");
    setTarget("");
  };

  const pjTargets = pjSubjects;
  const pengurusTargets = [
    "Ketua",
    "Wakil Ketua",
    "Sekretaris",
    "Bendahara",
    "Anggota",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setStep("select");
        setTarget("");
      }}
      title="Roda Pemilihan"
      size="lg"
    >
      {step === "select" ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Jenis
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={type}
              onChange={(e) => {
                setType(e.target.value as ElectionType);
                setTarget("");
              }}
            >
              <option value="pj">PJ Mata Pelajaran</option>
              <option value="pengurus">Pengurus</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {type === "pj" ? "Mata Pelajaran" : "Jabatan"}
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">-- Pilih --</option>
              {(type === "pj" ? pjTargets : pengurusTargets).length === 0 ? (
                <option value="" disabled>
                  {type === "pj" ? "Belum ada mata pelajaran" : "Tidak ada opsi"}
                </option>
              ) : (
                (type === "pj" ? pjTargets : pengurusTargets).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={() => setStep("wheel")} disabled={!target}>
              Mulai
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-sm text-text-muted">
            Memilih {type === "pj" ? "PJ" : ""} {target}
          </p>
          <ElectionWheel
            members={members}
            excludeIds={excludeIds}
            onConfirm={handleConfirm}
            label={target}
          />
        </motion.div>
      )}
    </Modal>
  );
}
