import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, type, deadline, startTime, endTime, status } = await req.json();

    // Basic validation
    if (!title || !type || !status || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        type,
        deadline: deadline ? new Date(deadline) : null,
        status,
        userId: session.user.id,
        calendarEvent: {
          create: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            userId: session.user.id,
          },
        },
      },
      include: {
        calendarEvent: true, // Include the created calendar event in the response
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
