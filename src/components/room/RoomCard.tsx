"use client";

import { useRouter } from "@/i18n/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Room } from "@/types";
import { HiCode, HiUsers } from "react-icons/hi";

interface RoomCardProps {
  room: Room;
}

const gradients = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-fuchsia-600",
];

export function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();
  const gradientIndex = room.id.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];
  const memberCount =
    ((room as any).memberIds as string[] | undefined)?.length ?? 1;

  return (
    <Card
      hover
      onClick={() => router.push(`/room/${room.id}`)}
      className="h-full group overflow-hidden"
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-text-primary text-lg group-hover:text-primary-600 transition-colors">
            {room.name}
          </h3>
          <span className="flex items-center gap-1.5 text-xs text-text-muted shrink-0 ml-3 mt-0.5">
            <HiUsers className="h-3.5 w-3.5" />
            {memberCount}
          </span>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-text-secondary mb-4 line-clamp-2 leading-relaxed">
          {room.description}
        </p>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600">
            <HiCode className="h-3.5 w-3.5" />
            {room.code}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
