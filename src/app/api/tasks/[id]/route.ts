import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerAuthSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const task = await prisma.task.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        calendarEvent: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Transform the response to include startTime and endTime from calendar event
    const response = {
      ...task,
      startTime: task.calendarEvent?.startTime.toISOString(),
      endTime: task.calendarEvent?.endTime.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Delete the associated CalendarEvent first due to foreign key constraint
    await prisma.calendarEvent.deleteMany({
      where: {
        taskId: id,
        userId: session.user.id,
      },
    });

    const task = await prisma.task.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Task deleted successfully', task });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { title, description, type, deadline, startTime, endTime, status, completedAt } = await req.json();

  try {
    // Prepare the update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) updateData.status = status;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;

    // Only update calendar event if both startTime and endTime are provided
    if (startTime && endTime) {
      updateData.calendarEvent = {
        update: {
          where: {
            taskId: id,
          },
          data: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
          },
        },
      };
    }

    const updatedTask = await prisma.task.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: updateData,
      include: {
        calendarEvent: true,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}