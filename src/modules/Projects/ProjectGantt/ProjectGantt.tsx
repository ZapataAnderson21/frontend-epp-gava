import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useFetch, useApiAction } from "../../../hooks";
import { projectApi, userApi, taskApi } from "../../../data/apiUrl";
import type { Project, User } from "../../../data/types";
import { ErrorMessage } from "../../../common/error";
import { AddButton } from "../../../common/button";
import { LoadingSkeletonTable } from "../../../common/loading";
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
  } = useFetch<Task[]>(`${taskApi}project/${projectId}`, [projectId, refreshKey]);

  // Fetch users for assignments
  const { data: users } = useFetch<User[]>(userApi, []);

  // API action hooks
  const { execute: executeCreate, loading: createLoading } = useApiAction<Task>();
  const { execute: executeUpdate, loading: updateLoading } = useApiAction<Task>();
  const { execute: executeDelete, loading: deleteLoading } =
    useApiAction<{ message: string }>();
  const { execute: executeStatusChange, loading: statusLoading } = useApiAction<Task>();

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
    async (taskData: Partial<Task>, assignedUserIds: number[]) => {
      try {
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
          toast.success("Tarea actualizada");
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
          toast.success("Tarea creada");
        }

        setIsTaskModalOpen(false);
        setSelectedTask(null);
        setParentTask(null);
        refreshTasks();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al guardar la tarea";
        toast.error(errorMessage);
      }
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
  const handleStatusChange = useCallback(
    async (taskId: number, status: TaskStatus) => {
      try {
        await executeStatusChange(`${taskApi}${taskId}/status`, "PATCH", { status });
        toast.success("Estado actualizado");
        refreshTasks();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al cambiar el estado";
        toast.error(errorMessage);
      }
    },
    [executeStatusChange, refreshTasks]
  );

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <div className="flex flex-col w-full max-w-full gap-6">
      <div className="flex justify-end">
        <AddButton onClick={handleAddTask} />
      </div>

      {/* Estadísticas */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm w-full">
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
