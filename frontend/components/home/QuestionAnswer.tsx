import {
    Accordion,
    AccordionItem,
    AccordionContent,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
interface IProps {
    question: string;
    answer: string;
    value: string;
}
const QuestionAnswer = ({question, answer} : IProps) => {
    return (
        <div className="max-w-5xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    {/* override default chevron with our custom */}
                    <AccordionTrigger className="bg-[#191F40]/60 text-white px-4 py-3 flex justify-between items-center [&>svg]:hidden border border-[#59BAFF] rounded-xl">
                        <h2 className={"text-2xl"}>{question}</h2>
                        <span className="flex items-center justify-center w-6 h-6 md:w-15 md:h-15 rounded-full bg-white text-[#B4A7A7]">
              <ChevronDown className="h-5 w-5 text-black transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </span>
                    </AccordionTrigger>
                    <AccordionContent className="bg-[#191F40]/60 text-white px-4 py-3 rounded-lg mt-2  border border-[#59BAFF] rounded-xl">
                        <h3 className={"text-2xl"}>{answer}</h3>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
export default QuestionAnswer;