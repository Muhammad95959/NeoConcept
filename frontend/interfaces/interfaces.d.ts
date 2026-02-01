interface Track {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    deletedAt: null | Date;
    courses: Course[];
}

interface Course {
    createdAt: Date;
    deletedAt: null | Date;
    description: string;
    id: string;
    name: string;
    trackId: string;
}