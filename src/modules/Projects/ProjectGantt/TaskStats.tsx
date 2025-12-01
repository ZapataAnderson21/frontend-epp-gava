import { useMemo } from "react";
import {
  TbChecklist,
  TbClock,
  TbAlertCircle,
  TbCircleCheck,
  TbProgress,
} from "react-icons/tb";
import type { Task } from "./types";
import { STATUS_COLORS } from "./types";

interface TaskStatsProps {
  tasks: Task[];
}

export default function TaskStats({ tasks }: TaskStatsProps) {
  const stats = useMemo(() => {
    // Contar todas las tareas incluyendo subtareas
    const allTasks: Task[] = [];
    const collectTasks = (taskList: Task[]) => {
      taskList.forEach((task) => {
        allTasks.push(task);
        if (task.subtasks) {
          collectTasks(task.subtasks);
        }
      });
    };
    collectTasks(tasks);

    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "completed").length;
    const inProgress = allTasks.filter((t) => t.status === "in_progress").length;
    const pending = allTasks.filter((t) => t.status === "pending").length;
    const overdue = allTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "completed" &&
        t.status !== "cancelled"
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, overdue, completionRate };
  }, [tasks]);

  const statItems = [
    {
      label: "Total",
      value: stats.total,
      icon: TbChecklist,
      color: "#6b7280",
      bgColor: "bg-gray-100",
    },
    {
      label: "Completadas",
      value: stats.completed,
      icon: TbCircleCheck,
      color: STATUS_COLORS.completed,
      bgColor: "bg-green-100",
    },
    {
      label: "En progreso",
      value: stats.inProgress,
      icon: TbProgress,
      color: STATUS_COLORS.in_progress,
      bgColor: "bg-blue-100",
    },
    {
      label: "Pendientes",
      value: stats.pending,
      icon: TbClock,
      color: STATUS_COLORS.pending,
      bgColor: "bg-amber-100",
    },
    {
      label: "Vencidas",
      value: stats.overdue,
      icon: TbAlertCircle,
      color: "#ef4444",
      bgColor: "bg-red-100",
      highlight: stats.overdue > 0,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 w-full">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${item.bgColor} ${
            item.highlight ? "ring-2 ring-red-300" : ""
          }`}
        >
          <item.icon className="text-lg" style={{ color: item.color }} />
          <div>
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-lg font-bold" style={{ color: item.color }}>
              {item.value}
            </p>
          </div>
        </div>
      ))}

      {/* Barra de progreso general */}
      <div className="flex-1 min-w-[200px] max-w-[300px]">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progreso general</span>
          <span className="font-bold text-primary">{stats.completionRate}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
