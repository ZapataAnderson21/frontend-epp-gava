import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useFetch, useApiAction } from "../../../../../../hooks";
import { projectApi, userApi, taskApi } from "../../../../../../data/apiUrl";
import type { Project, User } from "../../../../../../data/types";
import { ErrorMessage } from "../../../../../../common/error";
import { AddButton } from "../../../../../../common/button";
import { LoadingSkeletonTable } from "../../../../../../common/loading";
import type { Task, CreateTaskDto, UpdateTaskDto, TaskStatus } from "./types";
import GanttChart from "./GanttChart";
import TaskModal from "./TaskModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import TaskStats from "./TaskStats";

export default function ProjectGantt() {
  const { id: projectId } = useParams<{ id: string }>();

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch project info
  const {
    data: project,
    loading: projectLoading,
    error: projectError,
  } = useFetch<Project>(`${projectApi}${projectId}`, [projectId]);

  // Fetch tasks from API
  const {
    data: tasks,
    loading: tasksLoading,
    error: tasksError,
    setData: setTasks,
  } = useFetch<Task[]>(`${taskApi}project/${projectId}`, [projectId, refreshKey]);

  // Fetch users for assignments
  const { data: users } = useFetch<User[]>(userApi, []);

  // API action hooks
  const { execute: executeCreate, loading: createLoading } = useApiAction<Task>();
  const { execute: executeUpdate, loading: updateLoading } = useApiAction<Task>();
  const { execute: executeDelete, loading: deleteLoading } =
    useApiAction<{ message: string }>();
  const { execute: executeStatusChange, loading: statusLoading } = useApiAction<Task>();
  const { execute: executeReorder } = useApiAction<Task>();

  const loading = projectLoading || tasksLoading;
  const error = projectError || tasksError;
  const apiLoading = createLoading || updateLoading || deleteLoading || statusLoading;

  // Refresh tasks after any mutation
  const refreshTasks = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Handlers
  const handleAddTask = useCallback(() => {
    setSelectedTask(null);
    setParentTask(null);
    setIsTaskModalOpen(true);
  }, []);

  const handleAddSubtask = useCallback((parent: Task) => {
    setSelectedTask(null);
    setParentTask(parent);
    setIsTaskModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setParentTask(null);
    setIsTaskModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  }, []);

  const handleSaveTask = useCallback(
    async (taskData: Partial<Task>, assignedUserIds: number[]): Promise<boolean> => {
      if (taskData.taskId) {
        // Actualizar tarea existente - PATCH /task/:taskId
        const updateDto: UpdateTaskDto = {
          title: taskData.title,
          description: taskData.description || undefined,
          status: taskData.status,
          priority: taskData.priority,
          startDate: taskData.startDate || undefined,
          dueDate: taskData.dueDate || undefined,
          assignedUserIds,
        };

        await executeUpdate(`${taskApi}${taskData.taskId}`, "PUT", updateDto);
      } else {
        // Crear nueva tarea - POST /task
        const createDto: CreateTaskDto = {
          title: taskData.title!,
          description: taskData.description || undefined,
          status: taskData.status,
          priority: taskData.priority,
          projectId: Number(projectId),
          parentTaskId: parentTask?.taskId,
          startDate: taskData.startDate || undefined,
          dueDate: taskData.dueDate || undefined,
          assignedUserIds,
        };

        await executeCreate(taskApi, "POST", createDto);
      }

      setIsTaskModalOpen(false);
      setSelectedTask(null);
      setParentTask(null);
      refreshTasks();
      return true;
    },
    [projectId, parentTask, executeCreate, executeUpdate, refreshTasks]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedTask) return;

    try {
      // DELETE /task/:taskId
      await executeDelete(`${taskApi}${selectedTask.taskId}`, "DELETE");
      toast.success("Tarea eliminada");

      setIsDeleteModalOpen(false);
      setSelectedTask(null);
      refreshTasks();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar la tarea";
      toast.error(errorMessage);
    }
  }, [selectedTask, executeDelete, refreshTasks]);

  // Handler para cambio rápido de estado - PATCH /task/:taskId/status
  // Usa actualización optimista para mejor UX
  const handleStatusChange = useCallback(
    async (taskId: number, status: TaskStatus) => {
      // Guardar estado anterior para revertir si falla
      const previousTasks = tasks ? [...tasks] : [];
      
      // Función para actualizar el estado de una tarea recursivamente
      const updateTaskStatus = (taskList: Task[]): Task[] => {
        return taskList.map((task) => {
          if (task.taskId === taskId) {
            return { ...task, status };
          }
          if (task.subtasks && task.subtasks.length > 0) {
            return { ...task, subtasks: updateTaskStatus(task.subtasks) };
          }
          return task;
        });
      };

      // Actualización optimista inmediata
      setTasks((prev) => (prev ? updateTaskStatus(prev) : prev));

      try {
        await executeStatusChange(`${taskApi}${taskId}/status`, "PATCH", { status });
        toast.success("Estado actualizado");
      } catch (err: unknown) {
        // Revertir si falla
        setTasks(previousTasks);
        const errorMessage =
          err instanceof Error ? err.message : "Error al cambiar el estado";
        toast.error(errorMessage);
      }
    },
    [tasks, setTasks, executeStatusChange]
  );

  // Handler para reordenar tareas con actualización optimista
  const handleReorder = useCallback(
    async (taskId: number, newIndex: number) => {
      if (!tasks) return;

      // Filtrar solo tareas raíz y ordenar por displayOrder actual
      const rootTasks = tasks
        .filter((t) => !t.parentTaskId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      
      // Encontrar la tarea y su índice actual entre las tareas raíz ordenadas
      const currentIndex = rootTasks.findIndex((t) => t.taskId === taskId);
      if (currentIndex === -1 || currentIndex === newIndex) return;

      // Guardar estado anterior para revertir si falla
      const previousTasks = [...tasks];

      // Crear nueva lista con el orden actualizado
      const reorderedRootTasks = [...rootTasks];
      const [movedTask] = reorderedRootTasks.splice(currentIndex, 1);
      reorderedRootTasks.splice(newIndex, 0, movedTask);

      // Calcular los nuevos displayOrder para todas las tareas reordenadas
      const orderUpdates: { taskId: number; displayOrder: number }[] = [];
      reorderedRootTasks.forEach((task, idx) => {
        // Siempre actualizar el displayOrder al nuevo índice
        if (task.displayOrder !== idx) {
          orderUpdates.push({ taskId: task.taskId, displayOrder: idx });
        }
      });

      // Si no hay cambios, no hacer nada
      if (orderUpdates.length === 0) return;

      // Actualizar displayOrder localmente en todas las tareas
      const updatedTasks = tasks.map((task) => {
        const update = orderUpdates.find((u) => u.taskId === task.taskId);
        if (update) {
          return { ...task, displayOrder: update.displayOrder };
        }
        return task;
      });

      // Actualización optimista inmediata
      setTasks(updatedTasks);

      try {
        // Enviar todos los cambios de orden al backend
        await executeReorder(`${taskApi}reorder`, "PATCH", {
          updates: orderUpdates,
        });
      } catch (err: unknown) {
        // Revertir si falla
        setTasks(previousTasks);
        const errorMessage =
          err instanceof Error ? err.message : "Error al reordenar las tareas";
        toast.error(errorMessage);
      }
    },
    [tasks, setTasks, executeReorder]
  );

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <div className="flex flex-col w-full max-w-full gap-4">
      <div className="flex justify-end">
        <AddButton onClick={handleAddTask} />
      </div>

      {/* Estadísticas */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm w-full">
        <TaskStats tasks={tasks || []} />
      </div>

      {/* Diagrama de Gantt */}
      <div className="flex-1 min-h-[400px] max-w-full">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <GanttChart
            tasks={tasks || []}
            projectStartDate={project?.startDate}
            projectEndDate={project?.endDate}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onAddSubtask={handleAddSubtask}
            onStatusChange={handleStatusChange}
            onReorder={handleReorder}
          />
        )}
      </div>

      {/* Modal de tarea */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
          setParentTask(null);
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        parentTask={parentTask}
        users={users || []}
        projectId={Number(projectId)}
        loading={apiLoading}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTask(null);
        }}
        onConfirm={handleConfirmDelete}
        task={selectedTask}
        loading={apiLoading}
      />
    </div>
  );
}
