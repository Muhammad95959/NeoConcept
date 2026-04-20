"use client"

import { type LucideIcon, GraduationCap, LayoutDashboard, Layers3, Settings2, Users } from "lucide-react"

type AdminSection = "Overview" | "Tracks" | "Courses" | "Users" | "Settings"

interface AdminSidebarProps {
  activeSection: AdminSection
  onSelect: (section: AdminSection) => void
}

const menuItems: Array<{
  label: AdminSection
  description: string
  icon: LucideIcon
}> = [
  {
    label: "Overview",
    description: "Command center and key metrics",
    icon: LayoutDashboard,
  },
  {
    label: "Tracks",
    description: "Create and organize learning tracks",
    icon: Layers3,
  },
  {
    label: "Courses",
    description: "Review courses inside each track",
    icon: GraduationCap,
  },
  {
    label: "Users",
    description: "Inspect users and role activity",
    icon: Users,
  },
  {
    label: "Settings",
    description: "Adjust future admin preferences",
    icon: Settings2,
  },
]

export default function AdminSidebar({ activeSection, onSelect }: AdminSidebarProps) {
  return (
    <aside className="flex h-full flex-col rounded-4xl border border-slate-800/60 bg-[linear-gradient(180deg,#0f172a_0%,#111827_55%,#1e293b_100%)] p-5 text-slate-100 shadow-[0_30px_80px_rgba(15,23,42,0.3)] md:sticky md:top-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#fde68a)] text-slate-950 shadow-lg shadow-amber-500/30">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">NeoConcept</p>
            <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-300">
          Control tracks, courses, and future user operations from one focused surface.
        </p>
      </div>

      <nav className="mt-6 flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.label

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(item.label)}
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-amber-300/60 bg-amber-300/15 text-white shadow-[0_12px_30px_rgba(245,158,11,0.18)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isActive ? "bg-amber-300 text-slate-950" : "bg-white/10 text-amber-200"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-inherit/80">
                  {item.description}
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
        <p className="mt-2 text-sm font-medium text-white">Live API connected</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          This panel is ready for track and course operations using the backend API.
        </p>
      </div>
    </aside>
  )
}