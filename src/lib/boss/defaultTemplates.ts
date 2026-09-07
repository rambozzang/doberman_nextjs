// 기본 답변 양식 2개 — 앱 `web_estimate_template.dart` WebEstimateTemplate.defaultTemplates() 와 같은 글
//
// 양식을 하나도 만들지 않은 사장님도 답변할 수 있어야 한다. 서버에는 저장하지 않고
// 목록 맨 앞에 항상 끼워 넣는다(앱도 같은 방식). 기본 양식은 고치거나 지울 수 없다.

import type { BossTemplate } from '@/types/boss-templates';

export const DEFAULT_TEMPLATES: BossTemplate[] = [
  {
    id: 'default_1',
    name: '기본 템플릿',
    title: '견적서 보내드립니다.',
    content:
      '안녕하세요, 요청하신 서비스에 대한 견적내용입니다.\n\n' +
      '■ 서비스 내용\n- \n\n' +
      '■ 기타 안내사항\n' +
      '- 추가 요청사항에 따라 비용이 변동될 수 있습니다.\n' +
      '- 문의사항이 있으시면 언제든지 연락주세요.',
    sortOrder: 0,
    isDefault: true,
  },
  {
    id: 'default_2',
    name: '상세 템플릿',
    title: '견적서 보내드립니다.',
    content:
      '안녕하세요, 요청하신 서비스에 대한 견적내용을 보내드립니다.\n\n' +
      '■ 제공 서비스 내역\n' +
      '1. 서비스\n' +
      '   - 항목 A: \n' +
      '   - 항목 B: \n' +
      '   - 항목 C: \n\n' +
      '2. 추가 옵션 서비스\n' +
      '   - 옵션 1: (추가 비용: 00,000원)\n' +
      '   - 옵션 2: (추가 비용: 00,000원)\n\n' +
      '■ 작업 일정\n' +
      '- 계약 체결 후: 초기 미팅 및 요구사항 확인\n' +
      '- 1주차: 기본 작업 진행\n' +
      '- 2주차: 중간 점검 및 피드백 반영\n' +
      '- 3주차: 최종 작업 완료 및 인수인계\n\n' +
      '■ 품질 보증\n' +
      '- 작업 완료 후 30일간 무상 A/S 제공\n\n' +
      '■ 참고사항\n' +
      '- 본 견적서는 현재 제공된 정보를 기준으로 작성되었습니다.\n' +
      '- 추가 요청사항에 따라 비용 및 일정이 조정될 수 있습니다.\n' +
      '- 궁금하신 점이 있으시면 언제든지 연락주세요.',
    sortOrder: 1,
    isDefault: true,
  },
];

/** 앱과 같은 순서 — 기본 2개가 맨 앞, 그 뒤에 사장님이 만든 양식(순서 → 번호) */
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
