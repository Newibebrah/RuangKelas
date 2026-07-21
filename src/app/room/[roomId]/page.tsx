"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { HiUsers, HiClipboardList, HiCash } from "react-icons/hi";

export default function RoomHomePage() {
  const params = useParams();
  const { currentRoom, members } = useRoom();
  const { user } = useAuth();
  const [activeTasks, setActiveTasks] = useState(0);

  const guruCount = members.filter((m) => m.role === "guru").length;
  const siswaCount = members.filter((m) => m.role === "siswa").length;
  const adminCount = members.filter((m) => m.role === "admin").length;

  useEffect(() => {
    const roomId = params.roomId as string;
    if (!roomId) return;
    const q = query(collection(db, "tugas"), where("roomId", "==", roomId));
    const unsub = onSnapshot(q, (snap) => setActiveTasks(snap.size));
    return unsub;
  }, [params.roomId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">
          {currentRoom?.name}
        </h2>
        <p className="text-text-secondary mt-1">{currentRoom?.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50">
              <HiUsers className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {members.length}
              </p>
              <p className="text-sm text-text-secondary">Anggota</p>
              <p className="text-xs text-text-muted">
                {guruCount > 0 && `${guruCount} guru `}
                {siswaCount > 0 && `${siswaCount} siswa `}
                {adminCount > 0 && `${adminCount} admin`}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success-light">
              <HiClipboardList className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{activeTasks}</p>
              <p className="text-sm text-text-secondary">Tugas Aktif</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning-light">
              <HiCash className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">Rp 0</p>
              <p className="text-sm text-text-secondary">Saldo Kas</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-text-primary">Anggota Terbaru</h3>
          </CardHeader>
          <CardBody>
            {members.length === 0 ? (
              <p className="text-sm text-text-muted">Belum ada anggota</p>
            ) : (
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-surface-hover flex items-center justify-center overflow-hidden ring-2 ring-border">
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={member.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-text-secondary">
                          {member.displayName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {member.displayName}
                      </p>
                      <p className="text-xs text-text-muted capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
