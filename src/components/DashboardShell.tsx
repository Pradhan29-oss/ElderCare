"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardShell({
  name,
  roleLabel,
  children,
}: {
  name: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border-soft bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-semibold text-ink">Setu</Link>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-ink leading-tight">{name}</p>
              <p className="text-xs text-ink/50 leading-tight">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-full border border-border-soft text-ink/70 hover:border-ink/40 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
