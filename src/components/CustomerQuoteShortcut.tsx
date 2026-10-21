"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

/** 로그인한 고객이 홈에서도 본인 요청 내역을 바로 찾게 한다. */
export default function CustomerQuoteShortcut() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return null;
  return (
    <section aria-labelledby="my-quote-shortcut-title" className="my-5 flex flex-col gap-4 rounded-xl border border-slate-600 bg-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:my-6 lg:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
        <div>
          <h2 id="my-quote-shortcut-title" className="text-base font-semibold text-white">내 견적 요청</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">신청한 내역과 업체 답변을 확인하세요.</p>
        </div>
      </div>
      <Link href="/quote-request/my-quotes" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800">
        요청 내역 보기<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
