# Chrona: AI-Powered Calendar & Task Management Web App

Chrona is an AI-first productivity tool designed to help users manage their tasks and schedule visually on a calendar. It aims to streamline task management by leveraging AI to understand, break down, estimate, and schedule tasks automatically.

## Project Purpose

The core idea behind Chrona is to provide a seamless experience for users to:

- **Add Tasks Easily**: Users can click on a calendar slot to add tasks like "Write report" or "Study for exam."
- **Categorize Tasks**: Tasks can be marked as a `task`, `meeting`, `reminder`, `deadline`, or `focus block`.
- **AI-Powered Assistance**: Utilize AI to:
  - Understand and classify the task.
  - Break down large tasks into manageable subtasks.
  - Estimate the time required for tasks.
  - Automatically schedule tasks into available time slots.
  - **Intelligently reschedule incomplete tasks** based on current availability and preferences.
- **Learn User Behavior**: Optimize future suggestions based on user habits and preferences.
- **Visual Scheduling**: Reflect all scheduled tasks and events directly on a calendar UI.

## Technology Stack

Chrona is built as a full-stack web application using modern and robust technologies:

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS, Shadcn/ui)
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **AI**: Google Gemini LLMs (via API)
- **Calendar UI**: FullCalendar (with React, DayGrid, TimeGrid, and Interaction plugins)
- **Form Management**: React Hook Form with Zod for validation

## Implemented Features

We have built a robust foundation for Chrona, implementing several core features and advanced functionalities:

1.  **Project Scaffolding**:

    - Initialized a Next.js 14 project with the App Router, TypeScript, and Tailwind CSS.
    - Integrated Shadcn/ui for a modern and accessible component library.

2.  **Database Setup**:

    - Configured Prisma ORM with SQLite as the database.
    - Defined the core database schema including `User`, `Task`, `CalendarEvent`, and `AIPreferences` models.
    - Added `completedAt` field to `Task` model for tracking task completion.
    - Set up a `lib/db.ts` utility for Prisma client instantiation.

3.  **Modern UI/UX Revamp**:

    - Implemented a clean, modern SaaS-like dashboard layout with a top navigation bar.
    - Integrated a user profile dropdown for easy access to settings and sign-out.
    - Revamped the Settings page UI for a consistent look and added a "Back to Dashboard" navigation.

4.  **Robust Task Management**:

    - Developed a `TaskModal` component for adding, viewing, and editing tasks.
    - Improved `TaskModal` UI with `shadcn/ui` components and `react-hook-form` with `zod` for validation.
    - **Task Deletion**: Added functionality to delete tasks with a confirmation dialog.
    - **Task Completion**: Implemented a switch to mark tasks as `COMPLETED` or `PENDING`, with visual indicators in the task list and calendar.

5.  **Secure Backend API Routes**:

    - **`/api/tasks`**: `POST` (create new tasks), `GET` (fetch all tasks for authenticated user).
    - **`/api/tasks/[id]`**: `GET` (fetch single task), `PUT` (update task details including status and completion), `DELETE` (delete task).
    - **`/api/calendar`**: `GET` (fetch all calendar events for authenticated user).
    - **`/api/user/preferences`**: `POST` (save AI preferences).
    - Removed temporary dummy user creation endpoint.

6.  **Advanced Calendar Integration**:

    - Integrated `FullCalendar` to display calendar events with `dayGridPlugin`, `timeGridPlugin`, and `interactionPlugin`.
    - Enabled `dateClick` to open `TaskModal` with pre-filled date.
    - **Drag-and-Drop Scheduling**: Allows users to reschedule tasks directly on the calendar.
    - **Event Click to View/Edit**: Clicking an event on the calendar opens the `TaskModal` pre-filled with task details for editing or viewing.
    - **Visual Task Status**: Completed tasks are visually distinguished on the calendar.

7.  **AI-Powered Scheduling Agent**:
    - **Intelligent Task Breakdown & Estimation**: The `/api/ai` endpoint now uses Google Gemini LLMs to break down complex tasks into subtasks and estimate their duration.
    - **Smart Scheduling Suggestions**: The AI considers user-defined working hours, preferred times, and existing calendar events to suggest optimal `startTime` and `endTime` for new tasks.
    - **AI Rescheduling for Incomplete Tasks**: If a task is marked incomplete, the AI can suggest a new, suitable time slot, taking into account the current schedule and preferences.

## Setup and Running Instructions

To get Chrona up and running on your local machine, follow these steps:

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd chrona
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Set up Prisma and the database**:

    ```bash
    npx prisma db push
    ```

    This will create the `dev.db` SQLite file and generate the Prisma client.

4.  **Configure Environment Variables**:
    Create a `.env` file in the project root and add your Google OAuth credentials and NextAuth.js secret. **Crucially, also add your Gemini API Key.**

    ```
    GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
    NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

    You can generate a strong secret for `NEXTAUTH_SECRET` using `openssl rand -base64 32`.
    Get your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/app/apikey).

5.  **Run the development server**:

    ```bash
    npm run dev
    ```

    The application will be accessible at `http://localhost:3000`.

6.  **Clear Dummy Data (Optional)**:
    If you wish to clear any tasks you've added, you can run:
    ```bash
    curl -X POST http://localhost:3000/api/clear-data
    ```

## Future Enhancements

While Chrona now boasts significant AI capabilities and a polished UX, here are areas for further development:

- **Refining AI Re-scheduling Logic**: Further enhance the AI's ability to find optimal time slots, especially for complex re-scheduling scenarios (e.g., splitting tasks, handling multiple conflicts).
- **Learning User Behavior**: Implement more sophisticated logic for the AI to learn from user interactions, task completion patterns, and manual adjustments to optimize future suggestions and scheduling.
- **Notifications and Reminders**: Develop a system for sending timely notifications and reminders for upcoming tasks and deadlines.
- **Advanced Task Filtering and Sorting**: Provide more comprehensive options for users to filter and sort their tasks and calendar events.
- **Recurring Tasks**: Add support for creating and managing recurring tasks and events.
- **Integration with External Calendars**: Allow users to sync their Chrona calendar with Google Calendar, Outlook Calendar, etc.
