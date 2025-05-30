"use client";

import { DevDialog } from "@/components/DevDialog";
import { Header } from "@/components/Header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Toaster } from "@/components/ui/toaster";
import { PostHogProvider } from "@/components/PostHogProvider";
import { queryClient } from "@/lib/util/queryClient";
import { trpc, trpcClient } from "@/lib/util/trpc";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider afterSignOutUrl="/">
          <html lang="en">
            <head>
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <meta name="overscroll-behavior" content="none" />
              <link rel="icon" href="/favicon.ico" />
              <title>30 Day Me</title>
              <meta
                name="description"
                content="30 Day Me is a platform for creating and tracking 30-day challenges."
              />
            </head>
            <body className="flex min-h-screen flex-col bg-gray-50">
              <PostHogProvider>
                <Suspense
                  fallback={
                    <div className="flex h-screen w-full items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  }
                >
                  <Header />
                  <SignedIn>
                    <main className="flex flex-1">{children}</main>
                  </SignedIn>
                  <SignedOut>
                    <main className="flex flex-1">{children}</main>
                  </SignedOut>
                  <Toaster />
                  {/* DEVELOPER TOOLS */}
                  <DevDialog />
                  <Analytics />
                </Suspense>
              </PostHogProvider>
            </body>
          </html>
        </ClerkProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}