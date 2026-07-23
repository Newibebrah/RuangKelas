"use client";

import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { useMobile } from "@/lib/mobile-context";
import { Room } from "@/types";
import { HiCode, HiUsers, HiChevronRight } from "react-icons/hi";

interface RoomCardProps {
  room: Room;
}

const gradients = [
  "from-primary-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-fuchsia-600",
];

export function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();
  const { isMobile } = useMobile();
  const gradientIndex = room.id.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];
  const memberCount =
    ((room as any).memberIds as string[] | undefined)?.length ?? 1;

  if (isMobile) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push(`/room/${room.id}`)}
        className="flex items-center gap-3 px-4 py-3.5 bg-surface/80 backdrop-blur-sm rounded-xl border border-border/60 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
          <span className="text-white font-bold text-sm">
            {room.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-text-primary text-sm truncate">
              {room.name}
            </h3>
            <span className="flex items-center gap-1 text-xs text-text-muted shrink-0">
              <HiUsers className="h-3 w-3" />
              {memberCount}
            </span>
          </div>
          <p className="text-xs text-text-secondary truncate mt-0.5">
            {room.description || "—"}
          </p>
        </div>
        <HiChevronRight className="h-4 w-4 text-text-muted shrink-0" />
      </motion.div>
    );
  }

  return (
    <Card
      hover
      onClick={() => router.push(`/room/${room.id}`)}
      className="h-full group overflow-hidden"
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-text-primary text-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors font-heading">
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-1 ring-primary-200/50 dark:ring-primary-700/30">
            <HiCode className="h-3.5 w-3.5" />
            {room.code}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
