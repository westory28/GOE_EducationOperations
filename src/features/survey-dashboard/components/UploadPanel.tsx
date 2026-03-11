import React, { useRef } from 'react';
import type { DashboardDataset } from '../types';

interface UploadPanelProps {
    dataset: DashboardDataset;
    uploading: boolean;
    onUpload: (file: File) => Promise<void>;
    onResetMock: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ dataset, uploading, onUpload, onResetMock }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <section className="panel-card">
            <div className="card-header">
                <div>
                    <span className="section-kicker">데이터 소스</span>
                    <h2>엑셀 더미데이터 업로드</h2>
                </div>
            </div>

            <p className="panel-copy">
                현재는 엑셀 파일을 읽어 분석하고, 나중에 파이어스토어로 교체하기 쉽도록 데이터 호출 로직을 비동기 함수로 분리해 두었습니다.
            </p>

            <div className="upload-actions">
                <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()} disabled={uploading}>
                    {uploading ? '엑셀 분석 중...' : '엑셀 업로드'}
                </button>
                <button type="button" className="ghost-button" onClick={onResetMock} disabled={uploading}>
                    더미 데이터로 되돌리기
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void onUpload(file);
                    event.target.value = '';
                }}
            />

            <div className="upload-hints">
                <div className="hint-item">`사전 설문` / `사후 설문` 시트 우선 지원</div>
                <div className="hint-item">`전체 평균`, `학교명`, `이름`, `전화번호` 또는 `고유번호` 열 자동 탐지</div>
                <div className="hint-item">전화번호가 없으면 1000번대 임시 번호를 자동 부여</div>
            </div>

            <div className="dataset-mini-card">
                <strong>{dataset.summary.sourceLabel}</strong>
                <p>
                    평균 {dataset.summary.preAverage.toFixed(2)} → {dataset.summary.postAverage.toFixed(2)}
                </p>
            </div>
        </section>
    );
};
