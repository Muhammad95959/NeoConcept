"use client";
import FeatureCard from "@/components/home/FeatureCard";
import {motion} from "framer-motion";
const features = [
    {
        title: "AI-Powered Tutoring",
        desc: "Always by your side—our AI tutor adapts to your learning speed, explains complex topics simply, and keeps you on track whenever you need help.",
        icon: "/ai.png",
    },
    {
        title: "Personalized Learning",
        desc: "Our AI-driven platform designs a unique learning path just for you—adapting to your goals, pace, and style. It ensures every lesson feels relevant, keeps you motivated, and helps you achieve faster, smarter results.",
        icon: "/valid.png",
    },
    {
        title: "Progress Tracking",
        desc: "Track your learning journey with clear, visual dashboards. Measure progress, celebrate milestones, and stay motivated as you improve.",
        icon: "/chart.png",
    },
    {
        title: "Exams and Questions",
        desc: "Access a wide variety of quizzes and exams designed to challenge your knowledge, track your progress, and push you to reach higher levels of mastery.",
        icon: "/exams.png",
    },
    {
        title: "Gamified Learning",
        desc: "Turn studying into a fun experience with points, badges, and levels. Every achievement motivates you to keep moving forward.",
        icon: "/game.png",
    },
    {
        title: "Collaborative Classrooms",
        desc: "Join an interactive community of students and teachers. Share questions, discuss ideas, and learn from each other in a shared space.",
        icon: "/class.png",
    },
];
const Features = () => {
    return (
        <section className={"container mx-auto md:px-16 md:grid gap-10 sm:grid-cols-2 lg:grid-cols-3 flex flex-col items-center"}>

                {features.map((feature, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, delay: idx * 0.2 }}
                    >
                    <FeatureCard
                        key={idx}
                        title={feature.title}
                        description={feature.desc}
                        imageUrl={feature.icon} />
                    </motion.div>
                ))}

        </section>
    )
}
export default Features;