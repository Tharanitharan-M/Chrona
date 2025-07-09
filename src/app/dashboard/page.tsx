'use client';
import { TaskModal } from "@/components/TaskModal";
import { Calendar } from "@/components/Calendar";
import { TaskList } from "@/components/TaskList";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserNav } from "@/components/UserNav";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  deadline: string | null;
  startTime: string;
  endTime: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Debug logging
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const refreshData = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setIsModalOpen(false); // Close modal after saving
    setSelectedTask(null);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(new Date(dateStr));
    setIsModalOpen(true);
  };

  const handleEventClick = async (event: { event: { extendedProps: { taskId: string } } }) => {
    const res = await fetch(`/api/tasks/${event.event.extendedProps.taskId}`);
    if (res.ok) {
      const task = await res.json();
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-col md:flex min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Chrona</h1>
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <TaskModal
              open={isModalOpen}
              setOpen={setIsModalOpen}
              onTaskSaved={refreshData}
              initialDate={selectedDate}
              task={selectedTask}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <Calendar key={`calendar-${refreshKey}`} onDateClick={handleDateClick} onEventClick={handleEventClick} />
          </div>
          <div className="col-span-3">
            <TaskList key={`task-list-${refreshKey}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

        
