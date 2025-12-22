import React from 'react';
import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TrackCard from "./TrackCard";

interface TracksGridProps {
    tracks: Track[];
    handleSelectTrack: (track: Track) => void;
}

export default function TracksGrid({ tracks, handleSelectTrack }: TracksGridProps) {
    return (
        <section className="min-h-screen bg-[#04050c] px-6 py-4 lg:py-4 flex items-center justify-center">
            <div className="container max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 md:gap-x-8 lg:gap-x-12 justify-items-center items-stretch">
                    {tracks.map((track, index) => (
                        <TrackCard key={index} track={track} handleSelectTrack={handleSelectTrack}/>
                    ))}
                </div>
            </div>
        </section>
    );
}