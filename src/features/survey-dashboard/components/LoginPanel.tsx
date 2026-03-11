import React from 'react';

interface LoginPanelProps {
    inputId: string;
    errorMessage: string;
    datasetLabel: string;
    participantCount: number;
    onChangeInput: (value: string) => void;
    onLogin: () => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({
    inputId,
    errorMessage,
    datasetLabel,
    participantCount,
    onChangeInput,
    onLogin
}) => {
    return (
        <section className="panel-card">
            <div className="card-header">
                <div>
                    <span className="section-kicker">개인 조회</span>
                    <h2>고유번호 4자리 로그인</h2>
                </div>
            </div>

            <p className="panel-copy">이메일이나 소셜 로그인이 아니라 연수생 고유번호 4자리만으로 결과를 확인합니다.</p>

            <label className="input-label" htmlFor="trainee-id-input">
                고유번호
            </label>
            <input
                id="trainee-id-input"
                className="single-input"
                inputMode="numeric"
                maxLength={4}
                placeholder="예: 0001"
                value={inputId}
                onChange={(event) => onChangeInput(event.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') onLogin();
                }}
            />

            <button type="button" className="primary-button full-width" onClick={onLogin}>
                결과 보기
            </button>

            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

            <div className="subtle-meta">
                <span>현재 데이터: {datasetLabel}</span>
                <span>{participantCount}명 분석 가능</span>
            </div>
        </section>
    );
};
