import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const preferences = await prisma.aIPreferences.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(preferences || { workingHours: '', preferredTimes: '', selectedModel: 'gpt-4' });
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workingHours, preferredTimes, selectedModel } = await req.json();

  try {
    await prisma.aIPreferences.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        workingHours,
        preferredTimes,
        selectedModel,
      },
      create: {
        userId: session.user.id,
        workingHours,
        preferredTimes,
        selectedModel: selectedModel || 'gpt-4',
      },
    });

    return NextResponse.json({ message: 'Preferences saved successfully' });
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}