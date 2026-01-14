export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskAssignment {
  taskAssignmentId: number;
  userId: number;
  user: {
    userId: number;
    name: string;
    lastName: string;
    email?: string;
  };
}

export interface Task {
  taskId: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  parentTaskId?: number | null;
  displayOrder: number;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks?: Task[];
  assignments?: TaskAssignment[];
  _count?: {
    subtasks: number;
  };
}

export interface GanttTask extends Task {
  level: number;
  isExpanded?: boolean;
}

// DTOs para crear/actualizar tareas
export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId: number;
  parentTaskId?: number;
  displayOrder?: number;
  startDate?: string;
  dueDate?: string;
  assignedUserIds?: number[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  parentTaskId?: number | null;
  displayOrder?: number;
  startDate?: string | null;
  dueDate?: string | null;
  assignedUserIds?: number[];
}

// DTO para cambio rápido de estado
export interface UpdateTaskStatusDto {
  status: TaskStatus;
}

// DTO para reordenar múltiples tareas
export interface ReorderTasksDto {
  updates: {
    taskId: number;
    displayOrder: number;
  }[];
}

// Respuesta del endpoint de progreso
export interface TaskProgressResponse {
  projectId: number;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  overdue: number;
  progressPercentage: number;
}

// Colores por estado
export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "#f59e0b",     // amber
  in_progress: "#3b82f6", // blue
  completed: "#22c55e",   // green
  cancelled: "#6b7280",   // gray
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};

// Colores por prioridad
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "#6b7280",      // gray
  medium: "#3b82f6",   // blue
  high: "#f59e0b",     // amber
  urgent: "#ef4444",   // red
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};
