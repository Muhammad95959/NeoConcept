import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import BigFeatureCard from "@/components/home/BigFeatureCard";
import QA from "@/components/home/QA";
import Accessibility from "@/components/home/Accessibility";

const student_features = [
    {
        title: "Targeted Reviews:",
        description: "Focus on your weak points and save study time.",
    },
    {
        title: "Simplified Explanations:",
        description: "Break down complex concepts into easy-to-grasp lessons.",
    },
    {
        title: "Smart Reminders:",
        description: "Stay on track with gentle nudges when it's time to review.",
    },
    {
        title: "Multi-format Learning:",
        description: "Choose text, audio, or video—study the way that works best for you.",
    },
];

const professor_features = [
    {
        title: "AI-Generated Exams:",
        description: "Create high-quality assessments in minutes.",
    },
    {
        title: "Seamless Class Management:",
        description: "Track students and groups in one place.",
    },
    {
        title: "Automated Grading & Analytics:",
        description: "Save hours of manual work with instant performance insights.",
    },
    {
        title: "Deep Learning Analytics:",
        description: "Identify trends, monitor progress, and personalize support.",
    },
];

const MainHome = () => {
  return (
      <main className={"container mx-auto px-8"}>
        <Hero />
          <div id={"features"} className={"pt-10"}><Features /></div>

          <section className={"my-10 md:my-20"}>
              <div id={"student"}><BigFeatureCard image="/student.png" target={"Student"} features={student_features} begin={-100}/></div>
              <div id={"instructor"}><BigFeatureCard image="/prof.png" target={"Instructor"} features={professor_features} begin={100} /></div>
          </section>

          <section id={"qa"}>
              <h1 className={"text-white text-4xl mb-8 mx-auto w-fit"}>Frequently Asked Questions (FAQs)</h1>
              <QA />
          </section>

          <section id={"accessibility"}>
              <Accessibility />
          </section>
      </main>
  );
}

export default MainHome;