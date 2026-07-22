"use client";

import { useRouter } from "@/i18n/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Room } from "@/types";
import { HiCode } from "react-icons/hi";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();

  return (
    <Card
      hover
      onClick={() => router.push(`/room/${room.id}`)}
      className="h-full group"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-text-primary text-lg group-hover:text-primary-600 transition-colors">
            {room.name}
          </h3>
          <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-text-secondary mb-4 line-clamp-2 leading-relaxed">
          {room.description}
        </p>
        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600">
            <HiCode className="h-3.5 w-3.5" />
            {room.code}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
