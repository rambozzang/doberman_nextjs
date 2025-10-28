import { Metadata } from "next";
import Link from "next/link";
import { 
  LayersIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  FileTextIcon,
  ShieldCheckIcon,
  PhoneIcon,
  HomeIcon,
  PaletteIcon,
  SparklesIcon,
  LeafIcon,
  ZapIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "도배 종류 | 벽지 종류별 특징과 선택 가이드 - 도베르만",
  description: "도배 종류가 궁금하신가요? 일반지, 실크지, 합지 등 다양한 벽지 종류별 특징과 장단점을 상세히 비교해드립니다.",
  keywords: "도배종류, 벽지종류, 일반지, 실크지, 합지, 벽지선택, 벽지비교, 벽지특징, 인테리어벽지, 고급벽지",
  openGraph: {
    title: "도배 종류 | 벽지 종류별 특징과 선택 가이드",
    description: "일반지, 실크지, 합지 등 다양한 벽지 종류별 특징과 선택 가이드",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://www.doberman.kr/도배-종류"
  }
};

export default function DobaeJongryuPage() {
  const wallpaperTypes = [
    {
      type: "일반지 (합성수지계)",
      description: "가장 일반적이고 경제적인 벽지",
      priceRange: "평당 8,000-12,000원",
      durability: "3-5년",
      features: [
        "경제적인 가격",
        "다양한 디자인과 색상",
        "시공이 쉬움",
        "교체가 용이함"
      ],
      pros: [
        "저렴한 비용",
        "풍부한 디자인 선택",
        "초보자도 시공 가능"
      ],
      cons: [
        "상대적으로 짧은 수명",
        "고급스러움 부족",
        "내구성 한계"
      ],
      bestFor: "원룸, 임대주택, 경제적 리모델링",
      icon: HomeIcon,
      color: "from-green-500 to-emerald-500"
    },
    {
      type: "실크지 (부직포계)",
      description: "부드러운 질감과 고급스러운 마감",
      priceRange: "평당 12,000-18,000원",
      durability: "5-8년",
      features: [
        "부드러운 질감",
        "우수한 통기성",
        "고급스러운 외관",
        "적당한 두께감"
      ],
      pros: [
        "뛰어난 질감",
        "좋은 내구성",
        "고급스러운 느낌"
      ],
      cons: [
        "높은 가격",
        "시공 난이도 증가",
        "패턴 매칭 필요"
      ],
      bestFor: "거실, 침실, 고급 인테리어",
      icon: SparklesIcon,
      color: "from-blue-500 to-cyan-500"
    },
    {
      type: "합지 (직물계)",
      description: "최고급 벽지로 뛰어난 품질과 내구성",
      priceRange: "평당 18,000-25,000원",
      durability: "8-12년",
      features: [
        "최고급 소재",
        "뛰어난 내구성",
        "우수한 단열 효과",
        "프리미엄 디자인"
      ],
      pros: [
        "최고의 품질",
        "긴 수명",
        "단열 및 방음 효과"
      ],
      cons: [
        "높은 비용",
        "전문 시공 필요",
        "제한적인 디자인"
      ],
      bestFor: "고급 주택, 상업공간, 프리미엄 인테리어",
      icon: StarIcon,
      color: "from-purple-500 to-violet-500"
    }
  ];

  const functionalTypes = [
    {
      type: "항균 벽지",
      description: "세균 번식을 억제하는 특수 코팅",
      benefits: ["세균 억제", "위생적", "병원/어린이방 적합"],
      icon: ShieldCheckIcon,
      color: "from-green-500 to-teal-500"
    },
    {
      type: "방염 벽지",
      description: "화재 확산을 늦추는 난연 소재",
      benefits: ["화재 안전", "상업공간 필수", "안전성 우수"],
      icon: ZapIcon,
      color: "from-red-500 to-orange-500"
    },
    {
      type: "친환경 벽지",
      description: "유해물질 없는 천연 소재",
      benefits: ["무독성", "아토피 안전", "친환경 인증"],
      icon: LeafIcon,
      color: "from-green-400 to-emerald-400"
    },
    {
      type: "방수 벽지",
      description: "습기와 물에 강한 특수 처리",
      benefits: ["습기 차단", "곰팡이 방지", "화장실/주방 적합"],
      icon: ShieldCheckIcon,
      color: "from-blue-400 to-cyan-400"
    }
  ];

  const designTypes = [
    {
      category: "단색/무늬 없음",
      description: "깔끔하고 모던한 느낌",
      characteristics: ["심플한 디자인", "공간 확장 효과", "다양한 색상"],
      suitable: "모던 인테리어, 작은 공간"
    },
    {
      category: "스트라이프",
      description: "세로 줄무늬로 천장이 높아 보임",
      characteristics: ["수직 확장 효과", "클래식한 느낌", "다양한 폭"],
      suitable: "천장이 낮은 공간, 클래식 인테리어"
    },
    {
      category: "플로럴",
      description: "꽃무늬로 화사하고 우아한 분위기",
      characteristics: ["여성스러운 느낌", "화사한 분위기", "다양한 크기"],
      suitable: "침실, 거실, 여성 공간"
    },
    {
      category: "기하학적 패턴",
      description: "모던하고 세련된 느낌",
      characteristics: ["현대적 디자인", "강렬한 인상", "개성적"],
      suitable: "현대적 인테리어, 포인트 벽"
    },
    {
      category: "텍스처",
      description: "입체적인 질감으로 고급스러움",
      characteristics: ["입체감", "고급스러운 느낌", "조명 효과"],
      suitable: "고급 인테리어, 포인트 벽"
    }
  ];

  const spaceBasedSelection = [
    {
      space: "거실",
      recommendations: [
        "실크지 또는 합지 추천",
        "밝은 색상으로 공간 확장",
        "패턴은 절제된 것 선택"
      ],
      avoid: "너무 진한 색상, 복잡한 패턴"
    },
    {
      space: "침실",
      recommendations: [
        "부드러운 색조의 실크지",
        "플로럴이나 단색 추천",
        "안정감 있는 색상"
      ],
      avoid: "자극적인 색상, 큰 패턴"
    },
    {
      space: "아이방",
      recommendations: [
        "친환경 벽지 필수",
        "밝고 활기찬 색상",
        "교육적 패턴 고려"
      ],
      avoid: "어두운 색상, 날카로운 패턴"
    },
    {
      space: "화장실/주방",
      recommendations: [
        "방수 벽지 필수",
        "항균 처리된 제품",
        "청소가 쉬운 표면"
      ],
      avoid: "흡수성 높은 소재, 복잡한 패턴"
    }
  ];

  const selectionGuide = [
    {
      factor: "예산",
      lowBudget: "일반지 (8,000-12,000원/평)",
      midBudget: "실크지 (12,000-18,000원/평)",
      highBudget: "합지 (18,000-25,000원/평)"
    },
    {
      factor: "사용 기간",
      shortTerm: "일반지 (3-5년)",
      mediumTerm: "실크지 (5-8년)",
      longTerm: "합지 (8-12년)"
    },
    {
      factor: "공간 특성",
      residential: "실크지 추천",
      commercial: "합지 또는 기능성 벽지",
      special: "기능성 벽지 (항균, 방염 등)"
    }
  ];

  const trends2024 = [
    {
      trend: "자연주의 컬러",
      description: "어스톤, 베이지, 그린 등 자연에서 영감을 받은 색상",
      popularity: "95%"
    },
    {
      trend: "미니멀 패턴",
      description: "단순하고 절제된 패턴으로 깔끔한 느낌",
      popularity: "88%"
    },
    {
      trend: "텍스처 벽지",
      description: "입체적인 질감으로 공간에 깊이감 부여",
      popularity: "82%"
    },
    {
      trend: "친환경 소재",
      description: "건강을 생각한 무독성, 친환경 인증 제품",
      popularity: "90%"
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
              <LayersIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                도배 종류
              </span>
              <br />
              <span className="text-2xl md:text-4xl font-normal text-slate-300">
                완벽한 선택 가이드
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              일반지, 실크지, 합지 등 다양한 벽지 종류별<br />
              특징과 장단점을 상세히 비교해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <PaletteIcon className="w-6 h-6" />
                벽지 선택 상담
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

      {/* 주요 벽지 종류 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              주요 <span className="text-blue-400">벽지 종류</span>
            </h2>
            <p className="text-slate-300 text-lg">소재별 벽지의 특징과 장단점을 비교해보세요</p>
          </div>
          
          <div className="space-y-12">
            {wallpaperTypes.map((wallpaper, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* 기본 정보 */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${wallpaper.color} rounded-2xl`}>
                        <wallpaper.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{wallpaper.type}</h3>
                        <p className="text-slate-300">{wallpaper.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="text-blue-400 font-semibold text-sm mb-1">가격대</div>
                        <div className="text-white font-bold">{wallpaper.priceRange}</div>
                      </div>
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <div className="text-green-400 font-semibold text-sm mb-1">내구성</div>
                        <div className="text-white font-bold">{wallpaper.durability}</div>
                      </div>
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <div className="text-purple-400 font-semibold text-sm mb-1">적합한 공간</div>
                        <div className="text-white text-sm">{wallpaper.bestFor}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 특징 및 장단점 */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 주요 특징 */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">주요 특징</h4>
                        <ul className="space-y-2">
                          {wallpaper.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                              <CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* 장점 */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">장점</h4>
                        <ul className="space-y-2">
                          {wallpaper.pros.map((pro, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                              <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* 단점 */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">단점</h4>
                        <ul className="space-y-2">
                          {wallpaper.cons.map((con, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                              <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                              {con}
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

      {/* 기능성 벽지 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">기능성</span> 벽지
            </h2>
            <p className="text-slate-300 text-lg">특수 기능을 갖춘 전문 벽지들</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {functionalTypes.map((type, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl mb-4`}>
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">{type.type}</h3>
                <p className="text-slate-300 mb-4 text-sm">{type.description}</p>
                
                <ul className="space-y-2">
                  {type.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 디자인별 분류 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              디자인별 <span className="text-blue-400">벽지 분류</span>
            </h2>
            <p className="text-slate-300 text-lg">패턴과 디자인에 따른 벽지 선택 가이드</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {designTypes.map((design, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-3">{design.category}</h3>
                <p className="text-slate-300 mb-4">{design.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">특징</h4>
                  <ul className="space-y-1">
                    {design.characteristics.map((char, idx) => (
                      <li key={idx} className="text-slate-300 text-sm">• {char}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-blue-400 font-semibold text-sm mb-1">적합한 공간</div>
                  <div className="text-slate-300 text-sm">{design.suitable}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 공간별 선택 가이드 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              공간별 <span className="text-blue-400">선택 가이드</span>
            </h2>
            <p className="text-slate-300 text-lg">각 공간의 특성에 맞는 벽지 선택법</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {spaceBasedSelection.map((space, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <HomeIcon className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">{space.space}</h3>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-green-400 font-semibold mb-2">✅ 추천사항</h4>
                  <ul className="space-y-1">
                    {space.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-slate-300 text-sm">• {rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-red-400 font-semibold text-sm mb-1">❌ 피해야 할 것</div>
                  <div className="text-slate-300 text-sm">{space.avoid}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2024년 트렌드 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">2024년</span> 벽지 트렌드
            </h2>
            <p className="text-slate-300 text-lg">올해 가장 인기 있는 벽지 트렌드</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trends2024.map((trend, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{trend.trend}</h3>
                  <div className="text-blue-400 font-bold text-lg">{trend.popularity}</div>
                </div>
                <p className="text-slate-300 mb-4">{trend.description}</p>
                
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: trend.popularity }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 선택 가이드 요약 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              벽지 선택 <span className="text-blue-400">가이드 요약</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            {selectionGuide.map((guide, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 text-center">{guide.factor} 기준 선택</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="text-green-400 font-semibold mb-2">경제형</div>
                    <div className="text-white">{guide.lowBudget || guide.shortTerm || guide.residential}</div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="text-blue-400 font-semibold mb-2">중급형</div>
                    <div className="text-white">{guide.midBudget || guide.mediumTerm || guide.commercial}</div>
                  </div>
                  <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="text-purple-400 font-semibold mb-2">고급형</div>
                    <div className="text-white">{guide.highBudget || guide.longTerm || guide.special}</div>
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
              <span className="text-blue-400">맞춤 벽지 선택</span>이 어려우신가요?
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              전문가가 고객님의 공간과 취향에 맞는<br />
              최적의 벽지를 추천해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <PaletteIcon className="w-6 h-6" />
                벽지 선택 상담
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
            "@type": "WebPage",
            "name": "도배 종류 - 벽지 종류별 특징과 선택 가이드",
            "description": "일반지, 실크지, 합지 등 다양한 벽지 종류별 특징과 장단점 비교",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": wallpaperTypes.map((type, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": type.type,
                "description": type.description
              }))
            }
          })
        }}
      />
    </div>
  );
}
