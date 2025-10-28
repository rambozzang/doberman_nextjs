import { Metadata } from "next";
import Link from "next/link";
import { 
  BookOpenIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  FileTextIcon,
  ShieldCheckIcon,
  PhoneIcon,
  WrenchIcon,
  AlertTriangleIcon,
  PlayCircleIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "도배 방법 | 도배 시공 과정 완벽 가이드 - 도베르만",
  description: "도배 방법이 궁금하신가요? 벽지 제거부터 마무리까지 전체 도배 과정을 단계별로 상세히 안내해드립니다.",
  keywords: "도배방법, 도배과정, 도배순서, 벽지시공방법, 도배기법, 셀프도배, 도배DIY, 벽지교체방법, 도배팁",
  openGraph: {
    title: "도배 방법 | 도배 시공 과정 완벽 가이드",
    description: "벽지 제거부터 마무리까지 전체 도배 과정을 단계별로 상세 안내",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://www.doberman.kr/도배-방법"
  }
};

export default function DobaeBangbeobPage() {
  const preparationSteps = [
    {
      step: "01",
      title: "현장 조사",
      description: "벽면 상태 확인, 면적 측정, 필요 자재 계산",
      details: ["벽면 균열 및 손상 확인", "습도 및 곰팡이 여부 점검", "정확한 면적 측정"]
    },
    {
      step: "02", 
      title: "자재 준비",
      description: "벽지, 풀, 도구 등 필요한 모든 자재 준비",
      details: ["벽지 10% 여유분 준비", "전용 풀 및 도구", "보호 비닐 및 청소 용품"]
    },
    {
      step: "03",
      title: "공간 정리",
      description: "가구 이동, 바닥 보호, 작업 공간 확보",
      details: ["가구 및 소품 이동", "바닥 보호 비닐 설치", "충분한 작업 공간 확보"]
    }
  ];

  const mainSteps = [
    {
      step: "01",
      title: "기존 벽지 제거",
      description: "기존 벽지를 깔끔하게 제거하고 벽면을 정리합니다",
      details: [
        "벽지 모서리부터 천천히 제거",
        "스팀기나 따뜻한 물로 풀 제거",
        "스크래퍼로 남은 풀 완전 제거",
        "벽면 청소 및 건조"
      ],
      tips: "급하게 뜯지 말고 천천히 제거해야 벽면 손상을 방지할 수 있습니다.",
      icon: WrenchIcon
    },
    {
      step: "02",
      title: "벽면 보수",
      description: "균열이나 구멍을 메우고 매끄러운 표면을 만듭니다",
      details: [
        "균열 부위 퍼티로 메우기",
        "못구멍이나 작은 구멍 보수",
        "사포로 매끄럽게 정리",
        "프라이머 도포 (필요시)"
      ],
      tips: "완전히 건조된 후 다음 단계로 넘어가는 것이 중요합니다.",
      icon: ShieldCheckIcon
    },
    {
      step: "03",
      title: "벽지 재단",
      description: "정확한 치수로 벽지를 재단합니다",
      details: [
        "벽 높이 + 10cm 여유분으로 재단",
        "패턴 매칭 고려하여 재단",
        "일련번호 순서로 정리",
        "재단면 보호"
      ],
      tips: "패턴이 있는 벽지는 패턴 매칭을 위해 충분한 여유분을 두세요.",
      icon: BookOpenIcon
    },
    {
      step: "04",
      title: "풀칠 및 접착",
      description: "균일하게 풀을 발라 벽지를 부착합니다",
      details: [
        "벽지 뒷면에 균일하게 풀칠",
        "5-10분간 풀 스며들게 대기",
        "천장부터 아래로 차례대로 부착",
        "공기방울 제거하며 밀착"
      ],
      tips: "풀이 너무 많거나 적으면 접착력에 문제가 생길 수 있습니다.",
      icon: CheckCircleIcon
    },
    {
      step: "05",
      title: "마무리 작업",
      description: "여분 제거, 이음새 정리 등 마무리 작업을 진행합니다",
      details: [
        "상하단 여분 정확히 재단",
        "이음새 부분 꼼꼼히 밀착",
        "스위치, 콘센트 주변 정리",
        "전체적인 마무리 점검"
      ],
      tips: "칼날이 무디면 벽지가 찢어질 수 있으니 새 칼날을 사용하세요.",
      icon: StarIcon
    }
  ];

  const tools = [
    { name: "스크래퍼", use: "기존 벽지 및 풀 제거", essential: true },
    { name: "커터칼", use: "벽지 재단 및 여분 제거", essential: true },
    { name: "풀솔", use: "벽지 뒷면 풀칠", essential: true },
    { name: "롤러", use: "공기방울 제거 및 밀착", essential: true },
    { name: "자", use: "정확한 치수 측정", essential: true },
    { name: "스팀기", use: "기존 벽지 제거 (선택)", essential: false },
    { name: "퍼티", use: "벽면 균열 보수", essential: false },
    { name: "사포", use: "벽면 정리", essential: false }
  ];

  const materials = [
    {
      type: "일반 벽지",
      characteristics: "경제적이고 다양한 디자인",
      difficulty: "쉬움",
      tips: "초보자도 쉽게 시공 가능"
    },
    {
      type: "실크 벽지",
      characteristics: "고급스럽고 내구성 좋음",
      difficulty: "보통",
      tips: "풀칠 후 적정 시간 기다려야 함"
    },
    {
      type: "합지 벽지",
      characteristics: "최고급 품질과 두께감",
      difficulty: "어려움",
      tips: "전문가 시공 권장"
    }
  ];

  const commonMistakes = [
    {
      mistake: "급하게 기존 벽지 제거",
      problem: "벽면 손상 및 보수 비용 증가",
      solution: "충분한 시간을 두고 천천히 제거"
    },
    {
      mistake: "풀칠 후 바로 부착",
      problem: "접착력 부족으로 들뜸 현상",
      solution: "풀칠 후 5-10분 대기 후 부착"
    },
    {
      mistake: "공기방울 제거 소홀",
      problem: "울퉁불퉁한 마감과 내구성 저하",
      solution: "롤러로 꼼꼼히 공기방울 제거"
    },
    {
      mistake: "이음새 처리 부주의",
      problem: "벽지 들뜸과 외관상 문제",
      solution: "이음새 부분 충분히 밀착 처리"
    }
  ];

  const professionalTips = [
    {
      title: "온도와 습도 관리",
      description: "시공 시 실내온도 18-25°C, 습도 40-60% 유지가 이상적입니다."
    },
    {
      title: "패턴 매칭 기법",
      description: "패턴 벽지는 벽 중앙부터 시작하여 좌우 대칭으로 진행하세요."
    },
    {
      title: "모서리 처리법",
      description: "모서리 부분은 여유분을 충분히 두고 정확히 재단하는 것이 중요합니다."
    },
    {
      title: "풀 농도 조절",
      description: "벽지 종류에 따라 풀의 농도를 조절하여 최적의 접착력을 확보하세요."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/25 mb-8">
              <BookOpenIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                도배 방법
              </span>
              <br />
              <span className="text-2xl md:text-4xl font-normal text-slate-300">
                완벽한 시공 가이드
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              기존 벽지 제거부터 마무리까지<br />
              전체 도배 과정을 단계별로 상세히 안내해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <PlayCircleIcon className="w-6 h-6" />
                전문가 시공 신청
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/quote-request/list"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <FileTextIcon className="w-6 h-6" />
                시공 사례 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 준비 단계 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              시공 전 <span className="text-blue-400">준비 단계</span>
            </h2>
            <p className="text-slate-300 text-lg">성공적인 도배를 위한 필수 준비 과정입니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {preparationSteps.map((step, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-300 mb-6">{step.description}</p>
                </div>
                
                <ul className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 주요 시공 단계 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              도배 시공 <span className="text-blue-400">5단계</span>
            </h2>
            <p className="text-slate-300 text-lg">전문가 수준의 완벽한 도배를 위한 핵심 과정</p>
          </div>
          
          <div className="space-y-12">
            {mainSteps.map((step, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="text-blue-400 font-bold text-sm">STEP {step.step}</div>
                        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-slate-300 mb-4">{step.description}</p>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <div className="flex items-start gap-2">
                        <AlertTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-yellow-400 font-semibold text-sm mb-1">전문가 팁</div>
                          <p className="text-slate-300 text-sm">{step.tips}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <h4 className="text-lg font-bold text-white mb-4">세부 작업 과정</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                          <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-slate-300 text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 필요 도구 및 자재 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              필요 <span className="text-blue-400">도구 & 자재</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 도구 */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-8 text-center">시공 도구</h3>
              <div className="space-y-4">
                {tools.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <WrenchIcon className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="text-white font-semibold">{tool.name}</div>
                        <div className="text-slate-300 text-sm">{tool.use}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tool.essential 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tool.essential ? '필수' : '선택'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 자재별 시공 난이도 */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-8 text-center">벽지별 시공 난이도</h3>
              <div className="space-y-6">
                {materials.map((material, index) => (
                  <div key={index} className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-bold text-white">{material.type}</h4>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        material.difficulty === '쉬움' ? 'bg-green-500/20 text-green-400' :
                        material.difficulty === '보통' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {material.difficulty}
                      </div>
                    </div>
                    <p className="text-slate-300 mb-3">{material.characteristics}</p>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 text-sm">{material.tips}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 흔한 실수와 해결법 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              흔한 <span className="text-blue-400">실수</span>와 해결법
            </h2>
            <p className="text-slate-300 text-lg">초보자가 자주 하는 실수들을 미리 방지하세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commonMistakes.map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">❌ {item.mistake}</h3>
                    <p className="text-red-300 text-sm mb-3">{item.problem}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-green-400 font-semibold mb-1">✅ 올바른 방법</h4>
                    <p className="text-slate-300 text-sm">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 전문가 팁 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">전문가</span> 노하우
            </h2>
            <p className="text-slate-300 text-lg">10년 이상 경력 전문가들의 특별한 팁</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {professionalTips.map((tip, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <StarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{tip.title}</h3>
                    <p className="text-slate-300 leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              <span className="text-blue-400">전문가 시공</span>을 원하시나요?
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              직접 시공이 부담스럽다면 검증된 전문가들이<br />
              완벽한 도배 시공을 도와드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <PlayCircleIcon className="w-6 h-6" />
                전문가 시공 신청
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/customer-support"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <PhoneIcon className="w-6 h-6" />
                기술 상담
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "도배 방법 - 완벽한 시공 가이드",
            "description": "기존 벽지 제거부터 마무리까지 전체 도배 과정을 단계별로 상세히 안내",
            "step": mainSteps.map((step, index) => ({
              "@type": "HowToStep",
              "position": index + 1,
              "name": step.title,
              "text": step.description
            }))
          })
        }}
      />
    </div>
  );
}
