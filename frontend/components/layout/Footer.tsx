"use client"

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Github, Linkedin, Twitter } from "lucide-react"
import Image from "next/image"

import { Roboto } from "next/font/google";

const roboto = Roboto({ subsets: ["latin"], weight: ["700"] });

export default function Footer() {
    return (
        <footer className="w-full bg-main text-gray-400">
            <div className="max-w-7xl mx-auto bg-gradient-to-r from-[#55ADFF] to-[#666666] pt-[1px] pb-0">
            <div className="max-w-7xl bg-main mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">


                <div>
                    <div className="flex items-center">
                        <Image src="/logo.png" alt="logo" width={60} height={60} />
                        <h1 className={`${roboto.className} font-bold text-3xl font-roboto hidden md:block`}>eoConcept</h1>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 max-w-sm">
                        Personalized and Academic Professional Courses powered by AI to help you
                        reach your goals faster.
                    </p>
                </div>


                <div className="flex flex-col space-y-2 text-sm">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#students" className="hover:text-white transition-colors">For Student</a>
                    <a href="#instructors" className="hover:text-white transition-colors">For Instructor</a>
                    <a href="#qa" className="hover:text-white transition-colors">Q&A</a>
                    <a href="#accessibility" className="hover:text-white transition-colors">Accessibility</a>
                </div>

                {/* Social Links */}
                <div>
                    <p className="text-sm font-medium mb-4 text-gray-300">Follow us</p>
                    <div className="flex space-x-3">
                        <Button variant="ghost" size="icon" asChild>
                            <a href="#">
                                <Twitter className="w-5 h-5" />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <a href="#">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <a href="#">
                                <Github className="w-5 h-5" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>



            {/* Bottom Footer */}
            <div className="max-w-7xl bg-main mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                <p>© {new Date().getFullYear()} NeoConcept. All rights reserved.</p>

            </div>
            </div>
        </footer>
    )
}
