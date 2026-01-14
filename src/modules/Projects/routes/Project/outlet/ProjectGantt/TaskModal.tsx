import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbX, TbPlus } from "react-icons/tb";
import { InputForm, SelectForm } from "../../../../../../common/form";
import type { Task, TaskStatus, TaskPriority } from "./types";
import { STATUS_LABELS, PRIORITY_LABELS } from "./types";
import type { User } from "../../../../../../data/types";
import toast, { Toaster } from "react-hot-toast";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>, assignedUserIds: number[]) => Promise<boolean>;
  task?: Task | null;
  parentTask?: Task | null;
  users: User[];
  projectId: number;
  loading?: boolean;
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: value as TaskStatus,
  label,
}));

const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value: value as TaskPriority,
  label,
}));

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  parentTask,
  users,
  projectId,
  loading,
}: TaskModalProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending" as TaskStatus,
    priority: "medium" as TaskPriority,
    startDate: "",
    dueDate: "",
  });
  const [assignedUsers, setAssignedUsers] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setForm({
          title: task.title || "",
          description: task.description || "",
          status: task.status || "pending",
          priority: task.priority || "medium",
          startDate: task.startDate?.split("T")[0] || "",
          dueDate: task.dueDate?.split("T")[0] || "",
        });
        setAssignedUsers(task.assignments?.map((a) => a.userId) || []);
      } else {
        setForm({
          title: "",
          description: "",
          status: "pending",
          priority: "medium",
          startDate: "",
          dueDate: "",
        });
        setAssignedUsers([]);
      }
      setErrors({});
    }
  }, [isOpen, task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddUser = (userId: number) => {
    if (!assignedUsers.includes(userId)) {
      setAssignedUsers((prev) => [...prev, userId]);
    }
  };

  const handleRemoveUser = (userId: number) => {
    setAssignedUsers((prev) => prev.filter((id) => id !== userId));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) {
      newErrors.title = "El título es requerido";
    }
    if (form.startDate && form.dueDate && new Date(form.startDate) > new Date(form.dueDate)) {
      newErrors.dueDate = "La fecha de fin debe ser posterior a la de inicio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const taskData: Partial<Task> = {
      ...(task?.taskId && { taskId: task.taskId }),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      projectId,
      parentTaskId: parentTask?.taskId,
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
    };

    await toast.promise(
      onSave(taskData, assignedUsers),
      {
        loading: task ? "Actualizando tarea..." : "Creando tarea...",
        success: () => {
          return task ? "Tarea actualizada exitosamente" : "Tarea creada exitosamente";
        },
        error: (err) => err?.message || "Error al guardar la tarea",
      }
    );
  };

  const availableUsers = users.filter((u) => !assignedUsers.includes(u.userId));

  if (!isOpen) return null;

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {task ? "Editar Tarea" : parentTask ? "Nueva Subtarea" : "Nueva Tarea"}
              </h2>
              {parentTask && (
                <p className="text-sm text-gray-500">Subtarea de: {parentTask.title}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <TbX className="text-xl text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            <InputForm
              label="Título"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
            />

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Descripción (opcional)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="border border-gray-400 p-2 rounded-sm w-full focus:outline-primary resize-none"
                placeholder="Describe la tarea..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectForm
                label="Estado"
                name="status"
                value={form.status}
                onChange={handleSelectChange("status")}
                options={STATUS_OPTIONS}
              />
              <SelectForm
                label="Prioridad"
                name="priority"
                value={form.priority}
                onChange={handleSelectChange("priority")}
                options={PRIORITY_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputForm
                label="Fecha de inicio"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                optional
              />
              <InputForm
                label="Fecha de fin"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                error={errors.dueDate}
                optional
              />
            </div>

            {/* Asignaciones */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Encargados</label>
              
              {/* Usuarios asignados */}
              {assignedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {assignedUsers.map((userId) => {
                    const user = users.find((u) => u.userId === userId);
                    if (!user) return null;
                    return (
                      <div
                        key={userId}
                        className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                      >
                        <span>{user.name} {user.lastName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(userId)}
                          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <TbX className="text-sm" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selector de usuarios */}
              {availableUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 border border-gray-400 p-2 rounded-sm focus:outline-primary"
                    defaultValue=""
                    onChange={(e) => {
                      const userId = parseInt(e.target.value);
                      if (userId) {
                        handleAddUser(userId);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">Seleccionar encargado...</option>
                    {availableUsers.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name} {user.lastName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const select = document.querySelector("select") as HTMLSelectElement;
                      const userId = parseInt(select?.value);
                      if (userId) {
                        handleAddUser(userId);
                        select.value = "";
                      }
                    }}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <TbPlus />
                  </button>
                </div>
              )}

              {users.length === 0 && (
                <p className="text-sm text-gray-500 italic">No hay usuarios disponibles</p>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 font-semibold"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                task ? "Guardar cambios" : "Crear tarea"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    <Toaster position="top-center" />
    </>
  );
}
