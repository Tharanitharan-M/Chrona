import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';
import { getServerAuthSession } from '@/lib/auth';

// Get your API key from https://aistudio.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Helper function to format current date and time for context
function getCurrentTimeContext() {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    currentDateTime: now.toISOString(),
    currentDay: now.toLocaleDateString('en-US', { weekday: 'long' }),
    currentTime: now.toLocaleTimeString('en-US', { hour12: false }),
    timeZone
  };
}

// Helper function to parse working hours (currently unused but kept for future enhancement)
// function parseWorkingHours(workingHours: string) {
//   if (!workingHours) return null;
//   
//   // Handle formats like "9am-5pm", "09:00-17:00", etc.
//   const match = workingHours.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?\s*-\s*(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
//   if (!match) return null;
//   
//   return {
//     start: match[0].split('-')[0].trim(),
//     end: match[0].split('-')[1].trim()
//   };
// }

export async function POST(req: Request) {
  const { prompt, taskToReschedule } = await req.json();

  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userPreferences = await prisma.aIPreferences.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    // Get calendar events for the next 7 days to provide better context
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const userCalendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
      },
      select: {
        startTime: true,
        endTime: true,
        task: {
          select: {
            title: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const timeContext = getCurrentTimeContext();
    // const workingHours = parseWorkingHours(userPreferences?.workingHours || '');

    const calendarEventsString = userCalendarEvents.length > 0 
      ? userCalendarEvents.map(event => 
          `- ${event.task.title} (${event.task.type}) from ${event.startTime.toISOString()} to ${event.endTime.toISOString()} [${event.task.status}]`
        ).join('\n')
      : 'No upcoming events scheduled';

    let aiPrompt: string;

    if (taskToReschedule) {
      aiPrompt = `You are an AI scheduling assistant that helps reschedule incomplete tasks intelligently.

CONTEXT:
- Current date/time: ${timeContext.currentDateTime} (${timeContext.timeZone})
- Today is ${timeContext.currentDay}
- User's working hours: ${userPreferences?.workingHours || 'not specified (you may ignore if unspecified)'}
- User's preferred times: ${userPreferences?.preferredTimes || 'not specified (you may ignore if unspecified)'}

TASK TO RESCHEDULE:
- Title: "${taskToReschedule.title}"
- Description: "${taskToReschedule.description || 'no description'}"
- Originally scheduled: ${taskToReschedule.startTime} to ${taskToReschedule.endTime}
- Type: ${taskToReschedule.type || 'TASK'}
- Priority: ${taskToReschedule.priority || 'normal'}
- Urgency: ${taskToReschedule.urgency || 'medium'}

EXISTING SCHEDULE (next 7 days):
${calendarEventsString}

INSTRUCTIONS:
1. Find the best available time slot that doesn't conflict with existing events
2. Respect working hours and user preferences. Avoid scheduling outside of 6am–10pm unless explicitly allowed
3. Consider the task type, priority, and urgency level
4. Suggest a time that's realistic and achievable
5. If possible, schedule within the next 2-3 days unless it's a low-priority task
6. Ensure at least 15-30 minutes buffer before and after other scheduled events

OUTPUT FORMAT:
- Return ONLY a valid JSON object. Do not include any explanations, markdown syntax, or comments outside of the JSON
- Your output must start with { and end with }. No code fences or markdown formatting
- Do not wrap the response in any sentences or natural language

{
  "suggestedStartTime": "ISO datetime string",
  "suggestedEndTime": "ISO datetime string",
  "reasoning": "Brief explanation of why this time was chosen"
}`;
    } else {
      aiPrompt = `You are an AI task management assistant that helps analyze, break down, and intelligently schedule complex tasks.

CONTEXT:
- Current date/time: ${timeContext.currentDateTime} (${timeContext.timeZone})
- Today is ${timeContext.currentDay}
- User's working hours: ${userPreferences?.workingHours || 'not specified (you may ignore if unspecified)'}
- User's preferred times: ${userPreferences?.preferredTimes || 'not specified (you may ignore if unspecified)'}

TASK TO ANALYZE: "${prompt}"

EXISTING SCHEDULE (next 7 days):
${calendarEventsString}

INSTRUCTIONS:
1. CAREFULLY READ AND UNDERSTAND the task description
2. Analyze the task's complexity, requirements, scope, and estimated priority/urgency
3. Break down ONLY complex tasks into 3-6 logical, sequential subtasks
4. Each subtask should be:
   - A clear, actionable step with specific deliverable
   - Independent enough to be completed separately  
   - Properly spaced with buffer time between steps
   - Not combined or rushed together
5. Estimate realistic duration for EACH subtask (15-120 minutes per subtask)
6. Total duration should account for breaks and context switching between subtasks
7. Find the best available time slot that doesn't conflict with existing events
8. Respect working hours and user preferences. Avoid scheduling outside of 6am–10pm unless explicitly allowed
9. Don't schedule subtasks back-to-back without at least 15–30 minutes break in between
10. Schedule within the next 3-5 days unless urgent
11. For simple tasks that don't need breakdown, return fewer subtasks or just the main task

OUTPUT FORMAT:
- Return ONLY a valid JSON object. Do not include any explanations, markdown syntax, or comments outside of the JSON
- Your output must start with { and end with }. No code fences or markdown formatting
- Do not wrap the response in any sentences or natural language

{
  "subtasks": [
    { "title": "Clear, actionable subtask 1", "estimatedDuration": 30 },
    { "title": "Well-spaced subtask 2", "estimatedDuration": 45 },
    { "title": "Final subtask 3", "estimatedDuration": 30 }
  ],
  "totalEstimatedDuration": 135,
  "suggestedStartTime": "ISO datetime string", 
  "suggestedEndTime": "ISO datetime string",
  "reasoning": "Detailed explanation of how you understood the task, why you broke it down this way, and your scheduling logic with emphasis on proper spacing and timing",
  "priority": "high|normal|low",
  "urgency": "high|medium|low"
}`;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response text to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const jsonResponse = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (taskToReschedule) {
      if (!jsonResponse.suggestedStartTime || !jsonResponse.suggestedEndTime) {
        throw new Error('AI response missing required scheduling fields');
      }
    } else {
      if (!jsonResponse.subtasks || !jsonResponse.totalEstimatedDuration || 
          !jsonResponse.suggestedStartTime || !jsonResponse.suggestedEndTime) {
        throw new Error('AI response missing required fields');
      }
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Return a fallback response if AI fails
    const fallbackResponse = taskToReschedule 
      ? {
          suggestedStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          suggestedEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
          reasoning: "Fallback scheduling due to AI error"
        }
      : {
          subtasks: [{ title: prompt, estimatedDuration: 60 }],
          totalEstimatedDuration: 60,
          suggestedStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          suggestedEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          reasoning: "Fallback response due to AI error",
          priority: "normal",
          urgency: "medium"
        };
    
    return NextResponse.json(fallbackResponse);
  }
}
