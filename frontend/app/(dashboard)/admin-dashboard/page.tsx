"use client"

import MainAdminDashboard from "@/components/pages/MainAdminDashboard"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type AdminUser = {
	id: string
	username: string
	email: string
	role: string
}

export default function AdminDashboardPage() {
	const router = useRouter()
	const [user, setUser] = useState<AdminUser | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const loadUser = async () => {
			try {
				const response = await fetch("http://localhost:9595/api/v1/auth", {
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				})

				if (response.status === 401) {
					router.replace("/login")
					return
				}

				if (!response.ok) {
					throw new Error("Failed to load admin session")
				}

				const payload = await response.json()
				const currentUser = payload?.data as AdminUser | undefined

				if (!currentUser || currentUser.role !== "ADMIN") {
					router.replace("/dashboard")
					return
				}

				setUser(currentUser)
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Unexpected error")
			} finally {
				setLoading(false)
			}
		}

		loadUser()
	}, [router])

	if (loading) {
		return (
			<div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(236,243,255,0.92)_42%,_rgba(246,231,198,0.95)_100%)] px-6 py-10">
				<div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
					<div className="text-center">
						<div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[rgba(15,23,42,0.15)] border-t-[var(--color-primary)]" />
						<p className="mt-4 text-sm font-medium text-slate-600">Opening admin command center...</p>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(236,243,255,0.92)_42%,_rgba(246,231,198,0.95)_100%)] px-6 py-10">
				<div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center rounded-[2rem] border border-rose-200 bg-white/80 p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-500">Admin access error</p>
						<h1 className="mt-3 text-3xl font-semibold text-slate-900">We could not open the dashboard</h1>
						<p className="mt-4 text-sm text-slate-600">{error}</p>
						<button
							onClick={() => router.refresh()}
							className="mt-6 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (!user) {
		return null
	}

	return <MainAdminDashboard adminName={user.username} />
}
