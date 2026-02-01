import { useState } from 'react'
import Sidebar from '@/components/dashboard/SideBar'
import {Roboto} from "next/font/google";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"] });

type Section =
    | 'Subjects'
    | 'Notifications'
    | 'Posts'
    | 'Analytics'
    | 'Math'
    | 'Physics'
    | 'Chemistry'
    | 'Biology'
    | 'English'
    | 'History'
    | 'Computer Science'

const DashboardPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<Section>('Subjects')

    const content: Record<Section, JSX.Element> = {
        Subjects: <div className="bg-white p-4 rounded shadow">Select a subject</div>,
        Notifications: <div className="bg-white p-4 rounded shadow">You have 3 new notifications!</div>,
        Posts: <div className="bg-white p-4 rounded shadow">Latest posts from your courses.</div>,
        Analytics: <div className="bg-white p-4 rounded shadow">Your analytics dashboard.</div>,
        Math: <div className="bg-white p-4 rounded shadow">Math content here...</div>,
        Physics: <div className="bg-white p-4 rounded shadow">Physics content here...</div>,
        Chemistry: <div className="bg-white p-4 rounded shadow">Chemistry content here...</div>,
        Biology: <div className="bg-white p-4 rounded shadow">Biology content here...</div>,
        English: <div className="bg-white p-4 rounded shadow">English content here...</div>,
        History: <div className="bg-white p-4 rounded shadow">History content here...</div>,
        'Computer Science': <div className="bg-white p-4 rounded shadow">Computer Science content here...</div>,
    }

    return (
        <div className={`${roboto.className} flex bg-[var(--color-background)] min-h-screen`}>
            <Sidebar onSelect={setActiveSection} />
            <main className="flex-1 p-6">
                <h2 className={`${roboto.className} text-[var(--color-primary)] text-3xl font-bold mb-6`}>
                    {activeSection}
                </h2>
                {content[activeSection]}
            </main>
        </div>
    )
}

export default DashboardPage
