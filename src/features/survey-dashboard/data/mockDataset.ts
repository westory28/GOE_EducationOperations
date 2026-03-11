import type { DashboardDataset } from '../types';

export const mockDataset: DashboardDataset = {
    sourceLabel: '기본 더미 데이터',
    participants: [
        {
            traineeId: '5862',
            name: '정미리',
            organization: '원당초',
            trackLabel: 'AI·디지털 아카데미 기본 과정',
            preOverall: 3.58,
            postOverall: 4.59,
            growth: 1.01,
            cohortGapPost: 0,
            competencies: [
                { label: '컴퓨팅 사고력', pre: 3.6, post: 4.63, preAverage: 3.6, postAverage: 4.63, growth: 1.03 },
                { label: '인공지능 활용', pre: 3.56, post: 4.55, preAverage: 3.56, postAverage: 4.55, growth: 0.99 }
            ]
        },
        {
            traineeId: '2147',
            name: '김하늘',
            organization: '도담중',
            trackLabel: 'AI·디지털 아카데미 기본 과정',
            preOverall: 3.3,
            postOverall: 4.2,
            growth: 0.9,
            cohortGapPost: -0.39,
            competencies: [
                { label: '컴퓨팅 사고력', pre: 3.1, post: 4.3, preAverage: 3.6, postAverage: 4.63, growth: 1.2 },
                { label: '인공지능 활용', pre: 3.5, post: 4.1, preAverage: 3.56, postAverage: 4.55, growth: 0.6 }
            ]
        },
        {
            traineeId: '9034',
            name: '이서윤',
            organization: '하늘고',
            trackLabel: 'AI·디지털 아카데미 심화 과정',
            preOverall: 4.1,
            postOverall: 4.8,
            growth: 0.7,
            cohortGapPost: 0.21,
            competencies: [
                { label: '컴퓨팅 사고력', pre: 4.2, post: 4.9, preAverage: 3.6, postAverage: 4.63, growth: 0.7 },
                { label: '인공지능 활용', pre: 4.0, post: 4.7, preAverage: 3.56, postAverage: 4.55, growth: 0.7 }
            ]
        }
    ],
    summary: {
        sourceFileName: 'mock-dataset.xlsx',
        sourceLabel: '기본 더미 데이터',
        importedAt: '2026-03-11T00:00:00.000Z',
        participantCount: 3,
        preAverage: 3.66,
        postAverage: 4.53,
        growthAverage: 0.87
    }
};
