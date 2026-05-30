import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutDashboard, CheckSquare, Calendar, StickyNote, LogOut, DollarSign, Package, Settings, BookOpen, Brain, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthUI } from "./components/AuthUI";
import { signOut } from "./actions";
import { Pomodoro } from "./components/Pomodoro";
import { BottomNav } from "./components/BottomNav";
import { MobileHeader } from "./components/MobileHeader";
import { ThemeProvider } from "./components/ThemeProvider";
import NextTopLoader from "nextjs-toploader";

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

const navItems = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Calendar, label: "Schedule", href: "/schedule" },
  { icon: StickyNote, label: "Notes", href: "/notes" },
  { icon: Sparkles, label: "Timeline", href: "/timeline" },
  { icon: DollarSign, label: "Finance", href: "/finance" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: BookOpen, label: "Manual", href: "/docs" },
];

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
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthUI />
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 relative transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextTopLoader showSpinner={false} color="var(--loader-color)" height={2} shadow="none" />
          
          <div className="flex flex-col md:flex-row flex-1 w-full min-h-screen">
            {/* Desktop Sidebar (Fixed left) */}
            <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-neutral-200 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-950 p-6 h-screen justify-between transition-colors z-30">
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-neutral-900 dark:text-white stroke-[1.5px]" />
                  <span className="font-medium tracking-tight text-neutral-900 dark:text-white text-sm font-semibold">Brain OS</span>
                </div>
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/50 rounded-lg transition-colors group"
                    >
                      <item.icon className="w-4 h-4 stroke-[1.5px]" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-900 pt-4 flex flex-col gap-3">
                <div className="px-3">
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.5px]" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </form>
              </div>
            </aside>

            {/* Content Container */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen w-full">
              {/* Mobile Header (Sticky top-0 z-50) */}
              <MobileHeader />

              {/* Main Content Area */}
              <main className="flex-1 w-full p-6 pb-24 md:pb-6">
                <div className="max-w-4xl mx-auto">
                  {children}
                </div>
              </main>

              {/* Mobile Bottom Navigation (Fixed bottom-0 left-0 w-full z-50) */}
              <BottomNav />
            </div>
          </div>

          {/* Global Floating Pomodoro Widget */}
          <Pomodoro />
        </ThemeProvider>
      </body>
    </html>
  );
}
