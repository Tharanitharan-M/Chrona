"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { DatePicker } from "./DatePicker";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
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
import { Loader2 } from "lucide-react";

// Define your form schema using Zod
const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  type: z.enum(["TASK", "MEETING", "REMINDER", "DEADLINE", "FOCUS_BLOCK"]),
  date: z.date({ required_error: "A date is required." }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  aiAssist: z.boolean().default(false).optional(),
  status: z.enum(["PENDING", "COMPLETED"]).default("PENDING"),
});

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  deadline: string | null;
  startTime: string;
  endTime: string;
  completedAt: string | null;
}

export function TaskModal({ onTaskSaved, open, setOpen, initialDate, initialTime, task }: {
  onTaskSaved: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  initialDate?: Date;
  initialTime?: string;
  task?: Task | null;
}) {
  const { data: session } = useSession();
  // AI auto-schedule state
  const [aiSubtasks, setAiSubtasks] = useState<Array<{title: string, estimatedDuration: number}>>([]);
  const [aiEstimatedDuration, setAiEstimatedDuration] = useState<number | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>("");
  const [aiPriority, setAiPriority] = useState<string>("");
  const [aiUrgency, setAiUrgency] = useState<string>("");
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [error, setError] = useState<string>("");


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "TASK",
      startTime: "",
      endTime: "",
      aiAssist: false,
      date: initialDate, // Set initial date from prop
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        type: task.type as "TASK" | "MEETING" | "REMINDER" | "DEADLINE" | "FOCUS_BLOCK",
        date: new Date(task.startTime),
        startTime: new Date(task.startTime).toTimeString().slice(0, 5),
        endTime: new Date(task.endTime).toTimeString().slice(0, 5),
        status: task.status as "PENDING" | "COMPLETED",
      });
    } else if (initialDate) {
      const defaultEndTime = initialTime ? 
        new Date(`2000-01-01T${initialTime}`).getTime() + (60 * 60 * 1000) : // Add 1 hour to start time
        undefined;
      const endTimeStr = defaultEndTime ? 
        new Date(defaultEndTime).toTimeString().slice(0, 5) : 
        "";
        
      form.reset({
        ...form.getValues(),
        date: initialDate,
        startTime: initialTime || "",
        endTime: endTimeStr,
      });
    }
    // Reset states when modal opens/closes
    if (!open) {
      setError("");
      setAiSubtasks([]);
      setAiEstimatedDuration(null);
      setAiReasoning("");
      // Clear form when modal closes
      if (!task) {
        const defaultEndTime = initialTime ? 
          new Date(`2000-01-01T${initialTime}`).getTime() + (60 * 60 * 1000) : 
          undefined;
        const endTimeStr = defaultEndTime ? 
          new Date(defaultEndTime).toTimeString().slice(0, 5) : 
          "";
          
        form.reset({
          title: "",
          description: "",
          type: "TASK",
          startTime: initialTime || "",
          endTime: endTimeStr,
          aiAssist: false,
          date: initialDate || undefined,
          status: "PENDING",
        });
      }
    }
  }, [task, initialDate, initialTime, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError("");
    
    try {
      const createDateTime = (time: string | undefined, isStartTime: boolean): Date | null => {
        if (!values.date) return null; // Must have a date selected

        const newDate = new Date(values.date);
        if (time) {
          const [hours, minutes] = time.split(':').map(Number);
          newDate.setHours(hours, minutes, 0, 0);
        } else if (isStartTime) {
          newDate.setHours(0, 0, 0, 0); // Default start time to beginning of day
        } else {
          newDate.setHours(23, 59, 59, 999); // Default end time to end of day
        }
        return newDate;
      };

      const startDateTime = createDateTime(values.startTime, true);
      const endDateTime = createDateTime(values.endTime, false);

      const deadline = values.type === 'DEADLINE' ? endDateTime : (values.type === 'TASK' ? startDateTime : null);

      // Ensure startTime and endTime are always valid Date objects for the backend
      if (!startDateTime || !endDateTime) {
        throw new Error("Start time or End time could not be determined.");
      }

      if (!session?.user?.id) {
        throw new Error("User ID not available. Cannot save task.");
      }

      const method = task ? "PUT" : "POST";
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          type: values.type,
          deadline: deadline?.toISOString() || null,
          startTime: startDateTime.toISOString(), // Always send a valid ISO string
          endTime: endDateTime.toISOString(),     // Always send a valid ISO string
          status: values.status,
          completedAt: values.status === "COMPLETED" ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        console.log("Task saved successfully");
        // Reset form to default values
        form.reset({
          title: "",
          description: "",
          type: "TASK",
          startTime: "",
          endTime: "",
          aiAssist: false,
          date: undefined,
          status: "PENDING",
        }); 
        setOpen(false); // Close the dialog
        onTaskSaved(); // Call the refresh function
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to save task: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to save task:", err);
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiAssist = async () => {
    if (!form.getValues("aiAssist")) return;
    
    const title = form.getValues("title");
    const description = form.getValues("description") || "";
    
    if (!title) {
      setError("Please enter a task title first");
      return;
    }

    // Combine title and description for better AI context
    const fullPrompt = description ? `${title}\n\nDescription: ${description}` : title;

    setIsLoadingAI(true);
    setError("");
    
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      
      if (!res.ok) {
        throw new Error(`AI request failed: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("AI Assist Response:", data);
      
      // Handle both old and new AI response formats
      const subtasks = Array.isArray(data.subtasks) 
        ? data.subtasks.map((task: any) => typeof task === 'string' ? task : task.title)
        : [];
      
      setAiSubtasks(subtasks);
      setAiEstimatedDuration(data.totalEstimatedDuration || data.estimatedDuration || null);
      setAiReasoning(data.reasoning || "");
      setAiPriority(data.priority || "");
      setAiUrgency(data.urgency || "");
      
      if (data.suggestedStartTime && data.suggestedEndTime) {
        // Auto-fill the form with AI suggestions
        const startTime = new Date(data.suggestedStartTime);
        const endTime = new Date(data.suggestedEndTime);
        
        form.setValue("date", startTime);
        form.setValue("startTime", startTime.toTimeString().slice(0, 5));
        form.setValue("endTime", endTime.toTimeString().slice(0, 5));
        
        // Get current form values including the description
        const currentDescription = form.getValues("description") || "";
        const aiEnhancedDescription = currentDescription + 
          (currentDescription ? "\n\n" : "") + 
          `AI Analysis:\n${data.reasoning}\n\nSubtasks:\n${data.subtasks.map((task: any, i: number) => `${i + 1}. ${task.title || task} (${task.estimatedDuration || '30'}min)`).join('\n')}`;
        
        form.setValue("description", aiEnhancedDescription);
        
        // Automatically save the task with AI suggestions
        await autoSaveAiTask(data);
      }
    } catch (err) {
      console.error("AI assist failed:", err);
      setError(err instanceof Error ? err.message : "AI assistance failed");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const autoSaveAiTask = async (aiData: any) => {
    if (!session?.user?.id) {
      throw new Error("User ID not available. Cannot save task.");
    }

    const values = form.getValues();
    const startDateTime = new Date(aiData.suggestedStartTime);
    const endDateTime = new Date(aiData.suggestedEndTime);
    
    const deadline = values.type === 'DEADLINE' ? endDateTime : (values.type === 'TASK' ? startDateTime : null);

    try {
      // Create the main task first
      const mainTaskRes = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          type: values.type,
          deadline: deadline?.toISOString() || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          status: "PENDING",
          completedAt: null,
        }),
      });

      if (!mainTaskRes.ok) {
        const errorData = await mainTaskRes.json();
        throw new Error(errorData.error || `Failed to save main task: ${mainTaskRes.status}`);
      }

      // If there are subtasks, create individual calendar events for each
      if (aiData.subtasks && aiData.subtasks.length > 0) {
        const totalDuration = aiData.estimatedDuration || 60; // Default to 60 minutes if not provided
        const bufferTime = 20; // 20 minutes buffer between subtasks
        const workingTime = totalDuration - (bufferTime * (aiData.subtasks.length - 1));
        const subtaskDuration = Math.floor(workingTime / aiData.subtasks.length);
        
        // Create calendar events for each subtask with proper spacing
        for (let i = 0; i < aiData.subtasks.length; i++) {
          const subtask = aiData.subtasks[i];
          const subtaskTitle = subtask.title || subtask;
          const subtaskDurationMinutes = subtask.estimatedDuration || subtaskDuration;
          
          const subtaskStart = new Date(startDateTime.getTime() + (i * (subtaskDurationMinutes + bufferTime) * 60000));
          const subtaskEnd = new Date(subtaskStart.getTime() + (subtaskDurationMinutes * 60000));
          
          const subtaskRes = await fetch("/api/tasks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: `${values.title} - ${subtaskTitle}`,
              description: `Subtask ${i + 1} of ${aiData.subtasks.length}: ${subtaskTitle}\n\nParent Task: ${values.title}\nEstimated Duration: ${subtaskDurationMinutes} minutes`,
              type: "FOCUS_BLOCK", // Use FOCUS_BLOCK for subtasks
              deadline: null,
              startTime: subtaskStart.toISOString(),
              endTime: subtaskEnd.toISOString(),
              status: "PENDING",
              completedAt: null,
            }),
          });

          if (!subtaskRes.ok) {
            console.warn(`Failed to create subtask ${i + 1}: ${subtaskTitle}`);
          }
        }
      }

      console.log("AI task and subtasks automatically saved to calendar");
      setOpen(false); // Close the dialog
      onTaskSaved(); // Refresh the calendar and task list
      
      // Show success message
      const subtaskMessage = aiData.subtasks?.length > 0 
        ? ` Created ${aiData.subtasks.length} subtask blocks.` 
        : "";
      setAiReasoning(`✅ Task automatically scheduled!${subtaskMessage} ${aiData.reasoning}`);
      
    } catch (err) {
      console.error("Failed to auto-save AI task:", err);
      setError(`AI suggested time but failed to book: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleAiReschedule = async () => {
    if (!task) return;
    
    setIsRescheduling(true);
    setError("");
    
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          taskToReschedule: {
            title: task.title,
            description: task.description,
            startTime: task.startTime,
            endTime: task.endTime,
            type: task.type
          }
        }),
      });
      
      if (!res.ok) {
        throw new Error(`AI reschedule failed: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("AI Reschedule Response:", data);
      
      if (data.suggestedStartTime && data.suggestedEndTime) {
        const newStartTime = new Date(data.suggestedStartTime);
        const newEndTime = new Date(data.suggestedEndTime);
        
        form.setValue("startTime", newStartTime.toTimeString().slice(0, 5));
        form.setValue("endTime", newEndTime.toTimeString().slice(0, 5));
        form.setValue("date", newStartTime);
        
        setAiReasoning(data.reasoning || "AI suggested rescheduling");
      }
    } catch (err) {
      console.error("AI reschedule failed:", err);
      setError(err instanceof Error ? err.message : "AI rescheduling failed");
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;

    setIsDeleting(true);
    setError("");
    
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        console.log("Task deleted successfully");
        form.reset();
        setOpen(false);
        onTaskSaved();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to delete task: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Edit the details of your task." : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Task description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TASK">Task</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="REMINDER">Reminder</SelectItem>
                      <SelectItem value="DEADLINE">Deadline</SelectItem>
                      <SelectItem value="FOCUS_BLOCK">Focus Block</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="aiAssist"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">AI Auto-Schedule</FormLabel>
                    <FormDescription>
                      AI will analyze your task, break it down, and automatically book the optimal time slot in your calendar.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          handleAiAssist();
                        }
                      }}
                      disabled={isLoadingAI}
                    />
                  </FormControl>
                  {isLoadingAI && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                </FormItem>
              )}
            />
            {task && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Mark as Completed</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === "COMPLETED"}
                        onCheckedChange={(checked) => field.onChange(checked ? "COMPLETED" : "PENDING")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            {task && task.status === "PENDING" && (
              <Button 
                type="button" 
                onClick={handleAiReschedule} 
                className="w-full" 
                variant="outline"
                disabled={isRescheduling}
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI Rescheduling...
                  </>
                ) : (
                  "AI Reschedule Task"
                )}
              </Button>
            )}
            
            {/* AI Auto-Schedule Results */}
            {(aiSubtasks.length > 0 || aiReasoning) && (
              <div className="mt-4 p-4 border rounded-md bg-green-50">
                <h3 className="text-lg font-semibold text-green-800 mb-2">✅ AI Auto-Scheduled</h3>
                {aiEstimatedDuration && (
                  <p className="text-sm text-green-700 mb-2">
                    <strong>Estimated Duration:</strong> {aiEstimatedDuration} minutes
                  </p>
                )}
                {aiReasoning && (
                  <p className="text-sm text-green-700 mb-2">
                    <strong>AI Analysis:</strong> {aiReasoning}
                  </p>
                )}
                {aiSubtasks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-1">Task Breakdown:</p>
                    <ul className="list-disc list-inside text-sm text-green-700">
                      {aiSubtasks.map((subtask, index) => (
                        <li key={index}>{typeof subtask === 'string' ? subtask : subtask.title || subtask}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Show manual save options only when not using AI auto-schedule */}
            {!form.getValues("aiAssist") && (
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || isLoadingAI || isRescheduling || isDeleting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    task ? "Save Task" : "Add Task"
                  )}
                </Button>
                {task && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isDeleting || isSubmitting}>
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Task"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your task
                          and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
