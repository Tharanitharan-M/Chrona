import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      task: true,
    },
  });
  return NextResponse.json(calendarEvents);
}
