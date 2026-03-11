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
    return (
        <div className="chart-wrap radar-wrap">
            <Radar
                data={{
                    labels: participant.competencies.map((item) => item.label),
                    datasets: [
                        {
                            label: '전체 사전',
                            data: participant.competencies.map((item) => item.preAverage),
                            borderColor: '#6f7bff',
                            backgroundColor: 'rgba(111, 123, 255, 0.16)',
                            pointBackgroundColor: '#6f7bff',
                        },
                        {
                            label: '전체 사후',
                            data: participant.competencies.map((item) => item.postAverage),
                            borderColor: '#17d6a3',
                            backgroundColor: 'rgba(23, 214, 163, 0.14)',
                            pointBackgroundColor: '#17d6a3',
                        },
                        {
                            label: '나의 사전',
                            data: participant.competencies.map((item) => item.pre),
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            pointBackgroundColor: '#f59e0b',
                            borderDash: [6, 4],
                        },
                        {
                            label: '나의 사후',
                            data: participant.competencies.map((item) => item.post),
                            borderColor: '#ff4db8',
                            backgroundColor: 'rgba(255, 77, 184, 0.14)',
                            pointBackgroundColor: '#ff4db8',
                        },
                    ],
                }}
                options={{
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#b7c4dd',
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
                                color: '#7f8ba8',
                                backdropColor: 'transparent',
                            },
                            angleLines: {
                                color: 'rgba(72, 92, 138, 0.45)',
                            },
                            grid: {
                                color: 'rgba(72, 92, 138, 0.45)',
                            },
                            pointLabels: {
                                color: '#dce7ff',
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
