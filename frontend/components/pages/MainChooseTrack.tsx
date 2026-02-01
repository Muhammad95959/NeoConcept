"use client"
import {useState, useEffect} from "react";
import {useUser} from "@/hooks/useUser";
import {Roboto} from "next/font/google";
import {useRouter} from "next/navigation";
import TrackCard from "@/components/choose-track/TrackCard";
import TracksGrid from "@/components/choose-track/TrackGrid";
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"] });

interface IProps {

};

const MainChooseTrack = ({}: IProps) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<string>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const {user, loading, error} = useUser();



    useEffect(() => {
        getTracks();
    }, []);

    const handleSelectTrack = async (trackId: string) => {
        setIsSubmitting(trackId);

        try {
            const res = await fetch(`http://localhost:9595/api/v1/users/${user.id}/select-track`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackId: trackId }),

            })
        } catch (error) {
            console.log(error);
        } finally {
            if (user.trackId !== null) {
                router.push("/dashboard");
            }
        }
    }

    const getTracks = async () => {
        const res = await fetch("http://localhost:9595/api/v1/tracks", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        setTracks(data.data);


    }


    console.log("user: ", user);
    return (
        <div className={"text-white"}>
            <h1 className={`${roboto.className} font-bold text-4xl md:text-5xl bg-gradient-to-r from-[#99C9FF] via-[#7B9DD8] to-[#CFDAFF] bg-clip-text text-transparent text-center `}>Choose Your Track</h1>
            <TracksGrid tracks={tracks} handleSelectTrack={handleSelectTrack}/>
        </div>
    )
}

export default MainChooseTrack;