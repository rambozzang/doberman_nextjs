"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPinIcon, 
  StarIcon,
  SearchIcon,
  ChevronRightIcon,
  BuildingIcon,
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
      <section className="w-full bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
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
              className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-5 shadow-2xl shadow-indigo-500/25"
            >
              <MapIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-4xl font-bold text-white mb-3"
            >
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                지역별 가이드
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              지역별 도배 시세와 전문가 정보를 확인하고<br />
              합리적인 선택을 위한 가이드를 받아보세요
            </motion.p>
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
        <div className="container mx-auto px-4 py-10">
          {/* 필터 및 검색 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* 지역 필터 */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {regions.map(region => (
                    <motion.button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                        selectedRegion === region 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {region}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 검색창 */}
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="도시 또는 지역구 이름으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 지역 목록 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="lg:col-span-1 h-[600px] overflow-y-auto pr-2 space-y-3"
            >
              {filteredData.map(city => (
                <motion.div
                  key={city.id}
                  onClick={() => setSelectedCity(city.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedCity === city.id 
                      ? `bg-gradient-to-r ${city.color} shadow-xl text-white`
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold">{city.name}</h3>
                      <p className={`text-xs ${selectedCity === city.id ? 'text-white/80' : 'text-slate-400'}`}>{city.region}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold mr-2">{city.averagePrice}</span>
                      <ChevronRightIcon className="w-4 h-4 opacity-70" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* 상세 정보 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="lg:col-span-2"
            >
              <AnimatePresence mode="wait">
                {selectedCityData ? (
                  <motion.div
                    key={selectedCityData.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
                  >
                    {/* 상단 정보 */}
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex-1">
                        <div className={`mb-3 w-12 h-12 bg-gradient-to-br ${selectedCityData.color} rounded-xl flex items-center justify-center`}>
                          <BuildingIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">{selectedCityData.name}</h2>
                        <p className="text-slate-400 text-sm">{selectedCityData.region}</p>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white/5 p-3 rounded-lg">
                          <p className="text-slate-400 text-xs mb-1">평균 시세</p>
                          <p className="text-white font-semibold text-base">{selectedCityData.averagePrice}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                          <p className="text-slate-400 text-xs mb-1">시세 범위</p>
                          <p className="text-white font-semibold text-base">{selectedCityData.priceRange}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                          <p className="text-slate-400 text-xs mb-1">등록 전문가</p>
                          <p className="text-white font-semibold text-base">{selectedCityData.expertCount}명</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                          <p className="text-slate-400 text-xs mb-1">평균 평점</p>
                          <p className="text-white font-semibold text-base flex items-center">
                            <StarIcon className="w-3.5 h-3.5 text-yellow-400 mr-1" fill="currentColor" />
                            {selectedCityData.rating}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 지역 특징 & 시장 동향 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="bg-white/5 p-4 rounded-lg">
                        <h4 className="font-semibold text-white mb-2 flex items-center">
                          <InfoIcon className="w-4 h-4 mr-2" /> 지역 특징
                        </h4>
                        <ul className="space-y-1.5">
                          {selectedCityData.characteristics.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <ChevronRightIcon className="w-3 h-3 text-slate-500 mr-1.5 mt-1 flex-shrink-0" />
                              <span className="text-slate-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <h4 className="font-semibold text-white mb-2 flex items-center">
                          <BarChart3Icon className="w-4 h-4 mr-2" /> 시장 동향
                        </h4>
                        <ul className="space-y-1.5">
                          {selectedCityData.marketTrends.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <ChevronRightIcon className="w-3 h-3 text-slate-500 mr-1.5 mt-1 flex-shrink-0" />
                              <span className="text-slate-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 주요 지역구 정보 */}
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-2" /> 주요 지역구 정보
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-white/10">
                            <tr>
                              <th className="p-2.5 font-medium">지역구</th>
                              <th className="p-2.5 font-medium">평균 시세</th>
                              <th className="p-2.5 font-medium">전문가 수</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCityData.districts.map(district => (
                              <tr key={district.name} className="border-b border-white/10 last:border-0">
                                <td className="p-2.5">{district.name}</td>
                                <td className="p-2.5">{district.price}</td>
                                <td className="p-2.5">{district.experts}명</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center h-[600px] bg-white/5 rounded-2xl"
                  >
                    <MapIcon className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">지역을 선택하세요</h3>
                    <p className="text-slate-400 text-sm">왼쪽 목록에서 지역을 선택하면 상세 정보를 볼 수 있습니다.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
} 