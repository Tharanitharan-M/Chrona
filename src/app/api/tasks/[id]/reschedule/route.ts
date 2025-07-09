import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerAuthSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { start, end } = await req.json();

  try {
    await prisma.calendarEvent.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        startTime: new Date(start),
        endTime: new Date(end),
      },
    });

    return NextResponse.json({ message: 'Task rescheduled successfully' });
  } catch (error) {
    console.error('Failed to reschedule task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}