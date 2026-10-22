// 기본 답변 양식 3개 — 앱 `web_estimate_template.dart` WebEstimateTemplate.defaultTemplates() 와 같은 글
//
// 양식을 하나도 만들지 않은 사장님도 답변할 수 있어야 한다. 서버에는 저장하지 않고
// 목록 맨 앞에 항상 끼워 넣는다(앱도 같은 방식). 기본 양식은 고치거나 지울 수 없다.
//
// 2026-10-23 사장님 요청 "지금은 너무 예제 같다, 바로 쓸 수 있게": 예전 글은 '항목 A · 옵션 1: 00,000원 ·
// 1주차~3주차' 같은 빈칸투성이라, 금액만 넣고 보내면 고객에게 '■ 서비스 내용 -' 빈 칸이 그대로 갔다.
// 이제 도배 견적 문장으로 쓰고, {지역} · {면적} 같은 칸은 답변할 때 요청 내용으로 채운다(answerTemplate.ts).

import type { BossTemplate } from '@/types/boss-templates';

const GREETING = '안녕하세요. 도배 견적 요청 주셔서 감사합니다.\n';

const REQUEST_BLOCK =
  '■ 요청하신 내용\n' +
  '- 시공 장소: {지역}\n' +
  '- 건물: {건물}\n' +
  '- 면적: {면적}\n' +
  '- 시공 범위: {범위}\n' +
  '- 벽지: {벽지}\n' +
  '- 천장: {천장}\n' +
  '- 희망 일정: {희망일}\n' +
  '- 추가 요청: {추가}\n' +
  '- 짐: {짐}\n';

const INCLUDED_BLOCK =
  '■ 견적에 포함된 내용\n' +
  '- 벽지 자재비와 시공 인건비\n' +
  '- 풀 · 마감재 등 부자재\n' +
  '- 바닥 · 가구 보양과 시공 후 청소\n' +
  '- 콘센트 · 스위치 덮개 떼고 다시 달기\n';

const NOTICE_BLOCK =
  '■ 안내\n' +
  '- 보내 주신 내용 기준 금액이며, 방문해서 벽 상태를 확인한 뒤 최종 금액을 확정해 드립니다.\n' +
  '- 곰팡이 · 들뜸 · 금 간 곳이 있으면 바탕 정리 비용이 더해질 수 있습니다.\n' +
  '- 시공 뒤 들뜸이나 이음매 벌어짐이 생기면 무상으로 손봐 드립니다.\n';

const CLOSING = '감사합니다.\n{회사} 드림';

export const DEFAULT_TEMPLATES: BossTemplate[] = [
  {
    id: 'default_1',
    name: '기본 견적',
    title: '{지역} {건물} 도배 견적 드립니다',
    content:
      GREETING +
      '보내 주신 내용을 꼼꼼히 확인하고 견적 드립니다.\n\n' +
      REQUEST_BLOCK +
      '\n' +
      INCLUDED_BLOCK +
      '\n' +
      NOTICE_BLOCK +
      '\n' +
      '방문 견적은 무료입니다. 편하신 시간을 알려 주시면 맞춰 찾아뵙겠습니다.\n' +
      CLOSING,
    sortOrder: 0,
    isDefault: true,
  },
  {
    id: 'default_2',
    name: '자세한 견적',
    title: '{지역} {건물} 도배 견적 자세히 안내드립니다',
    content:
      GREETING +
      '보내 주신 내용을 기준으로 견적과 시공 과정을 자세히 안내드립니다.\n\n' +
      REQUEST_BLOCK +
      '\n' +
      INCLUDED_BLOCK +
      '\n' +
      '■ 시공 순서\n' +
      '1. 방문 실측과 벽지 고르기 (샘플북을 가져가 함께 고릅니다)\n' +
      '2. 바탕 정리 (들뜬 곳 · 틈 메우기, 필요하면 기존 벽지 제거)\n' +
      '3. 벽지 시공 (보통 하루, 넓으면 이틀)\n' +
      '4. 마무리 확인과 청소 후 함께 둘러보기\n' +
      '\n' +
      '■ 시공 날 준비해 주실 것\n' +
      '- 귀중품과 작은 물건은 미리 치워 주세요.\n' +
      '- 큰 가구는 벽에서 조금 띄워 두시면 시공이 빨라집니다.\n' +
      '- 시공 뒤 하루 이틀은 창문을 닫아 두시면 벽지가 고르게 마릅니다.\n' +
      '\n' +
      NOTICE_BLOCK +
      '\n' +
      '궁금하신 점은 편하게 연락 주세요. 방문 일정 맞춰 드리겠습니다.\n' +
      CLOSING,
    sortOrder: 1,
    isDefault: true,
  },
  {
    id: 'default_3',
    name: '방문 견적 먼저',
    title: '{지역} 도배 방문 견적 안내드립니다',
    content:
      GREETING +
      '\n' +
      '보내 주신 내용({요약})으로 예상 금액을 먼저 드립니다.\n' +
      '실제 면적과 벽 상태에 따라 금액이 달라질 수 있어, 한 번 방문해서 보고 정확한 금액을 확정해 드리려고 합니다.\n' +
      '\n' +
      '■ 방문 견적\n' +
      '- 비용: 무료\n' +
      '- 걸리는 시간: 20~30분\n' +
      '- 확인할 것: 실제 면적, 벽 상태(곰팡이 · 들뜸), 벽지 종류와 색상\n' +
      '\n' +
      '편하신 날짜와 시간을 알려 주시면 맞춰 찾아뵙겠습니다.\n' +
      CLOSING,
    sortOrder: 2,
    isDefault: true,
  },
];

/** 앱과 같은 순서 — 기본 3개가 맨 앞, 그 뒤에 사장님이 만든 양식(순서 → 번호) */
export function mergeWithDefaults(serverList: BossTemplate[]): BossTemplate[] {
  const mine = serverList
    .filter((t) => !t.isDefault)
    .slice()
    .sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      return so !== 0 ? so : String(a.id).localeCompare(String(b.id));
    });
  return [...DEFAULT_TEMPLATES, ...mine];
}
