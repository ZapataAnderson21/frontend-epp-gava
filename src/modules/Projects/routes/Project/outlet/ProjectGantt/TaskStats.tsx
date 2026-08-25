import { useMemo } from "react";
import type { Task } from "./types";
import StatsList from "./sections/StatsList";

interface TaskStatsProps {
  tasks: Task[];
}

// Función para recolectar todas las tareas incluyendo subtareas
function collectAllTasks(tasks: Task[]): Task[] {
  return tasks.flatMap((task) => [
    task,
    ...(task.subtasks ? collectAllTasks(task.subtasks) : []),
  ]);
}

// Función para verificar si una tarea está vencida
function isOverdue(task: Task): boolean {
  return Boolean(
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed" &&
    task.status !== "cancelled"
  );
}

export default function TaskStats({ tasks }: TaskStatsProps) {
  const allTasks = useMemo(() => collectAllTasks(tasks), [tasks]);

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.status === "completed").length;
  const inProgress = allTasks.filter((t) => t.status === "in_progress").length;
  const pending = allTasks.filter((t) => t.status === "pending").length;
  const overdue = allTasks.filter(isOverdue).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-4 w-full">
      <StatsList
        total={total}
        completed={completed}
        inProgress={inProgress}
        pending={pending}
        overdue={overdue}
      />

      {/* Barra de progreso general */}
      <div className="flex-1 min-w-[200px] max-w-[300px]">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600">Progreso general</span>
          <span className="font-bold text-primary">{completionRate}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
