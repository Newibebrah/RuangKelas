"use client";

import { useState } from "react";
import { RoomMember } from "@/types";
import { useManageMembers } from "@/hooks/useManageMembers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";
import {
  HiUserRemove,
  HiShieldCheck,
  HiAcademicCap,
  HiUser,
} from "react-icons/hi";

interface MemberListProps {
  roomId: string;
  members: RoomMember[];
  currentUserId: string;
  isAdmin: boolean;
}

export function MemberList({
  roomId,
  members,
  currentUserId,
  isAdmin,
}: MemberListProps) {
  const { changeMemberRole, removeMember } = useManageMembers(roomId);
  const [removeTarget, setRemoveTarget] = useState<RoomMember | null>(null);

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeMember(removeTarget.id, removeTarget.userId);
      toast.success(`${removeTarget.displayName} dikeluarkan dari kelas`);
      setRemoveTarget(null);
    } catch {
      toast.error("Gagal mengeluarkan anggota");
    }
  };

  const handleRoleToggle = async (member: RoomMember) => {
    if (member.role === "admin" || member.role === "pengurus") return;
    const newRole = member.role === "guru" ? "siswa" : "guru";
    try {
      await changeMemberRole(member.id, newRole);
      toast.success(
        `${member.displayName} sekarang berperan sebagai ${newRole}`
      );
    } catch {
      toast.error("Gagal mengubah peran");
    }
  };

  const sorted = [...members].sort((a, b) => {
    if (a.role === "admin") return -1;
    if (b.role === "admin") return 1;
    if (a.role === "guru" && b.role !== "guru") return -1;
    if (a.role !== "guru" && b.role === "guru") return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div>
      <div className="space-y-2">
        {sorted.map((member) => {
          const isSelf = member.userId === currentUserId;
          const canRoleToggle = isAdmin && !isSelf && (member.role === "guru" || member.role === "siswa");
          const canRemove = isAdmin && !isSelf && member.role !== "admin";
          return (
            <Card key={member.id}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-gray-600">
                      {member.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {member.displayName}
                      {isSelf && (
                        <span className="text-xs text-gray-400 ml-1">
                          (Anda)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          member.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : member.role === "guru"
                              ? "bg-blue-100 text-blue-700"
                              : member.role === "pengurus"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {member.role === "admin" && (
                          <HiShieldCheck className="h-3 w-3" />
                        )}
                        {member.role === "guru" && (
                          <HiAcademicCap className="h-3 w-3" />
                        )}
                        {member.role === "siswa" && (
                          <HiUser className="h-3 w-3" />
                        )}
                        {member.role === "pengurus" && (
                          <HiShieldCheck className="h-3 w-3" />
                        )}
                        {member.role}
                      </span>
                      {member.email && (
                        <span className="text-xs text-gray-400">
                          {member.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {(canRoleToggle || canRemove) && (
                  <div className="flex items-center gap-1 shrink-0">
                    {canRoleToggle && (
                      <button
                        onClick={() => handleRoleToggle(member)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={
                          member.role === "guru"
                            ? "Ubah menjadi siswa"
                            : "Ubah menjadi guru"
                        }
                      >
                        {member.role === "guru" ? (
                          <HiUser className="h-4 w-4" />
                        ) : (
                          <HiAcademicCap className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => setRemoveTarget(member)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Keluarkan dari kelas"
                      >
                        <HiUserRemove className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Keluarkan Anggota"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin mengeluarkan{" "}
            <strong>{removeTarget?.displayName}</strong> dari kelas ini?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleRemove}>
              Keluarkan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
