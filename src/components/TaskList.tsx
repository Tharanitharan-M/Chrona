"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Calendar, Clock, CheckCircle2, Circle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "./TaskModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  completedAt: string | null;
  deadline: string | null;
}

export function TaskList() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.status}`);
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    
    try {
      // Simple status-only update to avoid date issues
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        // Update local state
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, status: newStatus, completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null }
            : t
        ));
      } else {
        throw new Error("Failed to update task status");
      }
    } catch (err) {
      console.error("Failed to toggle task status:", err);
      setError("Failed to update task status");
    }
  };

  const handleEditTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const task = await res.json();
        setSelectedTask(task);
        setIsModalOpen(true);
      } else {
        throw new Error("Failed to fetch task details");
      }
    } catch (err) {
      console.error("Failed to fetch task:", err);
      setError("Failed to fetch task details");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setIsDeleting(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove task from local state
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task");
    } finally {
      setIsDeleting(null);
    }
  };

  const refreshData = () => {
    fetchTasks();
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MEETING":
        return "👥";
      case "DEADLINE":
        return "⏰";
      case "REMINDER":
        return "🔔";
      case "FOCUS_BLOCK":
        return "🎯";
      default:
        return "📝";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "COMPLETED" 
      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400" 
      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600";
  };

  if (!session) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Tasks</h2>
        <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
          <p>Please sign in to see your tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Tasks</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTasks}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Loading tasks...</span>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`p-4 border rounded-lg transition-all ${getStatusColor(task.status)} ${
                task.status === "COMPLETED" ? "opacity-75" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className="mt-1 transition-colors flex-shrink-0"
                  >
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg flex-shrink-0">{getTypeIcon(task.type)}</span>
                      <h3 className={`font-semibold truncate ${
                        task.status === "COMPLETED" 
                          ? "line-through text-gray-500 dark:text-gray-400" 
                          : "text-gray-900 dark:text-gray-100"
                      }`} title={task.title}>
                        {task.title}
                      </h3>
                    </div>
                    
                    {task.description && (
                      <p className={`text-sm mb-2 line-clamp-2 ${
                        task.status === "COMPLETED" 
                          ? "text-gray-400 dark:text-gray-500 line-through" 
                          : "text-gray-600 dark:text-gray-300"
                      }`} title={task.description}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></span>
                        <span className="truncate">{task.type.replace('_', ' ').toLowerCase()}</span>
                      </span>
                      
                      {task.deadline && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        </span>
                      )}
                      
                      {task.completedAt && (
                        <span className="flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTask(task.id)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        disabled={isDeleting === task.id}
                      >
                        {isDeleting === task.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the task "{task.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium mb-2">No tasks yet</p>
            <p className="text-sm">Create your first task to get started!</p>
          </div>
        </div>
      )}
      
      {/* Edit Task Modal */}
      <TaskModal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        onTaskSaved={refreshData}
        task={selectedTask}
      />
    </div>
  );
}
