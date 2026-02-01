import {useState, useEffect} from 'react';

export function useUser() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const fetchUser = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:9595/api/v1/auth", {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) {
                throw new Error("Not Logged In");
            }
            const data = await res.json();
            setUser(data.data);
        } catch(err: any) {
            setError(err.message);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return {user, loading, error, refetch: fetchUser};
}