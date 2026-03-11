import React, { useEffect, useMemo, useState } from 'react';
import './assets/dashboard.css';
import type { DashboardDataset, ParticipantRecord } from './features/survey-dashboard/types';
import { getAdviceForParticipant, loadMockDataset } from './features/survey-dashboard/services/traineeData';
import { downloadParticipantReport } from './features/survey-dashboard/services/reportExport';
import { LoginPanel } from './features/survey-dashboard/components/LoginPanel';
import { ScoreComparisonChart } from './features/survey-dashboard/components/ScoreComparisonChart';

const App: React.FC = () => {
    const [dataset] = useState<DashboardDataset>(loadMockDataset());
    const [inputId, setInputId] = useState('');
    const [loggedInId, setLoggedInId] = useState<string | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState('');

    const participant = useMemo<ParticipantRecord | null>(() => {
        if (!loggedInId) return null;
        return dataset.participants.find((item) => item.traineeId === loggedInId) ?? null;
    }, [dataset.participants, loggedInId]);

    const courses = useMemo(
        () =>
            dataset.summary.courses.map((course) => ({
                ...course,
                participants: dataset.participants.filter((item) => item.courseId === course.id),
            })),
        [dataset],
    );

    useEffect(() => {
        if (!participant) return;
        setSelectedCourseId(participant.courseId);
        setSelectedParticipantId(participant.traineeId);
    }, [participant]);

    const activeCourse = useMemo(() => courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null, [courses, selectedCourseId]);

    const activeParticipant = useMemo(() => {
        if (!activeCourse) return participant;
        return activeCourse.participants.find((item) => item.traineeId === selectedParticipantId) ?? participant;
    }, [activeCourse, participant, selectedParticipantId]);

    const advice = activeParticipant ? getAdviceForParticipant(activeParticipant) : null;

    const courseAverages = useMemo(() => {
        if (!activeCourse) return null;
        const list = activeCourse.participants;
        const preAverage = list.reduce((sum, item) => sum + item.preOverall, 0) / list.length;
        const postAverage = list.reduce((sum, item) => sum + item.postOverall, 0) / list.length;
        const growthAverage = list.reduce((sum, item) => sum + item.growth, 0) / list.length;
        return { preAverage, postAverage, growthAverage };
    }, [activeCourse]);

    const handleLogin = () => {
        const normalized = inputId.replace(/\D/g, '').slice(0, 4);
        if (normalized.length !== 4) {
            setErrorMessage('고유번호 4자리를 입력해 주세요.');
            return;
        }

        const matched = dataset.participants.find((item) => item.traineeId === normalized);
        if (!matched) {
            setErrorMessage('테스트용 더미 데이터에서는 0001부터 등록된 연수생만 조회할 수 있습니다.');
            return;
        }

        setLoggedInId(normalized);
        setSelectedCourseId(matched.courseId);
        setSelectedParticipantId(matched.traineeId);
        setInputId(normalized);
        setErrorMessage('');
    };

    const handleBackToLogin = () => {
        setLoggedInId(null);
        setInputId('');
        setErrorMessage('');
    };

    const handleParticipantSelect = (nextParticipant: ParticipantRecord) => {
        setSelectedParticipantId(nextParticipant.traineeId);
        setSelectedCourseId(nextParticipant.courseId);
    };

    const handleDownload = () => {
        if (!activeParticipant) return;
        downloadParticipantReport(activeParticipant, dataset.summary);
    };

    if (!participant) {
        return (
            <div className="survey-app-shell login-shell">
                <div className="survey-background-glow survey-background-glow-left" />
                <div className="survey-background-glow survey-background-glow-right" />

                <main className="login-page">
                    <section className="login-hero-card">
                        <span className="hero-badge">Hi-Cycle Mock Dashboard</span>
                        <h1>교원 연수 결과 확인</h1>
                        <p>
                            고유번호 4자리를 입력하면 더미데이터 기반 분석 화면으로 이동합니다.
                            현재는 테스트 모드이며 `0001`, `0002`, `0003`, `0004`처럼 바로 확인할 수 있습니다.
                        </p>

                        <LoginPanel
                            inputId={inputId}
                            errorMessage={errorMessage}
                            datasetLabel="더미 데이터 테스트 모드"
                            participantCount={dataset.participants.length}
                            onChangeInput={setInputId}
                            onLogin={handleLogin}
                        />
                    </section>
                </main>
            </div>
        );
    }

    if (!activeParticipant || !activeCourse || !courseAverages) return null;

    return (
        <div className="survey-app-shell dashboard-shell">
            <aside className="dashboard-sidebar">
                <div className="brand-card">
                    <div className="brand-mark">학</div>
                    <div>
                        <h1>Hi-Cycle 역량 진단 대시보드</h1>
                        <p>경기도교육청 AI·디지털 미래형 교원연수 사전·사후 변화 분석</p>
                    </div>
                </div>

                <section className="sidebar-card">
                    <span className="sidebar-title">연수 과정 선택</span>
                    <div className="sidebar-list">
                        {courses.map((course) => (
                            <button
                                key={course.id}
                                type="button"
                                className={`sidebar-item ${course.id === activeCourse.id ? 'is-active' : ''}`}
                                onClick={() => {
                                    setSelectedCourseId(course.id);
                                    setSelectedParticipantId(course.participants[0]?.traineeId ?? activeParticipant.traineeId);
                                }}
                            >
                                <strong>{course.label}</strong>
                                <span>{course.participants.length}명</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="sidebar-card">
                    <span className="sidebar-title">교사 선택</span>
                    <div className="sidebar-list compact">
                        <button
                            type="button"
                            className={`sidebar-item ${activeParticipant.traineeId === participant.traineeId ? 'is-accent' : ''}`}
                            onClick={() => handleParticipantSelect(participant)}
                        >
                            <strong>내 결과로 돌아가기</strong>
                            <span>{participant.name}</span>
                        </button>
                        {activeCourse.participants.map((item) => (
                            <button
                                key={item.traineeId}
                                type="button"
                                className={`sidebar-item ${item.traineeId === activeParticipant.traineeId ? 'is-active' : ''}`}
                                onClick={() => handleParticipantSelect(item)}
                            >
                                <strong>{item.name}</strong>
                                <span>{item.organization}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </aside>

            <main className="dashboard-main">
                <section className="dashboard-hero">
                    <div>
                        <span className="hero-chip">{activeCourse.label}</span>
                        <h2>{activeParticipant.name} 분석 리포트</h2>
                        <p>
                            참여 인원 {activeCourse.participants.length}명 · 역량 영역 {activeParticipant.competencies.length}개 ·
                            조회 번호 {activeParticipant.traineeId}
                        </p>
                    </div>
                    <div className="hero-actions">
                        <button type="button" className="ghost-button light" onClick={handleBackToLogin}>
                            로그인 화면
                        </button>
                        <button type="button" className="primary-button" onClick={handleDownload}>
                            결과지 다운로드
                        </button>
                    </div>
                </section>

                <section className="dashboard-metrics">
                    <article className="dark-metric-card">
                        <span>나의 사전 평균</span>
                        <strong>{activeParticipant.preOverall.toFixed(2)}</strong>
                        <p>과정 평균 {courseAverages.preAverage.toFixed(2)}</p>
                    </article>
                    <article className="dark-metric-card">
                        <span>나의 사후 평균</span>
                        <strong>{activeParticipant.postOverall.toFixed(2)}</strong>
                        <p>과정 평균 {courseAverages.postAverage.toFixed(2)}</p>
                    </article>
                    <article className="dark-metric-card">
                        <span>성장 폭</span>
                        <strong className={activeParticipant.growth >= 0 ? 'metric-up' : 'metric-down'}>
                            {activeParticipant.growth >= 0 ? '+' : ''}
                            {activeParticipant.growth.toFixed(2)}
                        </strong>
                        <p>과정 평균 {courseAverages.growthAverage.toFixed(2)}</p>
                    </article>
                    <article className="dark-metric-card">
                        <span>전체 평균 대비</span>
                        <strong className={activeParticipant.cohortGapPost >= 0 ? 'metric-up' : 'metric-down'}>
                            {activeParticipant.cohortGapPost >= 0 ? '+' : ''}
                            {activeParticipant.cohortGapPost.toFixed(2)}
                        </strong>
                        <p>{activeParticipant.organization}</p>
                    </article>
                </section>

                <section className="insight-layout">
                    <section className="chart-panel">
                        <div className="panel-heading">
                            <div>
                                <span className="panel-kicker">종합 레이더</span>
                                <h3>역량별 사전·사후 레이더 - {activeParticipant.name} vs 전체</h3>
                                <p>5점 리커트 척도 기준 · 더미데이터 기반 비교</p>
                            </div>
                            <div className="panel-tags">
                                <span>과정 비교</span>
                                <span>개인 성장</span>
                                <span>전체 평균</span>
                            </div>
                        </div>

                        <ScoreComparisonChart participant={activeParticipant} />
                    </section>

                    <section className="insight-card insight-card-side">
                        <span className="panel-kicker">고정 피드백</span>
                        <h3>{advice?.title}</h3>
                        <p className="insight-summary">{advice?.summary}</p>
                        <div className="insight-list">
                            {advice?.points.map((point) => (
                                <div key={point} className="insight-item">
                                    {point}
                                </div>
                            ))}
                        </div>
                    </section>
                </section>

                <section className="bottom-grid">
                    <section className="competency-grid">
                        {activeParticipant.competencies.map((competency) => (
                            <article key={competency.label} className="competency-card-dark">
                                <span className="competency-icon">역</span>
                                <strong>{competency.label}</strong>
                                <div className="competency-values">
                                    <span>{competency.pre.toFixed(2)}</span>
                                    <em>→</em>
                                    <span>{competency.post.toFixed(2)}</span>
                                    <b className={competency.growth >= 0 ? 'metric-up' : 'metric-down'}>
                                        {competency.growth >= 0 ? '+' : ''}
                                        {competency.growth.toFixed(2)}
                                    </b>
                                </div>
                                <p>
                                    전체 평균 {competency.preAverage.toFixed(2)} → {competency.postAverage.toFixed(2)}
                                </p>
                            </article>
                        ))}
                    </section>
                </section>
            </main>
        </div>
    );
};

export default App;
