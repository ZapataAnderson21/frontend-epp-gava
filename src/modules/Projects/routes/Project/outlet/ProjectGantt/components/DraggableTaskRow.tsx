import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown as TbChevronDown,
  ChevronRight as TbChevronRight,
  GripVertical as TbGripVertical,
  ListTree as TbSubtask,
  Pencil as TbEdit,
  Trash2 as TbTrash,
  User as TbUser,
} from "lucide-react";
import type { Task } from "../types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "../types";

interface FlattenedTask extends Task {
  level: number;
  isExpanded: boolean;
  hasSubtasks: boolean;
}

interface DraggableTaskRowProps {
  task: FlattenedTask;
  index: number;
  rowHeight: number;
  onToggleExpand: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
}

export default function DraggableTaskRow({
  task,
  index,
  rowHeight,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSubtask,
}: DraggableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    height: rowHeight,
    paddingLeft: 8 + task.level * 16,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-2 border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
      } ${isDragging ? "shadow-lg bg-white" : ""}`}
    >
      {/* Handle para arrastrar */}
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0 touch-none"
        title="Arrastrar para reordenar"
      >
        <TbGripVertical className="text-xs" />
      </button>

      {task.hasSubtasks ? (
        <button
          onClick={() => onToggleExpand(task.taskId)}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
        >
          {task.isExpanded ? (
            <TbChevronDown className="text-gray-500 text-xs" />
          ) : (
            <TbChevronRight className="text-gray-500 text-xs" />
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
        className={`flex-1 text-xs truncate ${
          task.status === "cancelled"
            ? "text-gray-400 line-through"
            : "text-gray-800"
        }`}
        title={task.title}
      >
        {task.title}
      </span>

      {task.assignments && task.assignments.length > 0 && (
        <div className="flex items-center text-2xs text-gray-400 flex-shrink-0">
          <TbUser className="text-2xs" />
          <span>{task.assignments.length}</span>
        </div>
      )}

      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100">
        <button
          onClick={() => onAddSubtask(task)}
          className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
          title="Agregar subtarea"
        >
          <TbSubtask className="text-xs" />
        </button>
        <button
          onClick={() => onEdit(task)}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Editar"
        >
          <TbEdit className="text-xs" />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Eliminar"
        >
          <TbTrash className="text-xs" />
        </button>
      </div>
    </div>
  );
}
