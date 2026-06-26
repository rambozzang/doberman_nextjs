// 사장님 서비스 이용약관
// Flutter 원본: lib/app/setting/service_page.dart
// 원본은 https://www.codelabtiger.com/doberman/service/ 를 WebView로 표시.
// Next.js 에서는 정적 텍스트로 표시.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: '제1조 (목적)',
    body: '이 약관은 코드랩타이거(이하 "회사")가 제공하는 도베르만(Doberman) 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (정의)',
    body: '1. "서비스"란 회사가 제공하는 인테리어 사업자를 위한 견적, 일정, 고객 관리 및 관련 부가 서비스를 의미합니다.\n2. "회원"이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.\n3. "아이디(ID)"란 회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 문자와 숫자의 조합을 말합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    body: '1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.\n2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.\n3. 약관이 변경되는 경우 변경사항의 시행일 7일 이전부터 공지합니다.',
  },
  {
    title: '제4조 (서비스의 제공)',
    body: '1. 회사는 회원에게 아래와 같은 서비스를 제공합니다.\n  - 견적서 작성 및 관리\n  - 고객 및 일정 관리\n  - 시공/포트폴리오 관리\n  - 결제 및 정산 관리\n  - 기타 회사가 정하는 업무\n2. 회사는 서비스의 품질 향상을 위하여 서비스의 내용을 변경할 수 있습니다.',
  },
  {
    title: '제5조 (서비스 이용시간)',
    body: '서비스의 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴 1일 24시간 운영을 원칙으로 합니다. 단, 정기점검 등의 사유로 회사가 정한 날 또는 시간은 제외합니다.',
  },
  {
    title: '제6조 (이용계약의 성립)',
    body: '1. 이용계약은 회원이 되고자 하는 자(이하 "가입신청자")가 약관의 내용에 대하여 동의를 한 후 가입신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.\n2. 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않을 수 있습니다.\n  - 가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우\n  - 실명이 아니거나 타인의 명의를 이용한 경우\n  - 허위의 정보를 기재하거나 회사가 제시하는 내용을 기재하지 않은 경우',
  },
  {
    title: '제7조 (회원의 의무)',
    body: '1. 회원은 다음 행위를 하여서는 안 됩니다.\n  - 신청 또는 변경 시 허위내용의 등록\n  - 타인의 정보 도용\n  - 회사가 게시한 정보의 변경\n  - 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시\n  - 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해\n  - 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위',
  },
  {
    title: '제8조 (계약 해지 및 이용 제한)',
    body: '1. 회원은 언제든지 설정 메뉴를 통하여 이용계약 해지를 신청할 수 있으며, 회사는 즉시 처리합니다.\n2. 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 회사는 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.',
  },
  {
    title: '제9조 (책임제한)',
    body: '회사는 천재지변, 전쟁 및 기타 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.',
  },
  {
    title: '부칙',
    body: '본 약관은 2024년 1월 1일부터 시행합니다.',
  },
];

export default function BossTermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/settings"
          className="inline-flex items-center gap-1.5 text-sm text-boss-text-muted hover:text-boss-text"
        >
          <ArrowLeft size={14} /> 설정
        </Link>
        <h1 className="text-xl font-bold text-boss-text">서비스 이용약관</h1>
        <div className="w-10" />
      </div>

      <div className="space-y-4 rounded-2xl border border-boss-border bg-boss-surface p-6">
        <div className="border-b border-boss-border pb-3 text-xs text-boss-text-muted">
          시행일: 2024년 1월 1일
        </div>
        {TERMS_SECTIONS.map((sec) => (
          <section key={sec.title} className="space-y-2">
            <h2 className="text-sm font-bold text-boss-primary">{sec.title}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-boss-text-secondary">
              {sec.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
