"use client";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    taskId: string;
    status: string;
    type: string;
  }
}

interface CalendarProps {
  onDateClick: (dateStr: string) => void;
  onEventClick: (event: { event: { extendedProps: { taskId: string } } }) => void;
}

export function Calendar({ onDateClick, onEventClick }: CalendarProps) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchEvents = useCallback(async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch('/api/calendar');
      if (!res.ok) {
        throw new Error(`Failed to fetch calendar events: ${res.status}`);
      }
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedEvents = data.map((event: any) => ({
        id: event.id,
        title: event.task.title,
        start: event.startTime,
        end: event.endTime,
        extendedProps: {
          taskId: event.task.id,
          status: event.task.status,
          type: event.task.type,
        }
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchEvents();
  }, [session, fetchEvents]);

  const handleEventDrop = async (info: { event: { id: string; startStr: string; endStr: string; extendedProps: { taskId: string } }; revert: () => void }) => {
    const { event } = info;
    
    try {
      const res = await fetch(`/api/tasks/${event.extendedProps.taskId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start: event.startStr, end: event.endStr }),
      });

      if (!res.ok) {
        throw new Error('Failed to reschedule task');
      }
      
      // Update local state
      setEvents(prev => prev.map(e => 
        e.id === event.id 
          ? { ...e, start: event.startStr, end: event.endStr }
          : e
      ));
    } catch (err) {
      console.error('Failed to reschedule task:', err);
      setError('Failed to reschedule task');
      // Revert the event to its original position
      info.revert();
    }
  };

  const getEventColor = (type: string, status: string) => {
    if (status === 'COMPLETED') {
      return {
        backgroundColor: '#10b981', // green for completed
        borderColor: '#059669',
        textColor: '#ffffff'
      };
    }
    
    switch (type) {
      case 'MEETING':
        return {
          backgroundColor: '#3b82f6', // blue like Outlook meetings
          borderColor: '#2563eb',
          textColor: '#ffffff'
        };
      case 'DEADLINE':
        return {
          backgroundColor: '#ef4444', // red for urgent deadlines
          borderColor: '#dc2626',
          textColor: '#ffffff'
        };
      case 'REMINDER':
        return {
          backgroundColor: '#f59e0b', // amber/orange for reminders
          borderColor: '#d97706',
          textColor: '#ffffff'
        };
      case 'FOCUS_BLOCK':
        return {
          backgroundColor: '#8b5cf6', // purple for focus time
          borderColor: '#7c3aed',
          textColor: '#ffffff'
        };
      case 'TASK':
      default:
        return {
          backgroundColor: '#6b7280', // gray for general tasks
          borderColor: '#4b5563',
          textColor: '#ffffff'
        };
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'MEETING':
        return '👥';
      case 'DEADLINE':
        return '🚨';
      case 'REMINDER':
        return '🔔';
      case 'FOCUS_BLOCK':
        return '🎯';
      case 'TASK':
      default:
        return '📝';
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">Please sign in to view your calendar.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Loading calendar...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-400 font-medium">Calendar Error</p>
        <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
        <button 
          onClick={fetchEvents}
          className="mt-2 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events.map(event => ({
          ...event,
          backgroundColor: getEventColor(event.extendedProps.type, event.extendedProps.status).backgroundColor,
          borderColor: getEventColor(event.extendedProps.type, event.extendedProps.status).borderColor,
          textColor: getEventColor(event.extendedProps.type, event.extendedProps.status).textColor,
        }))}
        selectable={true}
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
        eventClick={onEventClick}
                 eventContent={(arg) => {
           const isCompleted = arg.event.extendedProps.status === "COMPLETED";
           const taskType = arg.event.extendedProps.type;
           const taskIcon = getTaskTypeIcon(taskType);
           
           return (
             <div className={`fc-event-main-frame ${isCompleted ? "opacity-75" : ""}`}>
               <div className="fc-event-title-container">
                 <div className="fc-event-title fc-sticky flex items-center space-x-1">
                   <span className="text-xs">{taskIcon}</span>
                   {isCompleted && <span className="text-xs">✓</span>}
                   <span className={isCompleted ? "line-through" : ""}>
                     {arg.event.title}
                   </span>
                 </div>
               </div>
             </div>
           );
         }}
        dateClick={(info) => {
          onDateClick(info.dateStr);
        }}
        height="auto"
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventDidMount={(info) => {
          // Add tooltip with task details
          info.el.title = `${info.event.title}\nType: ${info.event.extendedProps.type}\nStatus: ${info.event.extendedProps.status}`;
        }}
      />
    </div>
  );
}
