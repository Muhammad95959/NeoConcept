"use client"
import QuestionAnswer from "@/components/home/QuestionAnswer";
import { motion } from "framer-motion";
const qas = [
    {
        question: "How is this app different from other learning platforms?",
        answer:
            "Unlike traditional platforms, our app uses **Deep Learning Analytics** to monitor your performance in real-time. It provides **AI-Generated Exams** tailored to your specific weak points and offers **Multi-format Learning** (text, audio, video) to ensure the content is always optimized for your study style. For professors, it automates grading and provides instant performance insights.",
        value: "q-1",
    },
    {
        question: "What devices are supported?",
        answer:
            "Our platform is fully **responsive** and optimized for all modern devices, including desktop computers, tablets (iPad, Android), and mobile phones. Simply access it through your web browser; no special downloads are required.",
        value: "q-2",
    },
    {
        question: "Is there a free trial?",
        answer:
            "Yes, we offer a **14-day free trial** for all new users. This allows you to explore all features, including AI content generation and personalized analytics, without any commitment. You can sign up easily using your email.",
        value: "q-3",
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer:
            "Absolutely. Our subscriptions are **flexible**. You can cancel your monthly or annual plan at any time from your account settings. You will retain access to the platform until the end of your current billing cycle.",
        value: "q-4",
    },
    {
        question: "Is my data secure?",
        answer:
            "Data security is our top priority. We use **industry-standard encryption** (AES-256) and secure cloud infrastructure to protect your personal and performance data. We are committed to GDPR and CCPA compliance and never share student data with third parties.",
        value: "q-5",
    },
];
const Qa = () => {
    return (<section className={"container mx-auto px-8 mb-10"}>
        <motion.div
            className={"flex flex-col gap-3"}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.5 }}
        >
        {qas.map(qa => (
            <div key={qa.value}>
            <QuestionAnswer value={qa.value} question={qa.question} answer={qa.answer} />
            </div>
        ))}
        </motion.div>
    </section>)
}

export default Qa;