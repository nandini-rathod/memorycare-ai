"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/caregiver/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/caregiver/patients", label: "Patients", icon: "👴" },
  { href: "/caregiver/past-patients", label: "Past Patients", icon: "📋" },
  { href: "/caregiver/reminders", label: "Reminders", icon: "⏰" },
  { href: "/caregiver/photos", label: "Family Photos", icon: "📸" },
  { href: "/caregiver/schedule", label: "Daily Schedule", icon: "📅" },
  { href: "/caregiver/logs", label: "Conversation Logs", icon: "💬" },
];

export default function CaregiverSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show on login page
  if (pathname === "/caregiver/login") return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-care-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-care-primary flex items-center justify-center text-xl shadow-sm">
            🧠
          </div>
          <div>
            <h2 className="text-base font-bold text-care-text">MemoryCare</h2>
            <p className="text-xs text-care-muted">Caregiver Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                isActive
                  ? "bg-care-primary text-white shadow-sm"
                  : "text-care-muted hover:text-care-text hover:bg-care-bg"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-care-border">
        {session?.user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-bold text-care-text truncate">{session.user.name}</p>
            <p className="text-xs text-care-muted truncate">{session.user.email}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/caregiver/login" })}
          className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-care-border shadow-sm z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-care-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-care-primary flex items-center justify-center text-base">🧠</div>
          <span className="font-bold text-care-text">MemoryCare</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-care-text font-bold text-2xl"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
