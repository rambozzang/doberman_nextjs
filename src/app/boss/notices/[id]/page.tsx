'use client';

import { useParams } from 'next/navigation';
import PublicNotices from '@/components/boss/notices/PublicNotices';
import { ButtonLink, EmptyState } from '@/components/boss/ui';

export default function NoticePage() {
  const { id } = useParams<{ id: string }>();
  const parsed = /^\d+$/.test(id) ? Number(id) : NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? <PublicNotices id={parsed} /> : (
    <EmptyState title="공지사항 주소를 확인해 주세요" action={<ButtonLink href="/boss/notices">공지사항 목록</ButtonLink>} />
  );
}
