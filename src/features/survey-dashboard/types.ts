export interface CompetencyScore {
    label: string;
    pre: number;
    post: number;
    preAverage: number;
    postAverage: number;
    growth: number;
}

export interface ParticipantRecord {
    traineeId: string;
    courseId: string;
    name: string;
    organization: string;
    trackLabel: string;
    preOverall: number;
    postOverall: number;
    growth: number;
    cohortGapPost: number;
    competencies: CompetencyScore[];
}

export interface CourseSummary {
    id: string;
    label: string;
    participantCount: number;
}

export interface DatasetSummary {
    sourceFileName: string;
    sourceLabel: string;
    importedAt: string;
    participantCount: number;
    preAverage: number;
    postAverage: number;
    growthAverage: number;
    courses: CourseSummary[];
}

export interface DashboardDataset {
    participants: ParticipantRecord[];
    sourceLabel: string;
    summary: DatasetSummary;
}

export interface AdviceBlock {
    title: string;
    summary: string;
    points: string[];
}
