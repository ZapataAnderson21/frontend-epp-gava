import { TbAlertCircle, TbChecklist, TbCircleCheck, TbClock, TbProgress } from "react-icons/tb";
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
        icon={<TbChecklist className="text-lg" style={{ color: "#6b7280" }} />}
        color="#6b7280"
        bgColor="#f3f4f6"
      />

      <StatCard
        label="Completadas"
        value={completed}
        icon={<TbCircleCheck className="text-lg" style={{ color: STATUS_COLORS.completed }} />}
        color={STATUS_COLORS.completed}
        bgColor="#dcfce7"
      />

      <StatCard
        label="En progreso"
        value={inProgress}
        icon={<TbProgress className="text-lg" style={{ color: STATUS_COLORS.in_progress }} />}
        color={STATUS_COLORS.in_progress}
        bgColor="#dbeafe"
      />

      <StatCard
        label="Pendientes"
        value={pending}
        icon={<TbClock className="text-lg" style={{ color: STATUS_COLORS.pending }} />}
        color={STATUS_COLORS.pending}
        bgColor="#fef3c7"
      />

      <StatCard
        label="Vencidas"
        value={overdue}
        icon={<TbAlertCircle className="text-lg" style={{ color: "#ef4444" }} />}
        color="#ef4444"
        bgColor="#fee2e2"
        highlight={overdue > 0}
      />
    </>
  );
}