import React, { useMemo, useState } from 'react';
import './assets/dashboard.css';
import type { DashboardDataset, ParticipantRecord } from './features/survey-dashboard/types';
import { getAdviceForParticipant, loadDatasetFromWorkbook, loadMockDataset } from './features/survey-dashboard/services/traineeData';
import { downloadParticipantReport } from './features/survey-dashboard/services/reportExport';
import { LoginPanel } from './features/survey-dashboard/components/LoginPanel';
import { UploadPanel } from './features/survey-dashboard/components/UploadPanel';
import { ScoreComparisonChart } from './features/survey-dashboard/components/ScoreComparisonChart';

const App: React.FC = () => {
    const [dataset, setDataset] = useState<DashboardDataset>(loadMockDataset());
    const [inputId, setInputId] = useState('');
    const [loggedInId, setLoggedInId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const participant = useMemo<ParticipantRecord | null>(() => {
        if (!loggedInId) return null;
        return dataset.participants.find((item) => item.traineeId === loggedInId) ?? null;
    }, [dataset.participants, loggedInId]);

    const advice = participant ? getAdviceForParticipant(participant) : null;

    const handleLogin = () => {
        const normalized = inputId.replace(/\D/g, '').slice(0, 4);
        if (normalized.length !== 4) {
            setErrorMessage('고유번호 4자리를 입력해 주세요.');
            return;
        }

        const matched = dataset.participants.find((item) => item.traineeId === normalized);
        if (!matched) {
            setErrorMessage('해당 고유번호의 결과를 찾지 못했습니다. 업로드한 엑셀과 번호를 다시 확인해 주세요.');
            return;
        }

        setLoggedInId(normalized);
        setInputId(normalized);
        setErrorMessage('');
    };

    const handleWorkbookUpload = async (file: File) => {
        setUploading(true);
        setErrorMessage('');

        try {
            const nextDataset = await loadDatasetFromWorkbook(file);
            setDataset(nextDataset);
            setLoggedInId(null);
            setInputId('');
        } catch (error) {
            const message = error instanceof Error ? error.message : '엑셀을 분석하지 못했습니다.';
            setErrorMessage(message);
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = () => {
        if (!participant) return;
        downloadParticipantReport(participant, dataset.summary);
    };

    return (
        <div className="survey-app-shell">
            <div className="survey-background-glow survey-background-glow-left" />
            <div className="survey-background-glow survey-background-glow-right" />

            <main className="survey-page">
                <section className="hero-card">
                    <div className="hero-copy">
                        <span className="hero-badge">GOE Education Operations</span>
                        <h1>교원 연수 설문 결과 분석 대시보드</h1>
                        <p>
                            구글 로그인 없이 고유번호 4자리로 접속하고, 업로드한 엑셀 데이터를 바탕으로 사전·사후 변화와
                            연수생 전체 평균을 한 번에 비교합니다.
                        </p>
                    </div>

                    <div className="hero-side">
                        <div className="hero-pill">모바일 우선</div>
                        <div className="hero-pill">AI 호출 없음</div>
                        <div className="hero-pill">엑셀 업로드/다운로드</div>
                    </div>
                </section>

                <section className="top-grid">
                    <UploadPanel
                        dataset={dataset}
                        uploading={uploading}
                        onResetMock={() => {
                            setDataset(loadMockDataset());
                            setLoggedInId(null);
                            setInputId('');
                            setErrorMessage('');
                        }}
                        onUpload={handleWorkbookUpload}
                    />

                    <LoginPanel
                        inputId={inputId}
                        errorMessage={errorMessage}
                        datasetLabel={dataset.sourceLabel}
                        participantCount={dataset.participants.length}
                        onChangeInput={setInputId}
                        onLogin={handleLogin}
                    />
                </section>

                {participant ? (
                    <>
                        <section className="summary-grid">
                            <article className="metric-card">
                                <span className="metric-label">사전 평균</span>
                                <strong>{participant.preOverall.toFixed(2)}</strong>
                                <p>{participant.name}님의 시작 점수</p>
                            </article>

                            <article className="metric-card">
                                <span className="metric-label">사후 평균</span>
                                <strong>{participant.postOverall.toFixed(2)}</strong>
                                <p>현재 도달한 역량 수준</p>
                            </article>

                            <article className="metric-card">
                                <span className="metric-label">향상 폭</span>
                                <strong className={participant.growth >= 0 ? 'metric-positive' : 'metric-negative'}>
                                    {participant.growth >= 0 ? '+' : ''}
                                    {participant.growth.toFixed(2)}
                                </strong>
                                <p>사전 대비 변화량</p>
                            </article>

                            <article className="metric-card">
                                <span className="metric-label">전체 평균 대비</span>
                                <strong className={participant.cohortGapPost >= 0 ? 'metric-positive' : 'metric-negative'}>
                                    {participant.cohortGapPost >= 0 ? '+' : ''}
                                    {participant.cohortGapPost.toFixed(2)}
                                </strong>
                                <p>사후 기준 연수생 전체와의 차이</p>
                            </article>
                        </section>

                        <section className="chart-card">
                            <div className="card-header">
                                <div>
                                    <span className="section-kicker">핵심 비교</span>
                                    <h2>
                                        {participant.organization} · {participant.name} · {participant.traineeId}
                                    </h2>
                                </div>
                                <div className="profile-chip-group">
                                    <span className="profile-chip">{participant.trackLabel}</span>
                                    <span className="profile-chip">전체 {dataset.participants.length}명 비교</span>
                                </div>
                            </div>

                            <ScoreComparisonChart participant={participant} />
                        </section>

                        <section className="analysis-grid">
                            <article className="detail-card">
                                <div className="card-header">
                                    <div>
                                        <span className="section-kicker">영역 분석</span>
                                        <h2>세부 역량 변화</h2>
                                    </div>
                                </div>

                                <div className="competency-list">
                                    {participant.competencies.map((competency) => (
                                        <div key={competency.label} className="competency-row">
                                            <div>
                                                <strong>{competency.label}</strong>
                                                <p>
                                                    사전 {competency.pre.toFixed(2)} / 사후 {competency.post.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="competency-trend">
                                                <span>{competency.postAverage.toFixed(2)} 전체 평균</span>
                                                <strong className={competency.growth >= 0 ? 'metric-positive' : 'metric-negative'}>
                                                    {competency.growth >= 0 ? '+' : ''}
                                                    {competency.growth.toFixed(2)}
                                                </strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <article className="detail-card advice-card">
                                <div className="card-header">
                                    <div>
                                        <span className="section-kicker">고정 피드백</span>
                                        <h2>{advice?.title}</h2>
                                    </div>
                                </div>

                                <p className="advice-lead">{advice?.summary}</p>
                                <div className="advice-points">
                                    {advice?.points.map((point) => (
                                        <div key={point} className="advice-point">
                                            {point}
                                        </div>
                                    ))}
                                </div>
                                <div className="advice-note">
                                    AI를 호출하지 않고 점수 구간 조건문으로 생성된 안내입니다. 개인정보는 고유번호 4자리 기준으로만 조회합니다.
                                </div>
                            </article>
                        </section>

                        <section className="roadmap-card">
                            <div className="card-header">
                                <div>
                                    <span className="section-kicker">운영 흐름</span>
                                    <h2>연구사 협의 방향을 반영한 결과 확인 순서</h2>
                                </div>
                            </div>

                            <div className="roadmap-grid">
                                <div className="roadmap-step">
                                    <strong>1. 최소 정보 접속</strong>
                                    <p>이름이나 이메일 없이 고유번호 4자리만으로 본인 결과에 접근합니다.</p>
                                </div>
                                <div className="roadmap-step">
                                    <strong>2. 사전·사후 비교</strong>
                                    <p>개인 변화와 연수생 전체 평균을 같은 화면에서 직관적으로 확인합니다.</p>
                                </div>
                                <div className="roadmap-step">
                                    <strong>3. 정적 피드백 제공</strong>
                                    <p>비용이 들지 않는 규칙 기반 문구로 바로 실행 가능한 다음 실천을 제안합니다.</p>
                                </div>
                            </div>
                        </section>

                        <section className="download-card">
                            <div>
                                <span className="section-kicker">결과지 저장</span>
                                <h2>개인 분석 결과 엑셀 다운로드</h2>
                                <p>현재 화면의 핵심 수치와 세부 역량 변화를 `.xlsx` 파일로 내려받을 수 있습니다.</p>
                            </div>

                            <button type="button" className="primary-button" onClick={handleDownload}>
                                결과지 다운로드
                            </button>
                        </section>
                    </>
                ) : (
                    <section className="empty-state-card">
                        <span className="section-kicker">시작 안내</span>
                        <h2>엑셀을 올리고 고유번호 4자리를 입력하면 개인 분석 화면이 열립니다.</h2>
                        <p>
                            현재는 더미 데이터가 기본으로 들어 있습니다. 실제 파일은 사전/사후 시트의 `전체 평균`,
                            `학교명`, `이름`, `전화번호` 또는 `고유번호` 열을 우선 읽도록 만들어 두었습니다.
                        </p>
                    </section>
                )}
            </main>
        </div>
    );
};

export default App;
