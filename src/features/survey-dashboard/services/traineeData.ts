import * as XLSX from 'xlsx';
import { mockDataset } from '../data/mockDataset';
import type { AdviceBlock, CompetencyScore, DashboardDataset, ParticipantRecord } from '../types';

type GenericRow = Record<string, unknown>;

const PRE_SHEET_CANDIDATES = ['사전 설문', '사전', 'pre'];
const POST_SHEET_CANDIDATES = ['사후 설문', '사후', 'post'];
const ID_HEADER_CANDIDATES = ['고유번호', '고유 번호', '전화번호(뒤4자리)', '전화번호', 'id', 'ID'];
const NAME_HEADER_CANDIDATES = ['이름', '성명', 'name'];
const ORG_HEADER_CANDIDATES = ['학교명', '학교', '소속', '기관명'];
const TRACK_HEADER_CANDIDATES = ['연수과정명', '과정명', 'track', '과정'];
const OVERALL_HEADER_CANDIDATES = ['전체 평균', '나의 평균', 'overall', 'overall average', '사전 평균', '사후 평균'];

const normalizeHeader = (value: unknown) => String(value ?? '').replace(/\s+/g, '').toLowerCase();

const findSheetName = (sheetNames: string[], candidates: string[]) =>
    sheetNames.find((name) => candidates.some((candidate) => normalizeHeader(name).includes(normalizeHeader(candidate))));

const findHeaderKey = (row: GenericRow, candidates: string[]) => {
    const keys = Object.keys(row);
    return keys.find((key) => candidates.some((candidate) => normalizeHeader(key) === normalizeHeader(candidate) || normalizeHeader(key).includes(normalizeHeader(candidate))));
};

const toNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
};

const round = (value: number) => Math.round(value * 100) / 100;

const formatSequentialId = (index: number): string => String(index + 1).padStart(4, '0');

const lastFourDigits = (value: unknown): string => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.slice(-4).padStart(4, '0');
};

const average = (values: number[]) => {
    if (values.length === 0) return 0;
    return round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const getCompetencyColumns = (row: GenericRow) =>
    Object.keys(row).filter((key) => {
        const normalized = normalizeHeader(key);
        return normalized.includes('평균') && !OVERALL_HEADER_CANDIDATES.some((candidate) => normalized.includes(normalizeHeader(candidate)));
    });

const cleanCompetencyLabel = (header: string) =>
    header
        .replace(/\s*평균\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim();

const buildMatchKey = (row: GenericRow, index: number) => {
    const idKey = findHeaderKey(row, ID_HEADER_CANDIDATES);
    const nameKey = findHeaderKey(row, NAME_HEADER_CANDIDATES);
    const orgKey = findHeaderKey(row, ORG_HEADER_CANDIDATES);

    const id = lastFourDigits(idKey ? row[idKey] : '');
    if (id) return `id:${id}`;

    const name = String(nameKey ? row[nameKey] ?? '' : '').trim();
    const organization = String(orgKey ? row[orgKey] ?? '' : '').trim();
    if (name || organization) return `person:${name}|${organization}`;

    return `row:${index}`;
};

const parsePrePostWorkbook = (workbook: XLSX.WorkBook, fileName: string): DashboardDataset => {
    const preSheetName = findSheetName(workbook.SheetNames, PRE_SHEET_CANDIDATES);
    const postSheetName = findSheetName(workbook.SheetNames, POST_SHEET_CANDIDATES);

    if (!preSheetName || !postSheetName) {
        throw new Error('사전/사후 시트를 찾지 못했습니다. `사전 설문`, `사후 설문` 형식 또는 유사한 시트명을 확인해 주세요.');
    }

    const preRows = XLSX.utils.sheet_to_json<GenericRow>(workbook.Sheets[preSheetName], { defval: '' });
    const postRows = XLSX.utils.sheet_to_json<GenericRow>(workbook.Sheets[postSheetName], { defval: '' });

    if (preRows.length === 0 || postRows.length === 0) {
        throw new Error('사전 또는 사후 시트에 분석 가능한 데이터가 없습니다.');
    }

    const preMap = new Map(preRows.map((row, index) => [buildMatchKey(row, index), row]));
    const postMap = new Map(postRows.map((row, index) => [buildMatchKey(row, index), row]));
    const keys = Array.from(new Set([...preMap.keys(), ...postMap.keys()]));

    const participants: ParticipantRecord[] = keys
        .map((key, index) => {
            const preRow = preMap.get(key);
            const postRow = postMap.get(key);
            if (!preRow || !postRow) return null;

            const preOverallKey = findHeaderKey(preRow, OVERALL_HEADER_CANDIDATES);
            const postOverallKey = findHeaderKey(postRow, OVERALL_HEADER_CANDIDATES);
            const nameKey = findHeaderKey(postRow, NAME_HEADER_CANDIDATES) ?? findHeaderKey(preRow, NAME_HEADER_CANDIDATES);
            const orgKey = findHeaderKey(postRow, ORG_HEADER_CANDIDATES) ?? findHeaderKey(preRow, ORG_HEADER_CANDIDATES);
            const idKey = findHeaderKey(postRow, ID_HEADER_CANDIDATES) ?? findHeaderKey(preRow, ID_HEADER_CANDIDATES);
            const trackKey = findHeaderKey(postRow, TRACK_HEADER_CANDIDATES) ?? findHeaderKey(preRow, TRACK_HEADER_CANDIDATES);

            const preOverall = toNumber(preOverallKey ? preRow[preOverallKey] : '');
            const postOverall = toNumber(postOverallKey ? postRow[postOverallKey] : '');

            if (preOverall === null || postOverall === null) return null;

            const competencyHeaders = Array.from(new Set([...getCompetencyColumns(preRow), ...getCompetencyColumns(postRow)]));
            const competencies: CompetencyScore[] = competencyHeaders
                .map((header) => {
                    const pre = toNumber(preRow[header]);
                    const post = toNumber(postRow[header]);
                    if (pre === null || post === null) return null;

                    return {
                        label: cleanCompetencyLabel(header),
                        pre,
                        post,
                        preAverage: 0,
                        postAverage: 0,
                        growth: round(post - pre)
                    };
                })
                .filter((item): item is CompetencyScore => item !== null);

            return {
                traineeId: formatSequentialId(index),
                name: String(nameKey ? postRow[nameKey] ?? preRow[nameKey] ?? '' : '').trim() || `연수생 ${index + 1}`,
                organization: String(orgKey ? postRow[orgKey] ?? preRow[orgKey] ?? '' : '').trim() || '소속 미입력',
                trackLabel: String(trackKey ? postRow[trackKey] ?? preRow[trackKey] ?? '' : '').trim() || '연수 과정',
                preOverall,
                postOverall,
                growth: round(postOverall - preOverall),
                cohortGapPost: 0,
                competencies
            };
        })
        .filter((item): item is ParticipantRecord => item !== null);

    if (participants.length === 0) {
        throw new Error('사전/사후 행을 서로 매칭하지 못했습니다. 이름 또는 전화번호/고유번호 열을 확인해 주세요.');
    }

    const cohortPostAverage = average(participants.map((participant) => participant.postOverall));

    const competencyAverages = new Map<string, { preAverage: number; postAverage: number }>();
    const competencyLabels = Array.from(new Set(participants.flatMap((participant) => participant.competencies.map((item) => item.label))));
    competencyLabels.forEach((label) => {
        const preValues = participants
            .map((participant) => participant.competencies.find((item) => item.label === label)?.pre ?? null)
            .filter((value): value is number => value !== null);
        const postValues = participants
            .map((participant) => participant.competencies.find((item) => item.label === label)?.post ?? null)
            .filter((value): value is number => value !== null);

        competencyAverages.set(label, {
            preAverage: average(preValues),
            postAverage: average(postValues)
        });
    });

    const normalizedParticipants = participants.map((participant) => ({
        ...participant,
        cohortGapPost: round(participant.postOverall - cohortPostAverage),
        competencies: participant.competencies.map((competency) => ({
            ...competency,
            preAverage: competencyAverages.get(competency.label)?.preAverage ?? 0,
            postAverage: competencyAverages.get(competency.label)?.postAverage ?? 0
        }))
    }));

    return {
        participants: normalizedParticipants,
        sourceLabel: fileName,
        summary: {
            sourceFileName: fileName,
            sourceLabel: fileName,
            importedAt: new Date().toISOString(),
            participantCount: normalizedParticipants.length,
            preAverage: average(normalizedParticipants.map((participant) => participant.preOverall)),
            postAverage: cohortPostAverage,
            growthAverage: average(normalizedParticipants.map((participant) => participant.growth))
        }
    };
};

export const loadMockDataset = (): DashboardDataset => mockDataset;

export const loadDatasetFromWorkbook = async (file: File): Promise<DashboardDataset> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    return parsePrePostWorkbook(workbook, file.name);
};

export const getAdviceForParticipant = (participant: ParticipantRecord): AdviceBlock => {
    const { postOverall, growth, cohortGapPost } = participant;

    if (postOverall >= 4.5 && growth >= 0.6) {
        return {
            title: '확장 실천 단계',
            summary: '사후 점수와 성장 폭이 모두 높습니다. 개인 성과를 현장 적용 사례로 연결하기 좋은 구간입니다.',
            points: [
                '효과가 있었던 연수 활동을 1개 사례로 정리해 동료와 공유해 보세요.',
                '현재 강점 영역을 실제 수업 설계나 학교 운영 장면에 연결하면 성과가 더 선명해집니다.',
                '다음 차수에서는 본인의 강점을 유지하면서 상대적으로 덜 오른 영역을 보완하는 방식이 좋습니다.'
            ]
        };
    }

    if (postOverall >= 4 && growth >= 0.3) {
        return {
            title: '안정 성장 단계',
            summary: '사전 대비 향상이 확인되며, 연수 효과가 비교적 안정적으로 반영된 상태입니다.',
            points: [
                '사후 점수가 오른 원인을 활동 경험과 연결해 간단히 회고해 보세요.',
                '전체 평균과의 간격이 크지 않다면 다음 목표를 더 구체적인 실천 단위로 설정하는 것이 좋습니다.',
                '좋았던 연수 요소를 현장 적용 계획 1가지로 바로 옮기면 성장 유지에 도움이 됩니다.'
            ]
        };
    }

    if (growth > 0) {
        return {
            title: '기초 상승 단계',
            summary: '성장은 있었지만 아직 더 끌어올릴 여지가 큽니다. 작은 성공 경험을 반복하는 방식이 적합합니다.',
            points: [
                '가장 많이 오른 영역을 우선 강점으로 삼고, 남은 영역은 한 번에 하나씩 보완해 보세요.',
                '실습이나 적용 경험이 부족했다면 다음 연수에서는 직접 실행 과제를 늘리는 편이 좋습니다.',
                '전체 평균보다 낮더라도 상승 흐름이 있다는 점이 중요하므로 유지 전략을 먼저 세우는 것이 좋습니다.'
            ]
        };
    }

    if (cohortGapPost < 0) {
        return {
            title: '집중 보완 단계',
            summary: '사후 점수 정체 또는 하락이 보여 추가 지원이 필요한 구간입니다. 부담이 적은 보완 계획이 중요합니다.',
            points: [
                '사전보다 낮아진 영역이 있다면 문항 이해, 적용 경험, 실습 시간 부족 여부를 먼저 점검해 보세요.',
                '한 번에 전체를 올리기보다 핵심 영역 1개를 정해 짧은 실천 계획부터 시작하는 편이 효과적입니다.',
                '후속 연수나 지원 자료에서는 예시 중심 안내와 체크리스트형 지원이 특히 도움이 됩니다.'
            ]
        };
    }

    return {
        title: '유지 점검 단계',
        summary: '큰 변화는 아니지만 현재 수준을 점검하며 다음 목표를 정리하기에 적절한 상태입니다.',
        points: [
            '점수 변화가 작을 때는 학습량보다 실천 맥락과 적용 기회를 함께 살펴보는 것이 좋습니다.',
            '사전·사후 차이를 만든 연수 활동을 선별해 다음 연수 설계에 반영해 보세요.',
            '현재 결과를 기준선으로 삼아 다음 차수 목표 점수를 정하면 추적 관리가 쉬워집니다.'
        ]
    };
};
