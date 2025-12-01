import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbChevronDown,
  TbChevronRight,
  TbEdit,
  TbTrash,
  TbUser,
  TbCalendar,
  TbAlertCircle,
  TbSubtask,
} from "react-icons/tb";
import type { Task } from "./types";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "./types";

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (parentTask: Task) => void;
}

interface FlattenedTask extends Task {
  level: number;
  isExpanded: boolean;
  hasSubtasks: boolean;
}

export default function TaskTable({
  tasks,
  onEdit,
  onDelete,
  onAddSubtask,
}: TaskTableProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  // Aplanar tareas con jerarquía
  const flattenedTasks = useMemo((): FlattenedTask[] => {
    const result: FlattenedTask[] = [];

    const processTask = (task: Task, level: number) => {
      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
      const isExpanded = expandedTasks.has(task.taskId);

      result.push({
        ...task,
        level,
        isExpanded,
        hasSubtasks: hasSubtasks || false,
      });

      if (hasSubtasks && isExpanded) {
        task.subtasks!.forEach((subtask) => processTask(subtask, level + 1));
      }
    };

    // Solo procesar tareas raíz (sin parentTaskId)
    const rootTasks = tasks.filter((t) => !t.parentTaskId);
    rootTasks.forEach((task) => processTask(task, 0));

    return result;
  }, [tasks, expandedTasks]);

  const toggleExpand = (taskId: number) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
    });
  };

  const isOverdue = (task: Task) => {
    return (
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "completed" &&
      task.status !== "cancelled"
    );
  };

  // Calcular progreso de la barra
  const getProgressWidth = (task: Task) => {
    if (!task.startDate || !task.dueDate) return 0;
    const start = new Date(task.startDate).getTime();
    const end = new Date(task.dueDate).getTime();
    const now = new Date().getTime();
    
    if (task.status === "completed") return 100;
    if (task.status === "cancelled") return 100;
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 1 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, delay: i * 0.04 },
    }),
  };

  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 bg-gray-100 font-semibold text-gray-700 rounded-t-lg">
          <div className="col-span-4 px-4 py-3">Tarea</div>
          <div className="col-span-1 px-2 py-3 text-center">Estado</div>
          <div className="col-span-1 px-2 py-3 text-center">Prioridad</div>
          <div className="col-span-2 px-2 py-3">Encargados</div>
          <div className="col-span-2 px-2 py-3">Progreso</div>
          <div className="col-span-2 px-2 py-3 text-right">Acciones</div>
        </div>

        {/* Body */}
        <div className="border border-t-0 border-gray-100 rounded-b-lg">
          <AnimatePresence>
            {flattenedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <TbCalendar className="text-5xl mb-3 text-gray-300" />
                <p className="text-lg font-medium">No hay tareas</p>
                <p className="text-sm">Crea tu primera tarea para comenzar</p>
              </div>
            ) : (
              flattenedTasks.map((task, idx) => (
                <motion.div
                  key={task.taskId}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  custom={idx}
                  className={`grid grid-cols-12 gap-2 items-center border-b border-gray-100 last:border-b-0 hover:bg-blue-50/50 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {/* Tarea */}
                  <div
                    className="col-span-4 px-4 py-3 flex items-center gap-2"
                    style={{ paddingLeft: `${16 + task.level * 24}px` }}
                  >
                    {/* Botón expandir */}
                    {task.hasSubtasks ? (
                      <button
                        onClick={() => toggleExpand(task.taskId)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                      >
                        {task.isExpanded ? (
                          <TbChevronDown className="text-gray-500" />
                        ) : (
                          <TbChevronRight className="text-gray-500" />
                        )}
                      </button>
                    ) : (
                      <div className="w-6 flex-shrink-0" />
                    )}

                    {/* Indicador de prioridad */}
                    <div
                      className="w-1.5 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                      title={`Prioridad: ${PRIORITY_LABELS[task.priority]}`}
                    />

                    {/* Título */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          task.status === "cancelled" ? "text-gray-400 line-through" : "text-gray-800"
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-500 truncate" title={task.description}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    {isOverdue(task) && (
                      <TbAlertCircle className="text-red-500 flex-shrink-0" title="Vencida" />
                    )}
                  </div>

                  {/* Estado */}
                  <div className="col-span-1 px-2 py-3 flex justify-center">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: `${STATUS_COLORS[task.status]}20`,
                        color: STATUS_COLORS[task.status],
                      }}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>

                  {/* Prioridad */}
                  <div className="col-span-1 px-2 py-3 flex justify-center">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                        color: PRIORITY_COLORS[task.priority],
                      }}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>

                  {/* Encargados */}
                  <div className="col-span-2 px-2 py-3">
                    {task.assignments && task.assignments.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                          {task.assignments.slice(0, 3).map((assignment) => (
                            <div
                              key={assignment.taskAssignmentId}
                              className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                              title={`${assignment.user.name} ${assignment.user.lastName}`}
                            >
                              {assignment.user.name.charAt(0)}
                              {assignment.user.lastName.charAt(0)}
                            </div>
                          ))}
                        </div>
                        {task.assignments.length > 3 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{task.assignments.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <TbUser />
                        Sin asignar
                      </span>
                    )}
                  </div>

                  {/* Progreso / Fechas */}
                  <div className="col-span-2 px-2 py-3">
                    {task.startDate && task.dueDate ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(task.startDate)}</span>
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${getProgressWidth(task)}%`,
                              backgroundColor:
                                task.status === "completed"
                                  ? STATUS_COLORS.completed
                                  : isOverdue(task)
                                  ? "#ef4444"
                                  : STATUS_COLORS[task.status],
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <TbCalendar />
                        Sin fechas
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="col-span-2 px-2 py-3 flex items-center justify-end gap-1">
                    <button
                      onClick={() => onAddSubtask(task)}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Agregar subtarea"
                    >
                      <TbSubtask />
                    </button>
                    <button
                      onClick={() => onEdit(task)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <TbEdit />
                    </button>
                    <button
                      onClick={() => onDelete(task)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TbTrash />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
