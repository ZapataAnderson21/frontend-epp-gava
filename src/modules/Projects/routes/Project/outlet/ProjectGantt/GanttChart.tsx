import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TbCircleCheck, TbProgress, TbClock } from "react-icons/tb";
import type { Task, TaskStatus } from "./types";
import { STATUS_COLORS, STATUS_LABELS } from "./types";
import { formatToLongMonthDate } from "../../../../../../utils";
import DraggableTaskRow from "./components/DraggableTaskRow";

/**
 * Parsea una fecha ISO sin desfase por zona horaria.
 * "2025-12-10T00:00:00.000Z" -> Date representando 2025-12-10 a medianoche UTC
 */
function parseISODate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  // Extraer solo la parte de la fecha (YYYY-MM-DD)
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = datePart.split('-').map(Number);
  // Crear fecha en UTC para evitar desfases de zona horaria
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // Usar mediodía UTC para evitar problemas
}

interface GanttChartProps {
  tasks: Task[];
  projectStartDate?: string;
  projectEndDate?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
  onReorder?: (taskId: number, newIndex: number) => void;
}

interface FlattenedTask extends Task {
  level: number;
  isExpanded: boolean;
  hasSubtasks: boolean;
}

const ROW_HEIGHT = 40;
const DAY_WIDTH = 32;
const TASK_COLUMN_WIDTH = 280;
const HEADER_MONTH_HEIGHT = 28;
const HEADER_DAY_HEIGHT = 28;

export default function GanttChart({
  tasks,
  projectStartDate,
  projectEndDate,
  onEdit,
  onDelete,
  onAddSubtask,
  onStatusChange,
  onReorder,
}: GanttChartProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [statusMenuTask, setStatusMenuTask] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tasksBodyRef = useRef<HTMLDivElement>(null);

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de iniciar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler para cuando termina el drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      // Usar solo tareas raíz ordenadas para calcular índices correctos
      const rootTasks = flattenedTasks.filter((t) => t.level === 0);
      const oldIndex = rootTasks.findIndex((t) => t.taskId === active.id);
      const newIndex = rootTasks.findIndex((t) => t.taskId === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(Number(active.id), newIndex);
      }
    }
  };

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
    let minDate = projectStartDate ? parseISODate(projectStartDate) || new Date() : new Date();
    let maxDate = projectEndDate ? parseISODate(projectEndDate) || new Date() : new Date();

    const collectDates = (taskList: Task[]) => {
      taskList.forEach((task) => {
        if (task.startDate) {
          const taskStart = parseISODate(task.startDate);
          if (taskStart && taskStart < minDate) minDate = new Date(taskStart);
        }
        if (task.dueDate) {
          const taskEnd = parseISODate(task.dueDate);
          if (taskEnd && taskEnd > maxDate) maxDate = new Date(taskEnd);
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
        // Ordenar subtareas por displayOrder también
        const sortedSubtasks = [...task.subtasks!].sort(
          (a, b) => a.displayOrder - b.displayOrder
        );
        sortedSubtasks.forEach((subtask) => processTask(subtask, level + 1));
      }
    };

    // Ordenar tareas raíz por displayOrder
    const rootTasks = tasks
      .filter((t) => !t.parentTaskId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
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

    const taskStart = parseISODate(task.startDate);
    const taskEnd = parseISODate(task.dueDate);

    if (!taskStart || !taskEnd) return null;

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
    if (!task.dueDate) return false;
    const dueDate = parseISODate(task.dueDate);
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Normalizar a mediodía para comparar solo fechas
    return (
      dueDate < today &&
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
        {/* Header de tareas - 2 filas para alinear con el header del calendario */}
        <div className="border-b border-gray-200 bg-gray-50">
          {/* Fila 1: Título (misma altura que fila de meses) */}
          <div 
            className="px-3 flex items-center font-semibold text-gray-700"
            style={{ height: HEADER_MONTH_HEIGHT + HEADER_DAY_HEIGHT + 1 }}
          >
            Tareas ({flattenedTasks.length})
          </div>
        </div>
        {/* Body de tareas (scroll vertical sincronizado) */}
        <div
          ref={tasksBodyRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          onScroll={handleTasksScroll}
          style={{ scrollbarWidth: "none" }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flattenedTasks.map((t) => t.taskId)}
              strategy={verticalListSortingStrategy}
            >
              {flattenedTasks.map((task, idx) => (
                <DraggableTaskRow
                  key={task.taskId}
                  task={task}
                  index={idx}
                  rowHeight={ROW_HEIGHT}
                  onToggleExpand={toggleExpand}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSubtask={onAddSubtask}
                />
              ))}
            </SortableContext>
          </DndContext>

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
                  className="text-xs font-medium text-gray-600 text-center flex items-center justify-center border-r border-gray-200 capitalize"
                  style={{ width: month.days * DAY_WIDTH, height: HEADER_MONTH_HEIGHT }}
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
                  className={`flex items-center justify-center border-r border-gray-100 ${
                    day.isToday
                      ? "bg-primary text-white font-bold"
                      : day.dayOfWeek === 0 || day.dayOfWeek === 6
                      ? "bg-gray-100 text-gray-400"
                      : "text-gray-500"
                  }`}
                  style={{ width: DAY_WIDTH, height: HEADER_DAY_HEIGHT }}
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
                      title={`${task.title}\n${formatToLongMonthDate(task.startDate ? task.startDate.toString() : "")} → ${formatToLongMonthDate(task.dueDate ? task.dueDate.toString() : "")}`}
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
