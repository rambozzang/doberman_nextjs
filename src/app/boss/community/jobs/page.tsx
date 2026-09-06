'use client';

// 구인 / 구직 전용 메뉴 — Industry 패턴
// 목록 조판은 CommunityList(fixedCategory="JOB") 가 담당한다.
// 화면 제목은 셸 헤더가 그리고, «구인/구직 등록» 은 필터 줄 우측에 둔다.

import { CommunityList } from '@/components/boss/community/CommunityList';
import { ButtonLink } from '@/components/boss/ui';
import { PenSquare } from 'lucide-react';

export default function BossCommunityJobsPage() {
  return (
    <CommunityList
      fixedCategory="JOB"
      actions={
        <ButtonLink href="/boss/community/new?type=JOB" variant="primary" size="sm" icon={PenSquare}>
          구인 / 구직 등록
        </ButtonLink>
      }
    />
  );
}
