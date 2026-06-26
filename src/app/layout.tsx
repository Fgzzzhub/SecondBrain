import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LogOut, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AuthUI } from "./components/AuthUI";
import { signOut } from "./actions";
import { BottomNav } from "./components/BottomNav";
import { MobileHeader } from "./components/MobileHeader";
import { ThemeProvider } from "./components/ThemeProvider";
import NextTopLoader from "nextjs-toploader";
import { SidebarLinks } from "./components/SidebarLinks";
import { SettingsProvider } from "./components/SettingsContext";
import { OmniSearch } from "./components/OmniSearch";
import { AutoFinanceSync } from "./components/AutoFinanceSync";
import { QuickActionProvider } from "./components/QuickActionProvider";
import { FloatingQuickAction } from "./components/FloatingQuickAction";
import { NotificationPrompt } from "./components/NotificationPrompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Second Brain",
  description: "Minimalist Productivity OS & College Management",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#080B14",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans`}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <div className="ambient-bg" aria-hidden="true" />
            <AuthUI />
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col relative`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SettingsProvider>
            <QuickActionProvider>
              {/* Fixed ambient gradient blobs behind everything */}
              <div className="ambient-bg" aria-hidden="true" />

              <NextTopLoader showSpinner={false} color="rgb(var(--color-primary))" height={2} shadow={false} />

              <div className="flex flex-col md:flex-row flex-1 w-full min-h-screen relative z-10">
                {/* Desktop glass sidebar */}
                <aside className="hidden md:flex flex-col w-64 fixed inset-y-3 left-3 rounded-2xl glass p-5 justify-between z-30 overflow-hidden">
                  <div className="flex flex-col gap-6 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2.5 flex-shrink-0 px-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[rgba(var(--color-primary),0.18)] border border-[rgba(var(--color-primary),0.35)]">
                        <Brain className="w-3.5 h-3.5 text-[rgb(var(--color-primary))] stroke-[1.75px]" />
                      </div>
                      <span className="font-semibold tracking-tight text-[var(--text-primary)] text-sm">Brain OS</span>
                    </div>

                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pr-1">
                      <SidebarLinks />
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2">
                    <div className="px-3">
                      <p className="text-[10px] text-[var(--text-muted)] truncate font-medium">{user.email}</p>
                    </div>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 stroke-[1.5px]" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </form>
                  </div>
                </aside>

                {/* Content Container */}
                <div className="flex-1 md:pl-[17.5rem] flex flex-col min-h-screen w-full">
                  <MobileHeader />

                  <main className="flex-1 w-full px-5 sm:px-6 pt-20 pb-32 md:pt-6 md:pb-6 md:pr-6">
                    <div className="max-w-5xl mx-auto">
                      {children}
                    </div>
                  </main>

                  <BottomNav />
                </div>
              </div>

              <OmniSearch />
              <AutoFinanceSync />
              <FloatingQuickAction />
              <NotificationPrompt />
            </QuickActionProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
