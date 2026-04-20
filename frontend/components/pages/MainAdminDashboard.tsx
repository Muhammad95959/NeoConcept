"use client"

import AdminSidebar from "@/components/admin/AdminSidebar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  BookOpen,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

type AdminSection = "Overview" | "Tracks" | "Courses" | "Users" | "Settings"

interface MainAdminDashboardProps {
  adminName: string
}

function normalizeList(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === "object") {
    const typedPayload = payload as {
      data?: unknown
      tracks?: unknown
      courses?: unknown
    }

    if (Array.isArray(typedPayload.data)) {
      return typedPayload.data
    }

    if (typedPayload.data && typeof typedPayload.data === "object") {
      const nestedData = typedPayload.data as { tracks?: unknown; courses?: unknown }

      if (Array.isArray(nestedData.tracks)) {
        return nestedData.tracks
      }

      if (Array.isArray(nestedData.courses)) {
        return nestedData.courses
      }
    }

    if (Array.isArray(typedPayload.tracks)) {
      return typedPayload.tracks
    }

    if (Array.isArray(typedPayload.courses)) {
      return typedPayload.courses
    }
  }

  return []
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "N/A"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string
  value: string
  helper: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-white/70 bg-white/75 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur">
      <CardContent className="flex items-start justify-between px-5 py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(245,158,11,0.18),_rgba(59,130,246,0.12))] text-slate-900">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  )
}

export default function MainAdminDashboard({ adminName }: MainAdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>("Overview")
  const [tracks, setTracks] = useState<Track[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState("")

  const loadAdminData = async () => {
    setLoadingData(true)
    setDataError(null)

    try {
      const [tracksResponse, coursesResponse] = await Promise.all([
        fetch("http://localhost:9595/api/v1/tracks", {
          credentials: "include",
        }),
        fetch("http://localhost:9595/api/v1/courses", {
          credentials: "include",
        }),
      ])

      if (!tracksResponse.ok || !coursesResponse.ok) {
        throw new Error("Unable to load tracks and courses")
      }

      const [tracksPayload, coursesPayload] = await Promise.all([
        tracksResponse.json(),
        coursesResponse.json(),
      ])

      setTracks(normalizeList(tracksPayload) as Track[])
      setCourses(normalizeList(coursesPayload) as Course[])
    } catch (loadError) {
      setDataError(loadError instanceof Error ? loadError.message : "Unexpected error")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const filteredTracks = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    if (!query) {
      return tracks
    }

    return tracks.filter((track) => {
      return (
        track.name.toLowerCase().includes(query) ||
        track.description.toLowerCase().includes(query)
      )
    })
  }, [searchValue, tracks])

  const filteredCourses = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    if (!query) {
      return courses
    }

    return courses.filter((course) => {
      return (
        course.name.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      )
    })
  }, [courses, searchValue])

  const trackCourseCount = useMemo(() => {
    const countByTrack = new Map<string, number>()

    for (const course of courses) {
      countByTrack.set(course.trackId, (countByTrack.get(course.trackId) ?? 0) + 1)
    }

    return countByTrack
  }, [courses])

  const summaryCards = [
    {
      label: "Tracks",
      value: String(tracks.length),
      helper: "Organized learning paths currently available.",
      icon: Layers3,
    },
    {
      label: "Courses",
      value: String(courses.length),
      helper: "Courses mapped across all published tracks.",
      icon: BookOpen,
    },
    {
      label: "Admin access",
      value: "Live",
      helper: `Signed in as ${adminName}`,
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(241,246,255,0.92)_38%,_rgba(251,243,219,0.96)_100%)] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(135deg,_rgba(245,158,11,0.15),_rgba(59,130,246,0.14),_rgba(15,23,42,0.05))] blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <AdminSidebar activeSection={activeSection} onSelect={setActiveSection} />

        <main className="min-h-[calc(100vh-2rem)] rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary)]">
                Admin command center
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Welcome back, {adminName}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Manage tracks and courses from a calm, focused workspace built around the backend API.
                Use the sidebar to switch sections and the search field to inspect data quickly.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => setActiveSection("Tracks")}
                className="rounded-full bg-[var(--color-primary)] px-5 text-white shadow-lg shadow-blue-500/20 hover:opacity-95"
              >
                Open tracks
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={loadAdminData}
                className="rounded-full border-slate-200 bg-white/90 px-5 text-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh data
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <Separator className="my-8 bg-slate-200/80" />

          {loadingData ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className="border-white/70 bg-white/70 shadow-[0_18px_55px_rgba(15,23,42,0.06)]"
                >
                  <CardContent className="space-y-3 px-5 py-5">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : dataError ? (
            <Card className="border-rose-200 bg-rose-50/80 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle className="text-slate-950">Could not load admin data</CardTitle>
                <CardDescription className="text-slate-600">{dataError}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" onClick={loadAdminData} className="rounded-full">
                  Retry loading
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {(activeSection === "Overview" || activeSection === "Tracks") && (
                <Card className="border-white/70 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
                  <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-2xl text-slate-950">Track management</CardTitle>
                      <CardDescription className="mt-1 text-slate-500">
                        Search, review, and prepare the track workspace for CRUD actions.
                      </CardDescription>
                    </div>

                    <div className="flex w-full gap-3 sm:w-auto">
                      <div className="relative w-full sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={searchValue}
                          onChange={(event) => setSearchValue(event.target.value)}
                          placeholder="Search tracks and courses"
                          className="h-11 rounded-full border-slate-200 pl-10"
                        />
                      </div>
                      <Button type="button" className="h-11 rounded-full">
                        <Plus className="h-4 w-4" />
                        New track
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="grid gap-4 lg:grid-cols-2">
                    {filteredTracks.slice(0, 6).map((track) => (
                      <div
                        key={track.id}
                        className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.9))] p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">
                              Track
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-slate-950">{track.name}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{track.description}</p>
                          </div>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                            {trackCourseCount.get(track.id) ?? 0} courses
                          </span>
                        </div>

                        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                          <span>Created {formatDate(track.createdAt)}</span>
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            Manage later
                            <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeSection === "Overview" && (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <Card className="border-white/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] text-white shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-5 w-5 text-amber-300" />
                        Quick actions
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        A few focused entry points for the most important admin work.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setActiveSection("Tracks")}
                        className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                      >
                        <p className="text-sm font-semibold text-white">Manage tracks</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Review the track list and prepare create, update, and delete flows.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection("Courses")}
                        className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                      >
                        <p className="text-sm font-semibold text-white">Inspect courses</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          See how courses are distributed across the catalog.
                        </p>
                      </button>
                    </CardContent>
                  </Card>

                  <Card className="border-white/70 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
                    <CardHeader>
                      <CardTitle className="text-2xl text-slate-950">Recent activity</CardTitle>
                      <CardDescription>
                        A simple snapshot of the first items returned by the API.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {filteredTracks.slice(0, 3).map((track) => (
                        <div key={track.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(245,158,11,0.15)] text-amber-700">
                            <Layers3 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{track.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {trackCourseCount.get(track.id) ?? 0} linked courses • {formatDate(track.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {filteredTracks.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                          No tracks match the current search.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === "Courses" && (
                <Card className="border-white/70 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-950">Course overview</CardTitle>
                    <CardDescription>
                      Courses currently available through the API, filtered by the search field.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredCourses.slice(0, 6).map((course) => (
                      <div key={course.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                              Course
                            </p>
                            <h3 className="mt-2 text-base font-semibold text-slate-950">{course.name}</h3>
                          </div>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
                            Track {course.trackId.slice(0, 8)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{course.description}</p>
                      </div>
                    ))}

                    {filteredCourses.length === 0 && (
                      <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                        No courses match the current search.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeSection === "Users" && (
                <Card className="border-white/70 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-slate-950">
                      <Users className="h-5 w-5 text-[var(--color-primary)]" />
                      Users panel
                    </CardTitle>
                    <CardDescription>
                      This area is ready for future user management screens and role tools.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
                      The current API surface in the swagger file is enough to support track and course
                      control first. A user list can be added here once the backend exposes a dedicated
                      users endpoint.
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === "Settings" && (
                <Card className="border-white/70 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-950">Settings</CardTitle>
                    <CardDescription>Reserved for future dashboard preferences and permissions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
                      This section is a placeholder for configuration panels, audit tools, and other
                      admin preferences.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}