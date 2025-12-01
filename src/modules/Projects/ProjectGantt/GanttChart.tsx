import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TbChevronDown,
  TbChevronRight,
  TbEdit,
  TbTrash,
  TbSubtask,
  TbUser,
  TbCircleCheck,
  TbProgress,
  TbClock,
} from "react-icons/tb";
import type { Task, TaskStatus } from "./types";
import { STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from "./types";

interface GanttChartProps {
  tasks: Task[];
  projectStartDate?: string;
  projectEndDate?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
}

interface FlattenedTask extends Task {
  level: number;
  isExpanded: boolean;
  hasSubtasks: boolean;
}

const ROW_HEIGHT = 40;
const DAY_WIDTH = 32;
const TASK_COLUMN_WIDTH = 280;

export default function GanttChart({
  tasks,
  projectStartDate,
  projectEndDate,
  onEdit,
  onDelete,
  onAddSubtask,
  onStatusChange,
}: GanttChartProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [statusMenuTask, setStatusMenuTask] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tasksBodyRef = useRef<HTMLDivElement>(null);

  // Sincronizar scroll vertical entre tareas y timeline
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tasksBodyRef.current) {
      tasksBodyRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleTasksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Calcular rango de fechas
  const { startDate, totalDays, months, days } = useMemo(() => {
    let minDate = projectStartDate ? new Date(projectStartDate) : new Date();
    let maxDate = projectEndDate ? new Date(projectEndDate) : new Date();

    const collectDates = (taskList: Task[]) => {
      taskList.forEach((task) => {
        if (task.startDate) {
          const taskStart = new Date(task.startDate);
          if (taskStart < minDate) minDate = new Date(taskStart);
        }
        if (task.dueDate) {
          const taskEnd = new Date(task.dueDate);
          if (taskEnd > maxDate) maxDate = new Date(taskEnd);
        }
        if (task.subtasks) collectDates(task.subtasks);
      });
    };
    collectDates(tasks);

    minDate = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    maxDate = new Date(maxDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const totalDays = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const months: { name: string; days: number }[] = [];
    const days: {
      date: Date;
      dayOfWeek: number;
      isToday: boolean;
      dayNum: number;
    }[] = [];

    const currentDate = new Date(minDate);
    let currentMonth = "";
    let monthDays = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalDays; i++) {
      const monthName = currentDate.toLocaleDateString("es-PE", {
        month: "short",
        year: "numeric",
      });

      if (monthName !== currentMonth) {
        if (currentMonth) {
          months.push({ name: currentMonth, days: monthDays });
        }
        currentMonth = monthName;
        monthDays = 0;
      }
      monthDays++;

      const dateToCheck = new Date(currentDate);
      dateToCheck.setHours(0, 0, 0, 0);

      days.push({
        date: new Date(currentDate),
        dayOfWeek: currentDate.getDay(),
        isToday: dateToCheck.getTime() === today.getTime(),
        dayNum: currentDate.getDate(),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentMonth) {
      months.push({ name: currentMonth, days: monthDays });
    }

    return { startDate: minDate, totalDays, months, days };
  }, [tasks, projectStartDate, projectEndDate]);

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

  const getTaskBarStyle = (task: Task) => {
    if (!task.startDate || !task.dueDate) return null;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);

    const startOffset = Math.ceil(
      (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration =
      Math.ceil(
        (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    return {
      left: startOffset * DAY_WIDTH,
      width: Math.max(duration * DAY_WIDTH - 4, 20),
    };
  };

  const isOverdue = (task: Task) => {
    return (
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "completed" &&
      task.status !== "cancelled"
    );
  };

  // Scroll a hoy al montar
  useEffect(() => {
    if (scrollContainerRef.current) {
      const today = new Date();
      const todayOffset = Math.ceil(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const scrollPosition = Math.max(0, (todayOffset - 5) * DAY_WIDTH);
      scrollContainerRef.current.scrollLeft = scrollPosition;
    }
  }, [startDate]);

  const todayIndex = days.findIndex((d) => d.isToday);

  return (
    <div className="flex max-w-full w-full h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Columna fija de tareas */}
      <div
        className="flex flex-col border-r border-gray-200 bg-white"
        style={{ width: TASK_COLUMN_WIDTH, minWidth: TASK_COLUMN_WIDTH }}
      >
        {/* Header de tareas */}
        <div className="p-3 border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
          Tareas ({flattenedTasks.length})
        </div>

        {/* Body de tareas (scroll vertical sincronizado) */}
        <div
          ref={tasksBodyRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          onScroll={handleTasksScroll}
          style={{ scrollbarWidth: "none" }}
        >
          {flattenedTasks.map((task, idx) => (
            <div
              key={task.taskId}
              className={`group flex items-center gap-2 px-2 border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              }`}
              style={{ height: ROW_HEIGHT, paddingLeft: 8 + task.level * 16 }}
            >
              {task.hasSubtasks ? (
                <button
                  onClick={() => toggleExpand(task.taskId)}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                >
                  {task.isExpanded ? (
                    <TbChevronDown className="text-gray-500 text-sm" />
                  ) : (
                    <TbChevronRight className="text-gray-500 text-sm" />
                  )}
                </button>
              ) : (
                <div className="w-4 flex-shrink-0" />
              )}

              <div
                className="w-1 h-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                title={`Prioridad: ${PRIORITY_LABELS[task.priority]}`}
              />

              <span
                className={`flex-1 text-sm truncate ${
                  task.status === "cancelled"
                    ? "text-gray-400 line-through"
                    : "text-gray-800"
                }`}
                title={task.title}
              >
                {task.title}
              </span>

              {task.assignments && task.assignments.length > 0 && (
                <div className="flex items-center text-xs text-gray-400 flex-shrink-0">
                  <TbUser className="text-xs" />
                  <span>{task.assignments.length}</span>
                </div>
              )}

              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => onAddSubtask(task)}
                  className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                  title="Agregar subtarea"
                >
                  <TbSubtask className="text-sm" />
                </button>
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar"
                >
                  <TbEdit className="text-sm" />
                </button>
                <button
                  onClick={() => onDelete(task)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar"
                >
                  <TbTrash className="text-sm" />
                </button>
              </div>
            </div>
          ))}

          {flattenedTasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No hay tareas
            </div>
          )}
        </div>
      </div>

      {/* Timeline con scroll horizontal y vertical */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        onScroll={handleTimelineScroll}
      >
        <div style={{ width: totalDays * DAY_WIDTH }}>
          {/* Header de fechas (sticky) */}
          <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            {/* Meses */}
            <div className="flex border-b border-gray-200">
              {months.map((month, i) => (
                <div
                  key={i}
                  className="text-xs font-medium text-gray-600 text-center py-2 border-r border-gray-200 capitalize"
                  style={{ width: month.days * DAY_WIDTH }}
                >
                  {month.name}
                </div>
              ))}
            </div>

            {/* Días */}
            <div className="flex">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`text-center py-1.5 border-r border-gray-100 ${
                    day.isToday
                      ? "bg-primary text-white font-bold"
                      : day.dayOfWeek === 0 || day.dayOfWeek === 6
                      ? "bg-gray-100 text-gray-400"
                      : "text-gray-500"
                  }`}
                  style={{ width: DAY_WIDTH }}
                >
                  <span className="text-xs">{day.dayNum}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filas del timeline */}
          <div>
            {flattenedTasks.map((task, idx) => {
              const barStyle = getTaskBarStyle(task);
              const taskIsOverdue = isOverdue(task);

              return (
                <div
                  key={task.taskId}
                  className={`relative border-b border-gray-100 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Grid de días */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={`border-r h-full ${
                          day.isToday
                            ? "bg-primary/10 border-primary/30"
                            : day.dayOfWeek === 0 || day.dayOfWeek === 6
                            ? "bg-gray-50 border-gray-100"
                            : "border-gray-100"
                        }`}
                        style={{ width: DAY_WIDTH }}
                      />
                    ))}
                  </div>

                  {/* Línea de hoy */}
                  {todayIndex >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                      style={{ left: todayIndex * DAY_WIDTH + DAY_WIDTH / 2 }}
                    />
                  )}

                  {/* Barra de la tarea */}
                  {barStyle && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: barStyle.width, opacity: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                      className="absolute top-1.5 h-7 rounded cursor-pointer group/bar"
                      style={{
                        left: barStyle.left,
                        backgroundColor: taskIsOverdue
                          ? "#fecaca"
                          : `${STATUS_COLORS[task.status]}30`,
                        border: `2px solid ${
                          taskIsOverdue ? "#ef4444" : STATUS_COLORS[task.status]
                        }`,
                      }}
                      title={`${task.title}\n${task.startDate} → ${task.dueDate}`}
                      onClick={() => setStatusMenuTask(statusMenuTask === task.taskId ? null : task.taskId)}
                    >
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width:
                            task.status === "completed"
                              ? "100%"
                              : task.status === "in_progress"
                              ? "50%"
                              : "0%",
                          backgroundColor: taskIsOverdue
                            ? "#ef4444"
                            : STATUS_COLORS[task.status],
                          opacity: 0.5,
                        }}
                      />

                      {barStyle.width > 60 && (
                        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700 truncate">
                          {task.title}
                        </span>
                      )}

                      {taskIsOverdue && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      )}

                      {/* Menú de cambio de estado */}
                      {statusMenuTask === task.taskId && onStatusChange && (
                        <div 
                          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="px-3 py-1 text-xs text-gray-500 font-medium">Cambiar estado</p>
                          {(["pending", "in_progress", "completed", "cancelled"] as TaskStatus[]).map((status) => (
                            <button
                              key={status}
                              className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                                task.status === status ? "bg-gray-50 font-medium" : ""
                              }`}
                              onClick={() => {
                                onStatusChange(task.taskId, status);
                                setStatusMenuTask(null);
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: STATUS_COLORS[status] }}
                              />
                              {status === "pending" && <TbClock className="text-amber-500" />}
                              {status === "in_progress" && <TbProgress className="text-blue-500" />}
                              {status === "completed" && <TbCircleCheck className="text-green-500" />}
                              {STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {!barStyle && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-gray-300 italic">
                        Sin fechas
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
