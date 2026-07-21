"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Room } from "@/types";
import { HiUsers, HiCode } from "react-icons/hi";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();

  return (
    <Card
      hover
      onClick={() => router.push(`/room/${room.id}`)}
      className="h-full"
    >
      <CardHeader>
        <h3 className="font-semibold text-gray-900 text-lg">{room.name}</h3>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {room.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <HiCode className="h-4 w-4" />
            {room.code}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
