import {
  CircleAlert as TbAlertCircle,
  CircleCheck as TbCircleCheck,
  Clock as TbClock,
  Gauge as TbProgress,
  ListChecks as TbChecklist,
} from "lucide-react";
import StatCard from "../components/StatCard";
import { STATUS_COLORS } from "../types";

interface StatsListProps {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

export default function StatsList({ total, completed, inProgress, pending, overdue }: StatsListProps) {
  return (
    <>
      <StatCard
        label="Total"
        value={total}
        icon={<TbChecklist className="text-base" style={{ color: "#6b7280" }} />}
        color="#6b7280"
        bgColor="#f3f4f6"
      />

      <StatCard
        label="Completadas"
        value={completed}
        icon={<TbCircleCheck className="text-base" style={{ color: STATUS_COLORS.completed }} />}
        color={STATUS_COLORS.completed}
        bgColor="#dcfce7"
      />

      <StatCard
        label="En progreso"
        value={inProgress}
        icon={<TbProgress className="text-base" style={{ color: STATUS_COLORS.in_progress }} />}
        color={STATUS_COLORS.in_progress}
        bgColor="#dbeafe"
      />

      <StatCard
        label="Pendientes"
        value={pending}
        icon={<TbClock className="text-base" style={{ color: STATUS_COLORS.pending }} />}
        color={STATUS_COLORS.pending}
        bgColor="#fef3c7"
      />

      <StatCard
        label="Vencidas"
        value={overdue}
        icon={<TbAlertCircle className="text-base" style={{ color: "#ef4444" }} />}
        color="#ef4444"
        bgColor="#fee2e2"
        highlight={overdue > 0}
      />
    </>
  );
}