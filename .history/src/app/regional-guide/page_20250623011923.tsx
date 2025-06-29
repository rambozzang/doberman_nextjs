"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPinIcon, 
  UsersIcon, 
  CurrencyIcon, 
  TrendingUpIcon,
  StarIcon,
  PhoneIcon,
  // ClockIcon,
  HomeIcon,
  SearchIcon,
  //    FilterIcon,
  ChevronRightIcon,
  BuildingIcon,
  // CalendarIcon,
  // AwardIcon,
  MapIcon,
  BarChart3Icon,
  InfoIcon
} from "lucide-react";

// 지역별 데이터
const regionalData = [
  {
    id: "seoul",
    name: "서울특별시",
    region: "수도권",
    color: "from-blue-500 to-cyan-500",
    averagePrice: "45,000원/㎡",
    priceRange: "35,000 - 65,000원",
    expertCount: 45,
    rating: 4.8,
    completedProjects: 1250,
    popularTypes: ["아파트", "오피스텔", "빌라"],
    characteristics: [
      "높은 품질 요구사항",
      "다양한 디자인 선호", 
      "빠른 시공 일정 선호",
      "프리미엄 자재 선호"
    ],
    marketTrends: [
      "친환경 벽지 수요 증가",
      "모던/미니멀 스타일 인기",
      "온라인 견적 문의 증가",
      "당일 견적 서비스 선호"
    ],
    districts: [
      { name: "강남구", price: "55,000원/㎡", experts: 8 },
      { name: "서초구", price: "52,000원/㎡", experts: 6 },
      { name: "송파구", price: "48,000원/㎡", experts: 7 },
      { name: "마포구", price: "45,000원/㎡", experts: 5 },
      { name: "용산구", price: "50,000원/㎡", experts: 4 }
    ]
  },
  {
    id: "busan",
    name: "부산광역시",
    region: "영남권",
    color: "from-emerald-500 to-green-500",
    averagePrice: "38,000원/㎡",
    priceRange: "30,000 - 50,000원",
    expertCount: 28,
    rating: 4.7,
    completedProjects: 890,
    popularTypes: ["아파트", "주택", "상가"],
    characteristics: [
      "실용적 디자인 선호",
      "합리적 가격대 추구",
      "지역 전문가 선호",
      "전통적 패턴 선호"
    ],
    marketTrends: [
      "바다 테마 디자인 인기",
      "습도 대응 자재 수요",
      "리모델링 시장 성장",
      "가성비 중심 선택"
    ],
    districts: [
      { name: "해운대구", price: "42,000원/㎡", experts: 6 },
      { name: "부산진구", price: "38,000원/㎡", experts: 5 },
      { name: "동래구", price: "36,000원/㎡", experts: 4 },
      { name: "연제구", price: "40,000원/㎡", experts: 4 },
      { name: "남구", price: "35,000원/㎡", experts: 3 }
    ]
  },
  {
    id: "incheon",
    name: "인천광역시",
    region: "수도권",
    color: "from-purple-500 to-violet-500",
    averagePrice: "42,000원/㎡",
    priceRange: "32,000 - 55,000원",
    expertCount: 22,
    rating: 4.6,
    completedProjects: 650,
    popularTypes: ["아파트", "신축", "빌라"],
    characteristics: [
      "신도시 특화 서비스",
      "대형 평수 전문",
      "빠른 시공 속도",
      "모던 스타일 선호"
    ],
    marketTrends: [
      "신도시 개발 연계 수요",
      "대형 평수 시공 증가",
      "공항 접근성 활용",
      "서울 연계 서비스"
    ],
    districts: [
      { name: "연수구", price: "48,000원/㎡", experts: 5 },
      { name: "남동구", price: "42,000원/㎡", experts: 4 },
      { name: "부평구", price: "38,000원/㎡", experts: 4 },
      { name: "서구", price: "40,000원/㎡", experts: 3 },
      { name: "계양구", price: "44,000원/㎡", experts: 3 }
    ]
  },
  {
    id: "daegu",
    name: "대구광역시",
    region: "영남권",
    color: "from-amber-500 to-orange-500",
    averagePrice: "35,000원/㎡",
    priceRange: "28,000 - 45,000원",
    expertCount: 18,
    rating: 4.5,
    completedProjects: 520,
    popularTypes: ["아파트", "주택", "오피스텔"],
    characteristics: [
      "전통과 현대 조화",
      "계절별 맞춤 시공",
      "지역 밀착 서비스",
      "꼼꼼한 마감 처리"
    ],
    marketTrends: [
      "4계절 대응 자재 선호",
      "전통 한옥 스타일 관심",
      "에너지 효율 중시",
      "장기 보증 선호"
    ],
    districts: [
      { name: "수성구", price: "40,000원/㎡", experts: 4 },
      { name: "중구", price: "35,000원/㎡", experts: 3 },
      { name: "달서구", price: "32,000원/㎡", experts: 3 },
      { name: "북구", price: "30,000원/㎡", experts: 3 },
      { name: "동구", price: "33,000원/㎡", experts: 2 }
    ]
  },
  {
    id: "gwangju",
    name: "광주광역시",
    region: "호남권",
    color: "from-rose-500 to-pink-500",
    averagePrice: "33,000원/㎡",
    priceRange: "26,000 - 42,000원",
    expertCount: 15,
    rating: 4.6,
    completedProjects: 380,
    popularTypes: ["아파트", "주택", "근린생활시설"],
    characteristics: [
      "문화적 감성 반영",
      "예술적 디자인 선호",
      "따뜻한 색감 선호",
      "개성 있는 패턴 추구"
    ],
    marketTrends: [
      "예술 도시 컨셉 디자인",
      "문화재 보수 전문화",
      "친환경 자재 확산",
      "맞춤형 디자인 증가"
    ],
    districts: [
      { name: "서구", price: "35,000원/㎡", experts: 4 },
      { name: "북구", price: "32,000원/㎡", experts: 3 },
      { name: "광산구", price: "30,000원/㎡", experts: 3 },
      { name: "동구", price: "33,000원/㎡", experts: 2 },
      { name: "남구", price: "34,000원/㎡", experts: 2 }
    ]
  },
  {
    id: "daejeon",
    name: "대전광역시",
    region: "충청권",
    color: "from-teal-500 to-cyan-500",
    averagePrice: "36,000원/㎡",
    priceRange: "29,000 - 46,000원",
    expertCount: 16,
    rating: 4.5,
    completedProjects: 420,
    popularTypes: ["아파트", "연구시설", "오피스텔"],
    characteristics: [
      "과학도시 특화 서비스",
      "깔끔한 마감 선호",
      "기능성 중시",
      "심플한 디자인 선호"
    ],
    marketTrends: [
      "연구시설 특화 자재",
      "스마트홈 연계 시공",
      "미래형 디자인 선호",
      "친환경 인증 자재"
    ],
    districts: [
      { name: "유성구", price: "40,000원/㎡", experts: 4 },
      { name: "서구", price: "35,000원/㎡", experts: 3 },
      { name: "중구", price: "36,000원/㎡", experts: 3 },
      { name: "동구", price: "32,000원/㎡", experts: 2 },
      { name: "대덕구", price: "38,000원/㎡", experts: 2 }
    ]
  }
];

const regions = ["전체", "수도권", "영남권", "호남권", "충청권"];

export default function RegionalGuidePage() {
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 지역 필터링
  const filteredData = regionalData.filter(city => {
    const matchesRegion = selectedRegion === "전체" || city.region === selectedRegion;
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         city.districts.some(district => 
                           district.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesRegion && matchesSearch;
  });

  const selectedCityData = selectedCity ? regionalData.find(city => city.id === selectedCity) : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/50 relative overflow-hidden pt-20">
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl shadow-indigo-500/25"
            >
              <MapIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold text-white mb-4"
            >
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                지역별 도배 가이드
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              전국 주요 지역별 도배 시장 정보와<br />
              맞춤형 전문가를 찾아보세요
            </motion.p>

            {/* 검색 및 필터 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                {/* 검색창 */}
                <div className="relative mb-6">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="지역명 또는 구/군명으로 검색하세요"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
                  />
                </div>

                {/* 지역 필터 */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {regions.map((region) => (
                    <motion.button
                      key={region}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        selectedRegion === region
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/20'
                      }`}
                    >
                      {region}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <motion.main 
        className="flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="container mx-auto px-4 py-12">
          {!selectedCity ? (
            <>
              {/* 지역별 카드 그리드 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
              >
                {filteredData.map((city, index) => (
                  <motion.div
                    key={city.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedCity(city.id)}
                  >
                    <div className="p-6">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-12 h-12 bg-gradient-to-br ${city.color} rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                            <MapPinIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{city.name}</h3>
                            <span className="text-sm text-slate-400">{city.region}</span>
                          </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                      </div>

                      {/* 통계 정보 */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <CurrencyIcon className="w-4 h-4 text-indigo-400 mr-1" />
                            <span className="text-xs text-slate-400">평균 가격</span>
                          </div>
                          <span className="text-white font-semibold">{city.averagePrice}</span>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <UsersIcon className="w-4 h-4 text-emerald-400 mr-1" />
                            <span className="text-xs text-slate-400">전문가</span>
                          </div>
                          <span className="text-white font-semibold">{city.expertCount}명</span>
                        </div>
                      </div>

                      {/* 평점 및 완료 프로젝트 */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-white font-semibold">{city.rating}</span>
                          <span className="text-slate-400 text-sm ml-1">평점</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-semibold">{city.completedProjects.toLocaleString()}</span>
                          <span className="text-slate-400 text-sm ml-1">완료</span>
                        </div>
                      </div>

                      {/* 인기 유형 */}
                      <div className="flex flex-wrap gap-2">
                        {city.popularTypes.map((type, typeIndex) => (
                          <span
                            key={typeIndex}
                            className="px-3 py-1 bg-white/10 text-slate-300 text-xs rounded-full"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* 전국 통계 요약 */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold text-white mb-6 text-center">전국 도배 시장 현황</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    {
                      icon: MapPinIcon,
                      title: "서비스 지역",
                      value: "6개 광역시",
                      color: "from-blue-500 to-cyan-500"
                    },
                    {
                      icon: UsersIcon,
                      title: "총 전문가",
                      value: "144명",
                      color: "from-emerald-500 to-green-500"
                    },
                    {
                      icon: HomeIcon,
                      title: "완료 프로젝트",
                      value: "4,110건",
                      color: "from-purple-500 to-violet-500"
                    },
                    {
                      icon: StarIcon,
                      title: "평균 만족도",
                      value: "4.6점",
                      color: "from-amber-500 to-orange-500"
                    }
                  ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4 + index * 0.1 }}
                        className="text-center"
                      >
                        <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-white font-semibold mb-1">{stat.title}</h4>
                        <p className="text-2xl font-bold text-indigo-300">{stat.value}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            </>
          ) : (
            /* 상세 지역 정보 */
            <AnimatePresence mode="wait">
              {selectedCityData && (
                <motion.div
                  key={selectedCity}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* 뒤로가기 버튼 */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedCity(null)}
                    className="flex items-center text-slate-300 hover:text-white mb-8 transition-colors duration-300"
                  >
                    <ChevronRightIcon className="w-5 h-5 mr-2 rotate-180" />
                    지역 목록으로 돌아가기
                  </motion.button>

                  {/* 지역 상세 헤더 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8"
                  >
                    <div className="flex items-center mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${selectedCityData.color} rounded-2xl flex items-center justify-center mr-6 shadow-lg`}>
                        <MapPinIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedCityData.name}</h2>
                        <span className="text-lg text-slate-300">{selectedCityData.region}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                          <CurrencyIcon className="w-5 h-5 text-indigo-400 mr-2" />
                          <span className="text-slate-400">평균 가격</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{selectedCityData.averagePrice}</span>
                        <p className="text-sm text-slate-400 mt-1">{selectedCityData.priceRange}</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                          <UsersIcon className="w-5 h-5 text-emerald-400 mr-2" />
                          <span className="text-slate-400">전문가 수</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{selectedCityData.expertCount}명</span>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                          <StarIcon className="w-5 h-5 text-yellow-400 mr-2" />
                          <span className="text-slate-400">평균 평점</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{selectedCityData.rating}</span>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                          <HomeIcon className="w-5 h-5 text-purple-400 mr-2" />
                          <span className="text-slate-400">완료 프로젝트</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{selectedCityData.completedProjects.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 지역 특성 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <InfoIcon className="w-5 h-5 mr-2 text-indigo-400" />
                        지역 특성
                      </h3>
                      <div className="space-y-3">
                        {selectedCityData.characteristics.map((char, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                            <span className="text-slate-300">{char}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* 시장 동향 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <TrendingUpIcon className="w-5 h-5 mr-2 text-emerald-400" />
                        시장 동향
                      </h3>
                      <div className="space-y-3">
                        {selectedCityData.marketTrends.map((trend, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                            <span className="text-slate-300">{trend}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* 인기 유형 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <BuildingIcon className="w-5 h-5 mr-2 text-purple-400" />
                        인기 시공 유형
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {selectedCityData.popularTypes.map((type, index) => (
                          <span
                            key={index}
                            className={`px-4 py-2 bg-gradient-to-r ${selectedCityData.color} text-white rounded-lg font-semibold`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </motion.div>

                    {/* 구/군별 정보 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <BarChart3Icon className="w-5 h-5 mr-2 text-amber-400" />
                        구/군별 현황
                      </h3>
                      <div className="space-y-3">
                        {selectedCityData.districts.map((district, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <span className="text-white font-semibold">{district.name}</span>
                            <div className="flex items-center space-x-4">
                              <span className="text-slate-300">{district.price}</span>
                              <span className="text-indigo-300">{district.experts}명</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* 하단 문의 섹션 */}
        {!selectedCity && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="border-t border-white/10 py-16"
          >
            <div className="container mx-auto px-4 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8, duration: 0.6 }}
                className="max-w-3xl mx-auto"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/25">
                  <PhoneIcon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  지역별 맞춤 상담
                </h3>
                
                <p className="text-slate-300 mb-8 leading-relaxed">
                  각 지역의 특성을 잘 아는 전문가와 상담하고<br />
                  최적의 도배 서비스를 받아보세요
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl shadow-lg transition-all duration-300"
                >
                  지역별 전문가 상담받기
                </motion.button>
              </motion.div>
            </div>
          </motion.section>
        )}
      </motion.main>
    </div>
  );
} 