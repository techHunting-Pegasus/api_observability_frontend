"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, FolderKanban, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/utils/cn";

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
        <Activity className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight">API Observability</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { token, ready, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !token) router.replace("/login");
  }, [ready, token, router]);
  useEffect(() => setOpen(false), [pathname]);

  if (!ready || !token) {
    return (
      <div className="p-8" aria-busy="true" aria-label="Loading">
        <Skeleton className="mb-6 h-7 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
      <Link
        href="/dashboard"
        aria-current={pathname.startsWith("/dashboard") || pathname.startsWith("/projects") ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
          pathname.startsWith("/dashboard") || pathname.startsWith("/projects") ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-black/5",
        )}
      >
        <FolderKanban className="h-4 w-4" /> Projects
      </Link>
    </nav>
  );

  const footer = (
    <div className="border-t border-line p-3">
      <p className="truncate px-2 pb-2 text-xs text-ink-soft" title={user?.email}>
        {user?.email}
      </p>
      <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-black/5">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="px-5 py-4">
          <Brand />
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded p-1.5 hover:bg-black/5">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-64 animate-slideIn flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded p-1 hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
