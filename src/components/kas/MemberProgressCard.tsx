"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { HiCheckCircle, HiClock } from "react-icons/hi";

interface MemberProgressCardProps {
  displayName: string;
  paidCount: number;
  totalPeriods: number;
  amount: number;
}

export function MemberProgressCard({
  displayName,
  paidCount,
  totalPeriods,
  amount,
}: MemberProgressCardProps) {
  const progress = totalPeriods > 0 ? Math.round((paidCount / totalPeriods) * 100) : 0;
  const totalPaid = paidCount * amount;
  const remaining = (totalPeriods - paidCount) * amount;

  return (
    <Card>
      <CardBody>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Progres Pembayaran
        </h3>
        <p className="text-lg font-semibold text-gray-900 mb-3">
          {displayName}
        </p>

        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">
              {paidCount}/{totalPeriods} periode
            </span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <HiCheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-green-700 font-medium">
                Rp {totalPaid.toLocaleString("id-ID")}
              </p>
              <p className="text-green-600 text-xs">Sudah dibayar</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <HiClock className="h-5 w-5 text-yellow-600 shrink-0" />
            <div>
              <p className="text-yellow-700 font-medium">
                Rp {remaining.toLocaleString("id-ID")}
              </p>
              <p className="text-yellow-600 text-xs">Tertunggak</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
