// 사장님 개인정보 처리방침
// Flutter 원본: lib/app/setting/privecy_page.dart
// 원본은 https://www.codelabtiger.com/doberman/privacy/index.html 를 WebView로 표시.
// Next.js 에서는 정적 텍스트로 표시.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: '제1조 (개인정보의 처리 목적)',
    body: '코드랩타이거(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.\n  - 회원 가입 및 관리\n  - 서비스 제공 및 계약 이행\n  - 고객 문의 응대 및 분쟁 처리\n  - 마케팅 및 광고에의 활용(별도 동의 시)',
  },
  {
    title: '제2조 (수집하는 개인정보의 항목)',
    body: '회사는 회원가입, 원활한 고객 상담, 각종 서비스의 제공을 위해 아래와 같은 최소한의 개인정보를 수집하고 있습니다.\n  - 필수 항목: 아이디, 비밀번호, 성명, 휴대폰번호, 이메일, 사업자등록번호\n  - 선택 항목: 회사 주소, 회사 로고, 프로필 이미지\n  - 자동 수집 항목: 접속 IP, 접속 로그, 쿠키, 단말기 정보',
  },
  {
    title: '제3조 (개인정보의 처리 및 보유 기간)',
    body: '1. 회사는 회원의 개인정보를 회원 탈퇴 시까지 보유 및 이용합니다.\n2. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.\n  - 계약 또는 청약철회 등에 관한 기록: 5년\n  - 대금결제 및 재화 등의 공급에 관한 기록: 5년\n  - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년',
  },
  {
    title: '제4조 (개인정보의 제3자 제공)',
    body: '회사는 정보주체의 개인정보를 본 방침에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.',
  },
  {
    title: '제5조 (개인정보의 파기 절차 및 방법)',
    body: '회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.\n  - 전자적 파일 형태: 복구 및 재생이 불가능한 방법으로 영구 삭제\n  - 종이 문서: 분쇄기로 분쇄하거나 소각',
  },
  {
    title: '제6조 (정보주체의 권리 및 행사방법)',
    body: '정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.\n  - 개인정보 열람 요구\n  - 오류 등이 있을 경우 정정 요구\n  - 삭제 요구\n  - 처리정지 요구',
  },
  {
    title: '제7조 (개인정보의 안전성 확보 조치)',
    body: '회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.\n  - 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육\n  - 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치\n  - 물리적 조치: 전산실, 자료보관실 등의 접근통제',
  },
  {
    title: '제8조 (개인정보 보호책임자)',
    body: '회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.\n  - 개인정보 보호책임자: 코드랩타이거 대표\n  - 연락처: 고객센터 1:1 문의',
  },
  {
    title: '제9조 (개인정보 처리방침의 변경)',
    body: '이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.',
  },
  {
    title: '부칙',
    body: '본 방침은 2024년 1월 1일부터 시행합니다.',
  },
];

export default function BossPrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/settings"
          className="inline-flex items-center gap-1.5 text-sm text-boss-text-muted hover:text-boss-text"
        >
          <ArrowLeft size={14} /> 설정
        </Link>
        <h1 className="text-xl font-bold text-boss-text">개인정보 처리방침</h1>
        <div className="w-10" />
      </div>

      <div className="space-y-4 rounded-2xl border border-boss-border bg-boss-surface p-6">
        <div className="border-b border-boss-border pb-3 text-xs text-boss-text-muted">
          시행일: 2024년 1월 1일
        </div>
        {PRIVACY_SECTIONS.map((sec) => (
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
