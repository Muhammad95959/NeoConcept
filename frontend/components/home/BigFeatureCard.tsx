"use client";
import {Button} from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import Image from "next/image";
import {motion} from "framer-motion";
interface Feature {
    title: string;
    description: string;
}
interface IProps {
    features?: Feature[];
    begin: number;
    target: string;
    image: string;
}
const BigFeatureCard = ({ features, begin , target, image}: IProps) => {
    return (
        // هنا نستخدم مكون Card كحاوية رئيسية. سنقوم بتخصيص مظهره بالكامل.
        <Card className="border-none text-white mb-8 overflow-hidden max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, x: begin }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: .6, delay: 0.5 }}
            >
            {/* Grid layout لتقسيم البطاقة إلى قسمين: نص ورسم بياني */}
            <div className="grid grid-cols-1 lg:grid-cols-2">

                {/* === القسم الأيسر: المحتوى النصي والزر === */}
                <div className="flex flex-col justify-around p-8 md:p-12 order-last lg:order-first">

                    <CardHeader className="p-0 mb-8 space-y-2">
                        {/* عنوان "For Students" */}
                        <CardTitle className="w-full text-4xl font-bold tracking-wide bg-gradient-to-r from-[#91FBFF] to-[#15A1C8] bg-clip-text text-transparent border border-b-[#99D1FF] pb-2">
                            For {target}
                        </CardTitle>
                        {/* خط تحت العنوان - باستخدام div عادي بدلاً من CardDescription لتصميم الخط السميك */}

                    </CardHeader>

                    {/* محتوى البطاقة - قائمة الميزات */}
                    <CardContent className="p-0 space-y-6 flex-grow">
                        {features?.map((feature, index) => (
                            <div key={index}>
                                <p className="text-xl font-bold text-white leading-snug">
                                    {feature.title} <span className="font-normal text-gray-300 text-lg">{feature.description}</span>
                                </p>
                            </div>
                        ))}
                    </CardContent>

                    {/* تذييل البطاقة - يحتوي على الزر */}
                    <CardFooter className="p-0 mt-10">
                        <Button
                            // تصميم الزر ليتناسب مع البطاقة الداكنة
                            variant="default" // استخدام default أو تخصيصه بالكامل
                            className="bg-[#1C2C3F] border border-[#27405A] text-white hover:bg-[#27405A] px-10 py-6 text-base"
                        >
                            check
                        </Button>
                    </CardFooter>
                </div>

                {/* === القسم الأيمن: الرسم البياني التوضيحي (Placeholder) === */}
                {/* هذا القسم يستخدم flexbox لمحاكاة الجانب الرسومي المضيء */}
                <div className="relative flex items-center justify-center p-4">
                    <div
                        className="w-full h-full min-h-[400px] rounded-xl flex items-center justify-center p-8 lg:p-12"
                        // استخدام تدرج لوني أو ظل صندوقي محدد لمحاكاة توهج النيون الأزرق
                        style={{
                            backgroundColor: '#020C19',
                            border: '1px solid rgba(0, 191, 255, 0.3)', // حدود خفيفة
                            boxShadow: '0 0 25px rgba(0, 191, 255, 0.2) inset' // ظل داخلي للتوهج
                        }}
                    >
                        <Image alt={"student"} src={image} width={500} height={500} />
                    </div>
                </div>

            </div>
            </motion.div>
        </Card>
    )
}

export default BigFeatureCard;