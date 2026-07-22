"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ElectionWheel } from "./ElectionWheel";
import { MemberOption } from "./types";

interface ElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberOption[];
  pjSubjects: string[];
  onConfirmPJ: (subjectName: string, winner: MemberOption) => Promise<void>;
  onConfirmPengurus: (jabatan: string, winner: MemberOption) => Promise<void>;
}

export type ElectionType = "pj" | "pengurus";

export function ElectionModal({
  isOpen,
  onClose,
  members,
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Jenis
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
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
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {type === "pj" ? "Mata Pelajaran" : "Jabatan"}
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
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
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-text-muted">
            Memilih {type === "pj" ? "PJ" : ""} {target}
          </p>
          <ElectionWheel
            members={members}
            onConfirm={handleConfirm}
            label={target}
          />
        </div>
      )}
    </Modal>
  );
}
