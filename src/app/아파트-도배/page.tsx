import { Metadata } from "next";
import Link from "next/link";
import { 
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  FileTextIcon,
  PhoneIcon,
  HomeIcon,
  KeyIcon,
  AlertTriangleIcon,
  CalendarIcon,
  TruckIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "아파트 도배 | 아파트 전용 도배 시공 서비스 - 도베르만",
  description: "아파트 도배 전문 서비스! 입주 전 도배, 거주 중 도배, 이사 전 도배까지. 아파트 특성에 맞는 완벽한 시공을 제공합니다.",
  keywords: "아파트도배, 아파트벽지, 입주전도배, 거주중도배, 이사전도배, 아파트인테리어, 아파트리모델링, 신축아파트도배",
  openGraph: {
    title: "아파트 도배 | 아파트 전용 도배 시공 서비스",
    description: "아파트 특성에 맞는 전문 도배 시공. 입주 전부터 이사 전까지 완벽 서비스",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://www.doberman.kr/아파트-도배"
  }
};

export default function AparteuDobae() {
  const apartmentTypes = [
    {
      type: "신축 아파트",
      description: "새로 지어진 아파트의 첫 입주 전 도배",
      features: [
        "깨끗한 벽면 상태",
        "기본 도배지 교체",
        "취향에 맞는 디자인 선택",
        "입주 일정 맞춤 시공"
      ],
      considerations: [
        "입주 전 충분한 환기",
        "관리사무소 협의 필요",
        "엘리베이터 사용 시간 확인"
      ],
      timeline: "1-2일",
      priceRange: "전체 기준 80-150만원",
      icon: HomeIcon,
      color: "from-green-500 to-emerald-500"
    },
    {
      type: "기존 아파트",
      description: "거주 중이거나 중고 아파트의 도배 교체",
      features: [
        "기존 벽지 완전 제거",
        "벽면 상태 점검 및 보수",
        "생활 패턴 고려 시공",
        "가구 보호 및 정리"
      ],
      considerations: [
        "기존 벽지 제거 작업",
        "벽면 손상 보수 필요",
        "생활하면서 시공 진행"
      ],
      timeline: "2-3일",
      priceRange: "전체 기준 100-200만원",
      icon: BuildingIcon,
      color: "from-blue-500 to-cyan-500"
    },
    {
      type: "임대 아파트",
      description: "전세/월세 아파트의 경제적 도배",
      features: [
        "경제적인 벽지 선택",
        "원상복구 고려 시공",
        "임대인 협의 진행",
        "빠른 시공 완료"
      ],
      considerations: [
        "임대인 사전 협의",
        "원상복구 조건 확인",
        "경제적 자재 선택"
      ],
      timeline: "1-2일",
      priceRange: "전체 기준 60-120만원",
      icon: KeyIcon,
      color: "from-purple-500 to-violet-500"
    }
  ];

  const roomByRoom = [
    {
      room: "거실",
      characteristics: "넓은 공간, 채광 중요",
      recommendations: [
        "밝은 색상으로 공간 확장 효과",
        "실크지 또는 합지 추천",
        "패턴은 절제된 것 선택",
        "TV벽 포인트 벽지 고려"
      ],
      avgCost: "25-45만원",
      considerations: "가구 이동 공간 확보 필요"
    },
    {
      room: "안방",
      characteristics: "휴식 공간, 안정감 중요",
      recommendations: [
        "차분하고 편안한 색조",
        "실크지로 고급스러운 마감",
        "플로럴이나 단색 패턴",
        "침실 분위기에 맞는 선택"
      ],
      avgCost: "20-35만원",
      considerations: "침대 등 대형 가구 이동"
    },
    {
      room: "작은방",
      characteristics: "다목적 공간, 효율성 중요",
      recommendations: [
        "밝은 색상으로 공간감 확대",
        "일반지로 경제적 선택",
        "심플한 디자인 추천",
        "용도에 맞는 색상 선택"
      ],
      avgCost: "15-25만원",
      considerations: "용도 변경 가능성 고려"
    },
    {
      room: "주방",
      characteristics: "습기, 기름때 노출",
      recommendations: [
        "방수 기능성 벽지 필수",
        "청소가 쉬운 표면 처리",
        "밝고 깔끔한 색상",
        "항균 처리된 제품 선택"
      ],
      avgCost: "10-20만원",
      considerations: "가스레인지 주변 보호"
    },
    {
      room: "화장실",
      characteristics: "고습도 환경",
      recommendations: [
        "완전 방수 벽지 필수",
        "곰팡이 방지 처리",
        "밝은 색상으로 청결감",
        "타일 부분과 조화"
      ],
      avgCost: "8-15만원",
      considerations: "환기 시설 점검 필요"
    },
    {
      room: "현관",
      characteristics: "첫인상, 내구성 중요",
      recommendations: [
        "내구성 좋은 합지 추천",
        "밝고 깔끔한 첫인상",
        "신발장과 조화로운 색상",
        "고급스러운 마감"
      ],
      avgCost: "5-12만원",
      considerations: "신발장 등 고정 가구"
    }
  ];

  const timingGuide = [
    {
      timing: "입주 전",
      advantages: [
        "가구 없어 작업 용이",
        "충분한 환기 시간",
        "완벽한 마감 가능",
        "입주와 동시에 새 느낌"
      ],
      disadvantages: [
        "입주 일정 조율 필요",
        "관리사무소 협의 필요"
      ],
      bestFor: "신축 아파트, 완전 이사"
    },
    {
      timing: "거주 중",
      advantages: [
        "필요한 부분만 선택 가능",
        "생활 패턴 고려 시공",
        "점진적 개선 가능"
      ],
      disadvantages: [
        "가구 이동 불편",
        "생활 중 먼지 발생",
        "시공 기간 연장"
      ],
      bestFor: "부분 교체, 점진적 개선"
    },
    {
      timing: "이사 전",
      advantages: [
        "원상복구 효과",
        "임대 보증금 회수 유리",
        "다음 입주자 배려"
      ],
      disadvantages: [
        "추가 비용 발생",
        "이사 일정과 조율"
      ],
      bestFor: "임대 아파트, 매매 전"
    }
  ];

  const apartmentSpecialTips = [
    {
      title: "층간소음 방지",
      description: "시공 시간을 평일 오전 9시~오후 6시로 제한하여 이웃 배려",
      icon: ClockIcon
    },
    {
      title: "엘리베이터 이용",
      description: "관리사무소와 협의하여 화물용 엘리베이터 사용 시간 확보",
      icon: TruckIcon
    },
    {
      title: "공동현관 출입",
      description: "시공업체 출입을 위한 사전 등록 및 보안 절차 준비",
      icon: KeyIcon
    },
    {
      title: "폐기물 처리",
      description: "기존 벽지 등 폐기물을 아파트 규정에 맞게 분리수거",
      icon: AlertTriangleIcon
    }
  ];

  const packageOptions = [
    {
      package: "기본 패키지",
      description: "필수 공간만 경제적으로",
      includes: ["거실", "안방", "작은방"],
      excludes: ["주방", "화장실", "현관"],
      priceRange: "60-105만원",
      duration: "1-2일",
      suitable: "경제적 리모델링"
    },
    {
      package: "표준 패키지", 
      description: "주요 생활공간 전체",
      includes: ["거실", "안방", "작은방", "현관"],
      excludes: ["주방", "화장실"],
      priceRange: "85-135만원",
      duration: "2일",
      suitable: "일반적인 도배 교체"
    },
    {
      package: "프리미엄 패키지",
      description: "전체 공간 완벽 시공",
      includes: ["모든 공간", "기능성 벽지", "A/S 보장"],
      excludes: [],
      priceRange: "120-200만원",
      duration: "2-3일",
      suitable: "완벽한 인테리어"
    }
  ];

  const commonIssues = [
    {
      issue: "아파트 관리사무소 협의",
      solution: "시공 전 미리 관리사무소에 신고하고 필요 서류 준비",
      prevention: "시공 1주일 전 사전 협의 권장"
    },
    {
      issue: "이웃 민원",
      solution: "시공 시간 준수하고 사전에 양해 구하기",
      prevention: "평일 낮 시간대 시공, 주말/야간 작업 금지"
    },
    {
      issue: "엘리베이터 사용 제한",
      solution: "관리사무소와 협의하여 화물용 엘리베이터 사용",
      prevention: "시공 전 엘리베이터 사용 시간 확보"
    },
    {
      issue: "주차 공간 부족",
      solution: "시공업체 차량 주차 공간 미리 확보",
      prevention: "방문자 주차증 발급 또는 인근 주차장 이용"
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
              <BuildingIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                아파트 도배
              </span>
              <br />
              <span className="text-2xl md:text-4xl font-normal text-slate-300">
                전문 시공 서비스
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              아파트 특성에 맞는 전문 도배 시공<br />
              입주 전부터 이사 전까지 완벽한 서비스를 제공합니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <BuildingIcon className="w-6 h-6" />
                아파트 도배 견적
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/quote-request/list"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <FileTextIcon className="w-6 h-6" />
                아파트 시공 사례
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 아파트 유형별 도배 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              아파트 <span className="text-blue-400">유형별</span> 도배
            </h2>
            <p className="text-slate-300 text-lg">아파트 상황에 맞는 맞춤형 도배 서비스</p>
          </div>
          
          <div className="space-y-8">
            {apartmentTypes.map((apt, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* 기본 정보 */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${apt.color} rounded-2xl`}>
                        <apt.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{apt.type}</h3>
                        <p className="text-slate-300">{apt.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="text-blue-400 font-semibold text-sm mb-1">예상 기간</div>
                        <div className="text-white font-bold">{apt.timeline}</div>
                      </div>
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <div className="text-green-400 font-semibold text-sm mb-1">예상 비용</div>
                        <div className="text-white font-bold text-sm">{apt.priceRange}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 특징 및 고려사항 */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 주요 특징 */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">주요 특징</h4>
                        <ul className="space-y-2">
                          {apt.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                              <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* 고려사항 */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">고려사항</h4>
                        <ul className="space-y-2">
                          {apt.considerations.map((consideration, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                              <AlertTriangleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              {consideration}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 방별 도배 가이드 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">방별</span> 도배 가이드
            </h2>
            <p className="text-slate-300 text-lg">각 공간별 특성에 맞는 도배 방법</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomByRoom.map((room, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <HomeIcon className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">{room.room}</h3>
                </div>
                
                <p className="text-slate-400 text-sm mb-4">{room.characteristics}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">추천사항</h4>
                  <ul className="space-y-1">
                    {room.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-slate-300 text-xs">• {rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div>
                    <div className="text-green-400 font-semibold text-sm">평균 비용</div>
                    <div className="text-white font-bold text-sm">{room.avgCost}</div>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="text-yellow-400 font-semibold text-xs mb-1">주의사항</div>
                  <div className="text-slate-300 text-xs">{room.considerations}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 시공 시기별 가이드 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              시공 <span className="text-blue-400">시기별</span> 가이드
            </h2>
            <p className="text-slate-300 text-lg">언제 도배를 하는 것이 가장 좋을까요?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {timingGuide.map((timing, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="text-center mb-6">
                  <CalendarIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white">{timing.timing}</h3>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-green-400 font-semibold mb-2">✅ 장점</h4>
                  <ul className="space-y-1">
                    {timing.advantages.map((adv, idx) => (
                      <li key={idx} className="text-slate-300 text-sm">• {adv}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-red-400 font-semibold mb-2">❌ 단점</h4>
                  <ul className="space-y-1">
                    {timing.disadvantages.map((dis, idx) => (
                      <li key={idx} className="text-slate-300 text-sm">• {dis}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-blue-400 font-semibold text-sm mb-1">추천 대상</div>
                  <div className="text-white text-sm">{timing.bestFor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 아파트 도배 패키지 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              아파트 도배 <span className="text-blue-400">패키지</span>
            </h2>
            <p className="text-slate-300 text-lg">예산과 필요에 맞는 패키지를 선택하세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packageOptions.map((pkg, index) => (
              <div key={index} className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 ${index === 1 ? 'border-blue-500/30 bg-blue-500/5' : ''}`}>
                {index === 1 && (
                  <div className="text-center mb-4">
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">인기</span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{pkg.package}</h3>
                  <p className="text-slate-300 text-sm mb-4">{pkg.description}</p>
                  <div className="text-3xl font-bold text-blue-400">{pkg.priceRange}</div>
                  <div className="text-slate-400 text-sm">시공기간: {pkg.duration}</div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-green-400 font-semibold mb-2">포함 공간</h4>
                  <ul className="space-y-1">
                    {pkg.includes.map((include, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {include}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {pkg.excludes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-slate-400 font-semibold mb-2">미포함 공간</h4>
                    <ul className="space-y-1">
                      {pkg.excludes.map((exclude, idx) => (
                        <li key={idx} className="text-slate-400 text-sm">• {exclude}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-6">
                  <div className="text-purple-400 font-semibold text-sm mb-1">추천 대상</div>
                  <div className="text-white text-sm">{pkg.suitable}</div>
                </div>
                
                <Link
                  href="/quote-request"
                  className={`w-full px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                    index === 1 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  선택하기
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 아파트 도배 특별 고려사항 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              아파트 도배 <span className="text-blue-400">특별 고려사항</span>
            </h2>
            <p className="text-slate-300 text-lg">아파트만의 특수한 상황들을 고려합니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {apartmentSpecialTips.map((tip, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4">
                  <tip.icon className="w-6 h-6 text-blue-400" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-3">{tip.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 자주 발생하는 문제와 해결책 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              자주 발생하는 <span className="text-blue-400">문제</span>와 해결책
            </h2>
            <p className="text-slate-300 text-lg">아파트 도배 시 흔히 겪는 문제들을 미리 예방하세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commonIssues.map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">문제: {item.issue}</h3>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-green-400 font-semibold mb-2">✅ 해결책</h4>
                  <p className="text-slate-300 text-sm">{item.solution}</p>
                </div>
                
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-blue-400 font-semibold text-sm mb-1">💡 예방법</h4>
                  <p className="text-slate-300 text-sm">{item.prevention}</p>
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
              <span className="text-blue-400">아파트 도배</span> 전문가와 상담하세요!
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              아파트 특성을 완벽히 이해하는 전문가들이<br />
              최적의 도배 솔루션을 제안해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <BuildingIcon className="w-6 h-6" />
                아파트 도배 견적
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/customer-support"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <PhoneIcon className="w-6 h-6" />
                전화 상담
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
            "@type": "Service",
            "name": "아파트 도배 서비스",
            "description": "아파트 특성에 맞는 전문 도배 시공 서비스",
            "provider": {
              "@type": "Organization",
              "name": "도베르만",
              "url": "https://www.doberman.kr"
            },
            "areaServed": {
              "@type": "Country",
              "name": "대한민국"
            },
            "serviceType": "아파트 도배",
            "offers": packageOptions.map(pkg => ({
              "@type": "Offer",
              "name": pkg.package,
              "description": pkg.description,
              "priceRange": pkg.priceRange
            }))
          })
        }}
      />
    </div>
  );
}
