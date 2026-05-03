import { ReactNode } from 'react';

interface BossPlaceholderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

// 백엔드 API 명세 확정 전까지의 임시 페이지 컴포넌트
// 모든 boss 라우트의 네비게이션을 즉시 작동시키기 위함
export default function BossPlaceholder({ title, description, children }: BossPlaceholderProps) {
  return (
    <div>
      <header className="mb-6 border-b border-white/[0.06] pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </header>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        {children ?? (
          <div className="space-y-2 text-sm text-slate-500">
            <p>이 페이지는 백엔드 API 명세 확정 후 본 구현이 들어갑니다.</p>
            <p>현재는 라우팅과 레이아웃이 정상 작동하는지 확인하기 위한 스캐폴딩 상태입니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
