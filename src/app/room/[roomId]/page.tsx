"use client";

import { useParams } from "next/navigation";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { HiUsers, HiClipboardList, HiCash } from "react-icons/hi";

export default function RoomHomePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { currentRoom, members } = useRoom();
  const { user } = useAuth();

  const isAdmin =
    members.find((m) => m.userId === user?.id)?.role === "admin" ||
    members.find((m) => m.userId === user?.id)?.role === "pengurus";

  const guruCount = members.filter((m) => m.role === "guru").length;
  const siswaCount = members.filter((m) => m.role === "siswa").length;
  const pengurusCount = members.filter((m) => m.role === "pengurus").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {currentRoom?.name}
        </h2>
        <p className="text-gray-500 mt-1">{currentRoom?.description}</p>
        <p className="text-xs text-gray-400 mt-1">
          Kode Kelas: <span className="font-mono font-bold">{currentRoom?.code}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <HiUsers className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {members.length}
              </p>
              <p className="text-sm text-gray-500">Anggota</p>
              <p className="text-xs text-gray-400">
                {guruCount > 0 && `${guruCount} guru `}
                {siswaCount > 0 && `${siswaCount} siswa `}
                {pengurusCount > 0 && `${pengurusCount} pengurus`}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <HiClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Tugas Aktif</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <HiCash className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">Rp 0</p>
              <p className="text-sm text-gray-500">Saldo Kas</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Anggota Terbaru</h3>
          </CardHeader>
          <CardBody>
            {members.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada anggota</p>
            ) : (
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {member.displayName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.displayName}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
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
