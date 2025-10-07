"use client";
import Link from "next/link";
import Image from "next/image";
import { Roboto } from "next/font/google";
import { motion } from "framer-motion"; // <-- Add this import

const roboto = Roboto({ subsets: ["latin"], weight: ["700"] });

interface IProps {

}
const options = {
  method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTc1OTg2NzkzOCwiZXhwIjoxNzYyNDU5OTM4fQ.KRGFpBcezIJIV55ueUYYN9OoTKmgAo1xoo7cfZ2sUNQ",
        
      },
      body: JSON.stringify({name: "DSP"})
}

const Hero = ({}: IProps) => {
  
  const fetchDemo = async () => {
    fetch('http://localhost:9595/api/v1/subjects/create', 
      options
    )
    .then(res => res.json())
    .then(data => console.log(data));
  }
  return (
      <section className="container mx-auto flex flex-col md:flex-row md:justify-evenly md:items-center gap-4 text-white mb-16 md:mb-32">
        <motion.div
          className="flex flex-col justify-between max-w-92 h-100"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className={`${roboto.className} text-4xl md:text-5xl bg-gradient-to-r from-[#B5E0FF] to-[#63A5FB] bg-clip-text text-transparent`}>
            Learn Smarter With AI and Your Mentors
          </h1>
          <h2>
            Personalized and Academic Professional Courses Powered by Artificial Intelligence to Help You Reach Your Goal Faster
          </h2>
          <div className="flex gap-4">
            <Link href="signup" className="bg-secondary p-4 rounded">Get Started Free</Link>
            <Link href="/demo" className="bg-[#191F40]/70 p-4 rounded">Watch Demo</Link>
            <button onClick={fetchDemo}>Fetch</button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        >
          <Image alt="hero image" src="/hero_image.png" width={690} height={496} />
        </motion.div>
      </section>
  );
}

export default Hero;