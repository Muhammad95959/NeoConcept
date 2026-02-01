"use client"
import MainStudentDashboard from "@/components/pages/MainStudentDashboard";
import MainInstructorDashboard from "@/components/pages/MainInstructorDashboard";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


const UserDashboardPage = () => {
    const router = useRouter();
    const [role, setRole] = useState<'INSTRUCTOR' | 'STUDENT' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const res = await fetch("http://localhost:9595/api/v1/auth", {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            if (res.status === 200) {
                const userData = await res.json();

                if(userData.data.currentTrackId === null) {
                    router.push('/choose-track');
                }
                setRole(userData.data.role);
                console.log(userData.data);

                setIsLoading(false);
            } else if (res.status === 401) {
                // User not logged in, redirect to login
                router.push("/login");
            } else {
                // Other error
                setError("Failed to authenticate");
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError("Network error. Please try again.");
            setIsLoading(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={checkAuthStatus}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Render based on role

    if (role === 'STUDENT') {
        return <MainStudentDashboard />;
    } else if (role === 'INSTRUCTOR') {
        return <MainInstructorDashboard />;
    } else {
        router.push("/login");
        return (
            <div className="flex items-center justify-center min-h-screen">
                <h1 className="text-xl text-gray-700">You are not logged in</h1>
            </div>
        );

    }
};

export default UserDashboardPage;