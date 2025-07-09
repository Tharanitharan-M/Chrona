import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // Delete all CalendarEvent records first, as they depend on Task records
    await prisma.calendarEvent.deleteMany({});
    // Then delete all Task records
    await prisma.task.deleteMany({});

    return NextResponse.json({ message: 'All tasks and calendar events cleared.' }, { status: 200 });
  } catch (error) {
    console.error('Failed to clear data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
