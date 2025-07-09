"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Zap, Users, Brain, CheckCircle } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      console.log('Starting Google sign-in...');
      const result = await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: false  // Changed to false for better error handling
      });
      
      console.log('Sign-in result:', result);
      
      if (result?.error) {
        console.error('Sign-in error:', result.error);
        alert(`Sign-in failed: ${result.error}`);
      } else if (result?.url) {
        // Manually redirect if successful
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      alert("Sign-in failed. Please check your internet connection and try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Chrona</span>
          </div>
          <Button 
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSigningIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 lg:px-6 py-24 max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              AI-Powered Task Management
              <span className="block text-blue-600 dark:text-blue-400">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Let AI break down your tasks, schedule them intelligently, and help you stay organized. 
              Transform your productivity with smart calendar integration and automated task management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleSignIn}
                disabled={isSigningIn}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                {isSigningIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Getting Started...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Get Started Free
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 lg:px-6 py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Why Choose Chrona?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Task Breakdown</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Automatically break complex tasks into manageable subtasks with AI-powered analysis and smart scheduling.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Smart Calendar</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Integrated calendar with drag-and-drop scheduling, color-coded tasks, and intelligent time blocking.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Progress Tracking</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Track your progress with visual indicators, completion status, and detailed task history.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Task Types Section */}
        <section className="px-4 lg:px-6 py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Organize Every Type of Task
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Meetings</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Schedule and track meetings with proper time allocation</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <Clock className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Deadlines</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Never miss important deadlines with smart reminders</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-lg">🔔</span>
                  <span className="font-medium text-gray-900 dark:text-white">Reminders</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Set up reminders for important events and tasks</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-lg">🎯</span>
                  <span className="font-medium text-gray-900 dark:text-white">Focus Blocks</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Dedicated time blocks for deep work and concentration</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-lg">📝</span>
                  <span className="font-medium text-gray-900 dark:text-white">General Tasks</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Organize everyday tasks and to-dos efficiently</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 lg:px-6 py-24 bg-blue-600 dark:bg-blue-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Productivity?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who have revolutionized their task management with AI-powered scheduling.
            </p>
            <Button 
              onClick={handleSignIn}
              disabled={isSigningIn}
              size="lg"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 text-lg"
            >
              {isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  Starting Your Journey...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Start Free with Google
                </>
              )}
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-4 lg:px-6 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-300">
            © 2024 Chrona. Transform your productivity with AI-powered task management.
          </p>
        </div>
      </footer>
    </div>
  );
}