import React from 'react';
import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

const TrackCard = ({ track, handleSelectTrack }: { track: Track, handleSelectTrack: (track: Track) => void }) => {
    return (
        // تأكد أن bg-black هنا هي نفس لون خلفية الصفحة
        <div className="relative mt-8 w-full max-w-[350px] mx-auto group">

            {/* Container الدائرة العلوية */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">

                {/* 1. الطبقة اللي بتعمل "القطع" (The Cut-out Hole) */}
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#04050c] ring-[6px] ring-[#04050c]">

                    {/* 2. الدائرة الزرقاء المتوهجة (The Inner Glowing Circle) */}
                    <div className="
            flex h-[80px] w-[80px] items-center justify-center rounded-full
            border-[2.5px] border-blue-600
            bg-[#04050c]
            /* الشادو هنا محصور داخل الدائرة السوداء */
            shadow-[inset_0_0_15px_rgba(37,99,235,0.4),0_0_20px_rgba(37,99,235,0.5)]
          ">
            <span className="text-xl font-bold tracking-tighter text-blue-500 uppercase">
              {track.name}
            </span>
                    </div>
                </div>
            </div>

            {/* جسم الكارت */}
            <div className="
        relative overflow-hidden rounded-[40px]
        bg-[#232323] px-8 pb-10 pt-16
        border border-white/5 shadow-2xl
      ">
                {/* المحتوى */}
                <div className="text-center mb-8">
                    <p className="text-[14px] leading-relaxed text-zinc-400 font-medium">
                        {track.description}
                    </p>
                </div>

                <Button
                    className="mb-10 h-14 w-full rounded-full bg-[#5865F2] text-lg font-bold text-white hover:bg-[#4752c4] transition-all"
                    onClick={() => handleSelectTrack(track.id)}
                >
                    Enter Department
                </Button>

                {/* قائمة الكورسات */}
                <div className="space-y-5">
                    {track.courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="flex items-center gap-4 group/item">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 transition-colors group-hover/item:bg-zinc-700">
                                <Check className="h-3.5 w-3.5 text-zinc-400" strokeWidth={4} />
                            </div>
                            <span className="text-[15px] font-medium text-zinc-200">
                {course.name}
              </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrackCard;