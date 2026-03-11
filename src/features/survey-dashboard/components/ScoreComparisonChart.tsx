import React from 'react';
import {
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    PointElement,
    RadialLinearScale,
    Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { ParticipantRecord } from '../types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ScoreComparisonChartProps {
    participant: ParticipantRecord;
}

export const ScoreComparisonChart: React.FC<ScoreComparisonChartProps> = ({ participant }) => {
    const competencyLabels = participant.competencies.map((item) => item.label);
    const labels = competencyLabels.length >= 3 ? competencyLabels : [...competencyLabels, '종합 평균'];
    const withOverall = (values: number[], overallValue: number) => (competencyLabels.length >= 3 ? values : [...values, overallValue]);
    const cohortPostOverall = participant.postOverall - participant.cohortGapPost;
    const cohortPreOverall = participant.preOverall - participant.cohortGapPost;

    return (
        <div className="chart-wrap radar-wrap">
            <Radar
                data={{
                    labels,
                    datasets: [
                        {
                            label: '전체 사전',
                            data: withOverall(
                                participant.competencies.map((item) => item.preAverage),
                                cohortPreOverall,
                            ),
                            borderColor: '#6f7bff',
                            backgroundColor: 'rgba(111, 123, 255, 0.14)',
                            pointBackgroundColor: '#6f7bff',
                            pointBorderColor: '#ffffff',
                            pointRadius: 3,
                            borderWidth: 2,
                        },
                        {
                            label: '전체 사후',
                            data: withOverall(
                                participant.competencies.map((item) => item.postAverage),
                                cohortPostOverall,
                            ),
                            borderColor: '#17d6a3',
                            backgroundColor: 'rgba(23, 214, 163, 0.12)',
                            pointBackgroundColor: '#17d6a3',
                            pointBorderColor: '#ffffff',
                            pointRadius: 3,
                            borderWidth: 2,
                        },
                        {
                            label: '나의 사전',
                            data: withOverall(
                                participant.competencies.map((item) => item.pre),
                                participant.preOverall,
                            ),
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            pointBackgroundColor: '#f59e0b',
                            pointBorderColor: '#ffffff',
                            pointRadius: 3,
                            borderWidth: 2,
                            borderDash: [6, 4],
                        },
                        {
                            label: '나의 사후',
                            data: withOverall(
                                participant.competencies.map((item) => item.post),
                                participant.postOverall,
                            ),
                            borderColor: '#ff4db8',
                            backgroundColor: 'rgba(255, 77, 184, 0.12)',
                            pointBackgroundColor: '#ff4db8',
                            pointBorderColor: '#ffffff',
                            pointRadius: 3,
                            borderWidth: 2,
                        },
                    ],
                }}
                options={{
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#7b8ca8',
                                usePointStyle: true,
                                boxWidth: 10,
                            },
                        },
                    },
                    scales: {
                        r: {
                            min: 0,
                            max: 5,
                            ticks: {
                                stepSize: 1,
                                color: '#8a9ab2',
                                backdropColor: 'rgba(255, 255, 255, 0.9)',
                            },
                            angleLines: {
                                color: 'rgba(148, 163, 184, 0.3)',
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.3)',
                            },
                            pointLabels: {
                                color: '#5d708f',
                                font: {
                                    size: 14,
                                    weight: 600,
                                },
                            },
                        },
                    },
                }}
            />
        </div>
    );
};
