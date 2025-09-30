import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import Image from "next/image";
import {Roboto} from "next/font/google";
const roboto = Roboto({ subsets: ["latin"], weight: ["700"] });

interface IProps {
    title: string;
    description: string;
    imageUrl: string;
}
const FeatureCard = ({title, description, imageUrl}: IProps) => {
  return (
      <Card className={"max-w-80 min-h-90 md:max-w-92.5 lg:min-h-64 flex flex-col justify-evenly gap-4 relative bg-[#191F40]/70 border border-[#9FCCFF]"}>
          <CardHeader>
              <div className={"w-12 h-12 rounded-full overflow-hidden  bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center absolute -top-6 left-7"}>
                  <Image src={imageUrl} alt={title} width={60} height={60}/>
              </div>
              <CardTitle className={`${roboto.className} text-[#EDFEFF] font-bold text-2xl`}>{title}</CardTitle>
          </CardHeader>
          <CardContent>
              <p className={"text-[#EDFEFF] text-base font-bold overflow-hidden"}>
                  {description}
              </p>
          </CardContent>
      </Card>
  );
}

export default FeatureCard;