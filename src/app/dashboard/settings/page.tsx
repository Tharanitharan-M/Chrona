"use client";

import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useEffect, useState } from "react";

const formSchema = z.object({
  workingHours: z.string().optional(),
  preferredTimes: z.string().optional(),
  selectedModel: z.string().optional(),
});

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workingHours: "",
      preferredTimes: "",
      selectedModel: "gpt-4",
    },
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (session) {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          form.reset(data);
        }
      }
    };
    fetchPreferences();
  }, [session, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaveStatus('saving');
    
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        setSaveStatus('success');
        console.log("Preferences saved successfully");
        // Reset status after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        console.error("Failed to save preferences");
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error("Error saving preferences:", error);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        </div>
        <div className="grid gap-4 py-4">
          <p>Name: {session.user.name}</p>
          <p>Email: {session.user.email}</p>
        </div>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">AI Preferences</h2>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working Hours</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9am-5pm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredTimes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Times</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., mornings, afternoons" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="selectedModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Model</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an AI model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="o1-mini">O1 Mini</SelectItem>
                      <SelectItem value="o1-preview">O1 Preview</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'success' && '✓ Saved!'}
              {saveStatus === 'error' && 'Error - Try Again'}
              {saveStatus === 'idle' && 'Save Preferences'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}