import { Metadata } from "next";
import Link from "next/link";
import { 
  DollarSignIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  FileTextIcon,
  PhoneIcon,
  HomeIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CalendarIcon,
  ScissorsIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "저렴한 도배 | 합리적인 가격의 도배 서비스 - 도베르만",
  description: "저렴한 도배를 찾고 계신가요? 품질은 유지하면서도 합리적인 가격으로 도배 시공을 받을 수 있는 방법을 알려드립니다.",
  keywords: "저렴한도배, 싼도배, 도배할인, 경제적도배, 저가도배, 가성비도배, 합리적가격도배, 도배비용절약",
  openGraph: {
    title: "저렴한 도배 | 합리적인 가격의 도배 서비스",
    description: "품질은 유지하면서도 합리적인 가격으로 도배 시공받는 방법",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://www.doberman.kr/저렴한-도배"
  }
};

export default function JeolyeomhanDobae() {
  const savingMethods = [
    {
      method: "비수기 시공",
      description: "3-5월, 9-11월 비수기에 시공하여 인건비 절약",
      savings: "10-15%",
      details: [
        "봄, 가을 비수기 활용",
        "업체 여유 시간 확보",
        "할인 혜택 적용",
        "충분한 시공 시간"
      ],
      icon: CalendarIcon,
      color: "from-green-500 to-emerald-500"
    },
    {
      method: "여러 업체 견적 비교",
      description: "3-5개 업체의 견적을 받아 최적의 가격 선택",
      savings: "15-20%",
      details: [
        "최소 3개 업체 견적",
        "서비스 내용 비교",
        "숨은 비용 확인",
        "협상을 통한 할인"
      ],
      icon: FileTextIcon,
      color: "from-blue-500 to-cyan-500"
    },
    {
      method: "패키지 할인",
      description: "전체 집을 한 번에 시공하여 평당 단가 절약",
      savings: "10-15%",
      details: [
        "전체 공간 일괄 시공",
        "규모의 경제 효과",
        "이동비 절약",
        "패키지 할인 적용"
      ],
      icon: HomeIcon,
      color: "from-purple-500 to-violet-500"
    },
    {
      method: "경제적 자재 선택",
      description: "품질 좋은 일반 벽지로 비용 대폭 절약",
      savings: "30-50%",
      details: [
        "일반지 선택",
        "단색 벽지 활용",
        "브랜드보다 품질 중심",
        "과도한 디자인 지양"
      ],
      icon: ScissorsIcon,
      color: "from-orange-500 to-red-500"
    }
  ];

  const budgetOptions = [
    {
      budget: "50만원 이하",
      description: "원룸, 투룸 경제적 도배",
      includes: [
        "원룸 전체 (10평 이하)",
        "일반 벽지 사용",
        "기본 시공만 진행",
        "1일 완료"
      ],
      excludes: [
        "고급 벽지",
        "복잡한 패턴",
        "추가 보수 작업"
      ],
      tips: "최소한의 비용으로 깔끔한 마감",
      suitable: "원룸, 고시원, 임시 거주"
    },
    {
      budget: "50-100만원",
      description: "투룸, 소형 아파트 기본 도배",
      includes: [
        "투룸 전체 (15-20평)",
        "거실 + 방 2개",
        "일반지 또는 저가 실크지",
        "1-2일 완료"
      ],
      excludes: [
        "주방, 화장실",
        "고급 자재",
        "특수 시공"
      ],
      tips: "가성비 좋은 기본 도배",
      suitable: "신혼부부, 소형 아파트"
    },
    {
      budget: "100-150만원",
      description: "중형 아파트 표준 도배",
      includes: [
        "3룸 전체 (20-30평)",
        "거실 + 방 3개 + 현관",
        "실크지 일부 적용",
        "2-3일 완료"
      ],
      excludes: [
        "최고급 자재",
        "디자인 벽지",
        "특수 기능성 벽지"
      ],
      tips: "품질과 가격의 균형",
      suitable: "일반 가정, 표준 아파트"
    }
  ];

  const economicalMaterials = [
    {
      material: "국산 일반지",
      description: "경제적이면서도 품질 좋은 선택",
      priceRange: "평당 8,000-10,000원",
      pros: [
        "저렴한 가격",
        "다양한 색상",
        "시공 용이",
        "A/S 가능"
      ],
      cons: [
        "상대적 짧은 수명",
        "고급감 부족"
      ],
      bestUse: "임대주택, 경제적 리모델링"
    },
    {
      material: "단색 실크지",
      description: "패턴 없는 실크지로 비용 절약",
      priceRange: "평당 10,000-13,000원",
      pros: [
        "실크지의 질감",
        "패턴 매칭 불필요",
        "시공 시간 단축",
        "깔끔한 마감"
      ],
      cons: [
        "디자인 제한",
        "일반지 대비 비쌈"
      ],
      bestUse: "심플 인테리어, 모던 스타일"
    },
    {
      material: "수입 일반지",
      description: "합리적 가격의 수입 벽지",
      priceRange: "평당 9,000-12,000원",
      pros: [
        "독특한 디자인",
        "좋은 품질",
        "합리적 가격",
        "다양한 선택"
      ],
      cons: [
        "A/S 제한",
        "재주문 어려움"
      ],
      bestUse: "개성 있는 인테리어"
    }
  ];

  const costCuttingTips = [
    {
      category: "시공 준비",
      tips: [
        "직접 가구 이동하여 인건비 절약",
        "기존 벽지 일부 직접 제거",
        "청소 및 정리 작업 직접 수행",
        "시공 일정을 업체에 맞춰 조정"
      ]
    },
    {
      category: "자재 선택",
      tips: [
        "브랜드보다 품질 중심 선택",
        "단색이나 심플한 패턴 선택",
        "과도한 여유분 주문 지양",
        "할인 이벤트 시기 활용"
      ]
    },
    {
      category: "업체 선정",
      tips: [
        "지역 업체 우선 고려",
        "소규모 전문 업체 활용",
        "지인 추천 업체 할인 협상",
        "현금 결제 할인 혜택 활용"
      ]
    },
    {
      category: "시공 범위",
      tips: [
        "꼭 필요한 공간만 선택",
        "단계적 시공 계획",
        "부분 도배로 비용 분산",
        "우선순위 설정하여 진행"
      ]
    }
  ];

  const qualityVsBudget = [
    {
      aspect: "자재 선택",
      economy: "일반지 사용",
      standard: "실크지 혼용",
      premium: "합지 위주",
      recommendation: "용도에 맞는 자재 선택이 중요"
    },
    {
      aspect: "시공 범위",
      economy: "주요 공간만",
      standard: "생활 공간 전체",
      premium: "전체 공간",
      recommendation: "우선순위를 정해 단계별 진행"
    },
    {
      aspect: "디자인",
      economy: "단색 위주",
      standard: "심플 패턴",
      premium: "고급 디자인",
      recommendation: "심플한 디자인이 오래 질리지 않음"
    },
    {
      aspect: "A/S 기간",
      economy: "6개월",
      standard: "1년",
      premium: "2년",
      recommendation: "최소 1년 A/S는 확보 권장"
    }
  ];

  const avoidMistakes = [
    {
      mistake: "무조건 최저가 선택",
      problem: "품질 저하, 부실 시공 위험",
      solution: "적정 가격대에서 신뢰할 수 있는 업체 선택",
      warning: "너무 싼 견적은 의심해볼 필요"
    },
    {
      mistake: "숨은 비용 미확인",
      problem: "예상보다 높은 최종 비용",
      solution: "견적서에 모든 비용 항목 명시 요구",
      warning: "추가 비용 발생 가능성 사전 확인"
    },
    {
      mistake: "자재만 저렴하게",
      problem: "시공비가 더 비쌀 수 있음",
      solution: "전체 비용을 종합적으로 비교",
      warning: "인건비, 부대비용까지 고려"
    },
    {
      mistake: "계약서 없는 거래",
      problem: "분쟁 시 해결 어려움",
      solution: "간단하더라도 계약서 작성",
      warning: "구두 약속만으로는 위험"
    }
  ];

  const seasonalTips = [
    {
      season: "봄 (3-5월)",
      advantages: ["비수기 할인", "쾌적한 시공 환경", "충분한 환기"],
      discounts: "10-15%",
      bestFor: "전체 도배, 큰 평수"
    },
    {
      season: "여름 (6-8월)",
      advantages: ["빠른 건조", "긴 작업 시간"],
      discounts: "5-10%",
      bestFor: "부분 도배, 응급 시공"
    },
    {
      season: "가을 (9-11월)",
      advantages: ["최적의 습도", "비수기 할인", "안정적 시공"],
      discounts: "10-15%",
      bestFor: "전체 도배, 고급 시공"
    },
    {
      season: "겨울 (12-2월)",
      advantages: ["성수기 이전 준비", "실내 작업 집중"],
      discounts: "5-8%",
      bestFor: "소규모 도배"
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
              <TrendingDownIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                저렴한 도배
              </span>
              <br />
              <span className="text-2xl md:text-4xl font-normal text-slate-300">
                합리적 가격의 품질 시공
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              품질은 유지하면서도 합리적인 가격으로<br />
              도배 시공을 받을 수 있는 방법을 알려드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <DollarSignIcon className="w-6 h-6" />
                저렴한 견적 받기
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/quote-request/list"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <FileTextIcon className="w-6 h-6" />
                저가 시공 사례
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 비용 절약 방법 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              도배 비용 <span className="text-blue-400">절약 방법</span>
            </h2>
            <p className="text-slate-300 text-lg">똑똑한 방법으로 도배 비용을 크게 줄일 수 있습니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {savingMethods.map((method, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${method.color} rounded-xl mb-4`}>
                  <method.icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{method.method}</h3>
                  <div className="px-3 py-1 bg-green-500/20 rounded-full">
                    <span className="text-green-400 font-bold text-sm">-{method.savings}</span>
                  </div>
                </div>
                
                <p className="text-slate-300 mb-4 text-sm">{method.description}</p>
                
                <ul className="space-y-1">
                  {method.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300 text-xs">
                      <CheckCircleIcon className="w-3 h-3 text-green-400 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 예산별 도배 옵션 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">예산별</span> 도배 옵션
            </h2>
            <p className="text-slate-300 text-lg">예산에 맞는 최적의 도배 플랜을 선택하세요</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {budgetOptions.map((option, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4">
                    <DollarSignIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{option.budget}</h3>
                  <p className="text-slate-300 text-sm">{option.description}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-green-400 font-semibold mb-3">✅ 포함 사항</h4>
                  <ul className="space-y-2">
                    {option.includes.map((include, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {include}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-red-400 font-semibold mb-3">❌ 제외 사항</h4>
                  <ul className="space-y-1">
                    {option.excludes.map((exclude, idx) => (
                      <li key={idx} className="text-slate-400 text-sm">• {exclude}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
                  <div className="text-blue-400 font-semibold text-sm mb-1">💡 팁</div>
                  <div className="text-slate-300 text-sm">{option.tips}</div>
                </div>
                
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <div className="text-purple-400 font-semibold text-sm mb-1">추천 대상</div>
                  <div className="text-white text-sm">{option.suitable}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 경제적 자재 선택 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">경제적</span> 자재 선택
            </h2>
            <p className="text-slate-300 text-lg">품질 좋은 저가 자재로 비용을 크게 절약하세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {economicalMaterials.map((material, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <h3 className="text-xl font-bold text-white mb-2">{material.material}</h3>
                <p className="text-slate-300 text-sm mb-4">{material.description}</p>
                
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-blue-400">{material.priceRange}</div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-green-400 font-semibold mb-2">장점</h4>
                  <ul className="space-y-1">
                    {material.pros.map((pro, idx) => (
                      <li key={idx} className="text-slate-300 text-sm">• {pro}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-red-400 font-semibold mb-2">단점</h4>
                  <ul className="space-y-1">
                    {material.cons.map((con, idx) => (
                      <li key={idx} className="text-slate-300 text-sm">• {con}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="text-purple-400 font-semibold text-sm mb-1">적합한 용도</div>
                  <div className="text-white text-sm">{material.bestUse}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 세부 절약 팁 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              세부 <span className="text-blue-400">절약 팁</span>
            </h2>
            <p className="text-slate-300 text-lg">작은 것부터 하나씩 실천해보세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {costCuttingTips.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <h3 className="text-lg font-bold text-white mb-4">{category.category}</h3>
                
                <ul className="space-y-3">
                  {category.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 계절별 할인 정보 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              계절별 <span className="text-blue-400">할인 정보</span>
            </h2>
            <p className="text-slate-300 text-lg">시기에 따른 할인 혜택을 놓치지 마세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {seasonalTips.map((season, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="text-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-white">{season.season}</h3>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-400">최대 {season.discounts}</div>
                  <div className="text-slate-400 text-sm">할인 가능</div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-green-400 font-semibold mb-2">장점</h4>
                  <ul className="space-y-1">
                    {season.advantages.map((adv, idx) => (
                      <li key={idx} className="text-slate-300 text-sm">• {adv}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-blue-400 font-semibold text-sm mb-1">추천 시공</div>
                  <div className="text-white text-sm">{season.bestFor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 피해야 할 실수 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              피해야 할 <span className="text-blue-400">실수들</span>
            </h2>
            <p className="text-slate-300 text-lg">저렴한 도배를 위해 주의해야 할 사항들</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {avoidMistakes.map((mistake, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">❌ {mistake.mistake}</h3>
                    <p className="text-red-300 text-sm mb-3">{mistake.problem}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-green-400 font-semibold mb-2">✅ 올바른 방법</h4>
                  <p className="text-slate-300 text-sm">{mistake.solution}</p>
                </div>
                
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-yellow-400 font-semibold text-sm mb-1">⚠️ 주의</div>
                      <p className="text-slate-300 text-sm">{mistake.warning}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 품질 vs 예산 비교 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              품질 vs <span className="text-blue-400">예산 비교</span>
            </h2>
            <p className="text-slate-300 text-lg">각 예산대별 품질 수준을 비교해보세요</p>
          </div>
          
          <div className="max-w-6xl mx-auto overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div className="font-bold text-white text-center">구분</div>
                <div className="font-bold text-green-400 text-center">경제형</div>
                <div className="font-bold text-blue-400 text-center">표준형</div>
                <div className="font-bold text-purple-400 text-center">고급형</div>
                <div className="font-bold text-yellow-400 text-center">추천사항</div>
              </div>
              
              {qualityVsBudget.map((comparison, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 py-4 bg-white/5 rounded-xl mb-2 hover:bg-white/10 transition-all duration-300">
                  <div className="text-white font-semibold text-center">{comparison.aspect}</div>
                  <div className="text-slate-300 text-center text-sm">{comparison.economy}</div>
                  <div className="text-slate-300 text-center text-sm">{comparison.standard}</div>
                  <div className="text-slate-300 text-center text-sm">{comparison.premium}</div>
                  <div className="text-slate-300 text-center text-sm">{comparison.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              <span className="text-blue-400">합리적인 가격</span>으로 도배하세요!
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              품질은 유지하면서도 예산에 맞는<br />
              최적의 도배 솔루션을 제안해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <DollarSignIcon className="w-6 h-6" />
                저렴한 견적 받기
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/customer-support"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <PhoneIcon className="w-6 h-6" />
                비용 상담
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
            "@type": "WebPage",
            "name": "저렴한 도배 - 합리적인 가격의 도배 서비스",
            "description": "품질은 유지하면서도 합리적인 가격으로 도배 시공받는 방법",
            "mainEntity": {
              "@type": "HowTo",
              "name": "도배 비용 절약 방법",
              "step": savingMethods.map((method, index) => ({
                "@type": "HowToStep",
                "position": index + 1,
                "name": method.method,
                "text": method.description
              }))
            }
          })
        }}
      />
    </div>
  );
}
