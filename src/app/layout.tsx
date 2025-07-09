import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chrona - AI-Powered Task Management",
  description: "Transform your productivity with AI-powered task breakdown, smart scheduling, and intelligent calendar integration. Chrona helps you organize tasks, manage deadlines, and boost productivity with automated subtask creation.",
  keywords: [
    "task management",
    "AI productivity",
    "smart calendar",
    "task scheduling",
    "productivity app",
    "project management",
    "time blocking",
    "task organization",
    "deadline management",
    "focus blocks"
  ],
  authors: [{ name: "Chrona Team" }],
  creator: "Chrona",
  publisher: "Chrona",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://chrona.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Chrona - AI-Powered Task Management",
    description: "Transform your productivity with AI-powered task breakdown, smart scheduling, and intelligent calendar integration.",
    url: "https://chrona.app",
    siteName: "Chrona",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Chrona - AI-Powered Task Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Chrona - AI-Powered Task Management",
    description: "Transform your productivity with AI-powered task breakdown, smart scheduling, and intelligent calendar integration.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </body>
    </html>
  );
}
