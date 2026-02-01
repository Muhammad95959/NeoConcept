import React, { useState } from 'react'

interface SidebarProps {
    onSelect: (section: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
    const [openSubjects, setOpenSubjects] = useState(false)

    const menuItems = [
        { name: 'Subjects', icon: '📚', hasDrawer: true },
        { name: 'Notifications', icon: '🔔' },
        { name: 'Posts', icon: '📝' },
        { name: 'Analytics', icon: '📊' },
    ]

    const subjects = [
        'Math',
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'History',
        'Computer Science',
    ]

    return (
        <aside className="bg-[var(--color-primary)] text-white w-64 min-h-screen p-6 flex flex-col">
            <h1 className="text-2xl font-bold mb-10">Dashboard</h1>
            <ul className="space-y-2">
                {menuItems.map((item) => (
                    <React.Fragment key={item.name}>
                        <li
                            className={`flex items-center gap-3 cursor-pointer hover:bg-[var(--color-secondary)] px-3 py-2 rounded transition ${
                                item.hasDrawer ? 'justify-between' : ''
                            }`}
                            onClick={() => {
                                if (item.hasDrawer) {
                                    setOpenSubjects(!openSubjects)
                                } else {
                                    onSelect(item.name)
                                }
                            }}
                        >
              <span className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </span>
                            {item.hasDrawer && <span>{openSubjects ? '▼' : '▶'}</span>}
                        </li>

                        {/* Drawer for Subjects */}
                        {item.hasDrawer && openSubjects && (
                            <ul className="ml-6 mt-1 space-y-1">
                                {subjects.map((subj) => (
                                    <li
                                        key={subj}
                                        className="px-3 py-1 rounded cursor-pointer hover:bg-[var(--color-secondary)] transition"
                                        onClick={() => onSelect(subj)}
                                    >
                                        {subj}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </React.Fragment>
                ))}
            </ul>
        </aside>
    )
}

export default Sidebar
