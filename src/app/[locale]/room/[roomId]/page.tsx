"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/lib/locale-context";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { HiUsers, HiClipboardList, HiCash, HiAcademicCap } from "react-icons/hi";

export default function RoomHomePage() {
  const { t } = useLocale();
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
        <h2 className="text-xl font-bold text-text-primary font-heading">
          {currentRoom?.name}
        </h2>
        <p className="text-text-secondary mt-1">{currentRoom?.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 shadow-sm">
              <HiUsers className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary font-heading">
                {members.length}
              </p>
              <p className="text-sm text-text-secondary">{t('nav.anggota')}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {guruCount > 0 && `${guruCount} guru `}
                {siswaCount > 0 && `${siswaCount} siswa `}
                {adminCount > 0 && `${adminCount} admin`}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success-light dark:bg-success/10 shadow-sm">
              <HiClipboardList className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary font-heading">{activeTasks}</p>
              <p className="text-sm text-text-secondary">{t('room.activeTasks')}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning-light dark:bg-warning/10 shadow-sm">
              <HiCash className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary font-heading">Rp 0</p>
              <p className="text-sm text-text-secondary">{t('room.saldoKas')}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-bold text-text-primary font-heading">{t('room.latestMembers')}</h3>
          </CardHeader>
          <CardBody>
            {members.length === 0 ? (
              <p className="text-sm text-text-muted">{t('common.emptyMembers')}</p>
            ) : (
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm">
                      {member.photoURL ? (
                        <Image
                          src={member.photoURL}
                          alt={member.displayName}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {member.displayName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
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
