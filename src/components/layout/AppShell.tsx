import Link from "next/link";
import { BarChart3, BriefcaseBusiness, ClipboardList, Sparkles } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/supabase/server";

const navItems = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/jobs/new", label: "New analysis", icon: Sparkles },
  { href: "/dashboard", label: "Tracker", icon: ClipboardList }
] as const;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slateLine bg-white px-4 py-5 lg:block">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pilot-600 text-white">
            <BriefcaseBusiness size={21} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold">JobPilot AI</span>
            <span className="block text-xs text-slate-500">Agent workspace</span>
          </span>
        </Link>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-pilot-50 hover:text-pilot-700 focus:outline-none focus:ring-2 focus:ring-pilot-500"
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 space-y-3">
          {user ? (
            <div className="rounded-lg border border-slateLine bg-surface p-3 text-sm text-slate-600">
              <p className="font-medium text-ink">Signed in</p>
              <p className="mt-1 truncate text-xs">{user.email}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slateLine bg-surface p-3 text-sm text-slate-600">
              <p className="font-medium text-ink">Private workspace</p>
              <p className="mt-1 text-xs leading-5">Log in to access your own dashboard.</p>
            </div>
          )}
          {user ? <LogoutButton /> : null}
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-slateLine bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BriefcaseBusiness size={20} aria-hidden="true" />
            JobPilot AI
          </Link>
          <Link href="/jobs/new" className="rounded-lg bg-pilot-600 px-3 py-2 text-sm font-medium text-white">
            New
          </Link>
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
