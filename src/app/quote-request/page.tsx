"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, Sparkles, MapPin, Home, Calendar, User } from "lucide-react";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CreateCustomerRequestRequest, UserInfo } from "@/types/api";
import { AuthManager } from "@/lib/auth";
import SocialAuthService from '@/services/socialAuthService';
import { toast } from 'react-hot-toast';

// 폼 데이터 저장 키
const QUOTE_FORM_STORAGE_KEY = 'quote_request_form_data';
const PENDING_SUBMIT_KEY = 'quote_request_pending_submit';

// 단계 정의
const steps = [
  { id: 'step-1', title: '건물 유형', fields: ['buildingType'], icon: Home, description: '시공할 건물의 종류를 알려주세요' },
  { id: 'step-2', title: '시공 위치', fields: ['constructionScope'], icon: MapPin, description: '어느 공간을 시공하실 계획인가요?' },
  { id: 'step-3', title: '시공 면적', fields: ['area'], icon: Sparkles, description: '정확한 견적을 위해 면적을 알려주세요' },
  { id: 'step-4', title: '벽지 종류', fields: ['wallpaperType'], icon: Sparkles, description: '원하시는 벽지 종류를 선택해주세요' },
  { id: 'step-5', title: '추가 요청사항', fields: ['additionalRequest', 'visitDate'], icon: Calendar, description: '추가 서비스나 방문 일정을 알려주세요' },
  { id: 'step-6', title: '지역 선택', fields: ['region'], icon: MapPin, description: '시공 지역을 선택해주세요' },
  { id: 'step-7', title: '고객 정보', fields: ['name', 'phone', 'email', 'password'], icon: User, description: '견적 및 상담을 위한 연락처 정보를 입력해주세요' },
];

// 옵션 데이터
const buildingTypes = [
  { value: 'apartment', label: '아파트', icon: '🏢', description: '아파트' },
  { value: 'billa', label: '빌라', icon: '🏢', description: '빌라' },
  { value: 'officetel', label: '오피스텔', icon: '🏢', description: '오피스텔' },
  { value: 'house', label: '단독주택', icon: '🏠', description: '단독주택, 전원주택' },
  { value: 'office', label: '사무실', icon: '🏢', description: '사무실, 업무공간' },
  { value: 'commercial', label: '상가', icon: '🏪', description: '상가, 매장, 카페' },
  { value: 'other', label: '기타', icon: '🏗️', description: '기타 건물 유형' },
];

// 추후 구현될 옵션들
const constructionScopes = [
  { value: 'living-room', label: '거실', icon: '🛋️', description: '거실 전체 도배' },
  { value: 'room', label: '방', icon: '🛏️', description: '방 도배 (개수 선택 가능)' },
  { value: 'kitchen', label: '주방', icon: '🍳', description: '주방 도배' },
  { value: 'bathroom', label: '화장실', icon: '🚿', description: '화장실 도배' },
  { value: 'all-rooms', label: '전체', icon: '🏠', description: '집 전체 도배' },
];

const wallpaperTypes = [
  { value: 'vinyl', label: '합지벽지', icon: '📋', description: '가장 일반적인 벽지', price: '저렴' },
  { value: 'fabric', label: '실크벽지', icon: '🧵', description: '고급스러운 질감', price: '중간' },
  { value: 'silk-vinyl', label: '실크 + 합지', icon: '🎨', description: '실크와 합지의 조합', price: '중간' },
  { value: 'natural', label: '천연벽지', icon: '🌿', description: '친환경 소재', price: '비싸' },
  { value: 'premium', label: '수입벽지', icon: '✨', description: '프리미엄 디자인', price: '매우 비싸' },
];

const additionalRequests = [
  { value: 'furniture-move', label: '가구 이동 서비스', icon: '📦' },
  { value: 'old-removal', label: '기존 벽지 제거', icon: '🗑️' },
  { value: 'wall-repair', label: '벽면 보수', icon: '🔨' },
  { value: 'quick-service', label: '당일 시공', icon: '⚡' },
];

// 정적 헬퍼 함수들 (useEffect에서 사용하기 위해 컴포넌트 외부에 정의)
const getBuildingTypeLabelStatic = (value: string): string => {
  const item = buildingTypes.find(type => type.value === value);
  return item ? `[${item.label}]` : "";
};

const getConstructionScopeLabelsStatic = (values: string[], roomCount?: number): string => {
  const labels = values.map(value => {
    const item = constructionScopes.find(scope => scope.value === value);
    if (!item) return "";
    if (value === 'room' && roomCount) {
      return `[${item.label} ${roomCount}개]`;
    }
    return `[${item.label}]`;
  }).filter(label => label !== "");
  return labels.join(',');
};

const getWallpaperTypeLabelStatic = (value: string): string => {
  const item = wallpaperTypes.find(type => type.value === value);
  return item ? `[${item.label}]` : "";
};

const getAdditionalRequestLabelsStatic = (values: string[]): string => {
  const labels = values.map(value => {
    const item = additionalRequests.find(req => req.value === value);
    return item ? item.label : "";
  }).filter(label => label !== "");
  return labels.join(', ');
};

const regionData = [
  {
    id: "seoul",
    name: "서울특별시",
    icon: "🏙️",
    districts: [
      { id: "gangnam", name: "강남구" },
      { id: "gangdong", name: "강동구" },
      { id: "gangbuk", name: "강북구" },
      { id: "gangseo", name: "강서구" },
      { id: "gwanak", name: "관악구" },
      { id: "gwangjin", name: "광진구" },
      { id: "guro", name: "구로구" },
      { id: "geumcheon", name: "금천구" },
      { id: "nowon", name: "노원구" },
      { id: "dobong", name: "도봉구" },
      { id: "dongdaemun", name: "동대문구" },
      { id: "dongjak", name: "동작구" },
      { id: "mapo", name: "마포구" },
      { id: "seodaemun", name: "서대문구" },
      { id: "seocho", name: "서초구" },
      { id: "seongdong", name: "성동구" },
      { id: "seongbuk", name: "성북구" },
      { id: "songpa", name: "송파구" },
      { id: "yangcheon", name: "양천구" },
      { id: "yeongdeungpo", name: "영등포구" },
      { id: "yongsan", name: "용산구" },
      { id: "eunpyeong", name: "은평구" },
      { id: "jongno", name: "종로구" },
      { id: "jung", name: "중구" },
      { id: "jungnang", name: "중랑구" }
    ]
  },
  {
    id: "busan",
    name: "부산광역시",
    icon: "🌊",
    districts: [
      { id: "gangseo-busan", name: "강서구" },
      { id: "geumjeong", name: "금정구" },
      { id: "gijang", name: "기장군" },
      { id: "nam", name: "남구" },
      { id: "dong", name: "동구" },
      { id: "dongnae", name: "동래구" },
      { id: "busanjin", name: "부산진구" },
      { id: "buk", name: "북구" },
      { id: "sasang", name: "사상구" },
      { id: "saha", name: "사하구" },
      { id: "seo", name: "서구" },
      { id: "suyeong", name: "수영구" },
      { id: "yeonje", name: "연제구" },
      { id: "yeongdo", name: "영도구" },
      { id: "jung-busan", name: "중구" },
      { id: "haeundae", name: "해운대구" }
    ]
  },
  {
    id: "daegu",
    name: "대구광역시",
    icon: "🏔️",
    districts: [
      { id: "jung-daegu", name: "중구" },
      { id: "dong-daegu", name: "동구" },
      { id: "seo-daegu", name: "서구" },
      { id: "nam-daegu", name: "남구" },
      { id: "buk-daegu", name: "북구" },
      { id: "suseong", name: "수성구" },
      { id: "dalseo", name: "달서구" },
      { id: "dalseong", name: "달성군" },
      { id: "gunwi", name: "군위군" }
    ]
  },
  {
    id: "incheon",
    name: "인천광역시",
    icon: "✈️",
    districts: [
      { id: "jung-incheon", name: "중구" },
      { id: "dong-incheon", name: "동구" },
      { id: "michuhol", name: "미추홀구" },
      { id: "yeonsu", name: "연수구" },
      { id: "namdong", name: "남동구" },
      { id: "bupyeong", name: "부평구" },
      { id: "gyeyang", name: "계양구" },
      { id: "seo-incheon", name: "서구" },
      { id: "ganghwa", name: "강화군" },
      { id: "ongjin", name: "옹진군" }
    ]
  },
  {
    id: "gwangju",
    name: "광주광역시",
    icon: "🌸",
    districts: [
      { id: "dong-gwangju", name: "동구" },
      { id: "seo-gwangju", name: "서구" },
      { id: "nam-gwangju", name: "남구" },
      { id: "buk-gwangju", name: "북구" },
      { id: "gwangsan", name: "광산구" }
    ]
  },
  {
    id: "daejeon",
    name: "대전광역시",
    icon: "🚄",
    districts: [
      { id: "dong-daejeon", name: "동구" },
      { id: "jung-daejeon", name: "중구" },
      { id: "seo-daejeon", name: "서구" },
      { id: "yuseong", name: "유성구" },
      { id: "daedeok", name: "대덕구" }
    ]
  },
  {
    id: "ulsan",
    name: "울산광역시",
    icon: "🏭",
    districts: [
      { id: "jung-ulsan", name: "중구" },
      { id: "nam-ulsan", name: "남구" },
      { id: "dong-ulsan", name: "동구" },
      { id: "buk-ulsan", name: "북구" },
      { id: "ulju", name: "울주군" }
    ]
  },
  {
    id: "sejong",
    name: "세종특별자치시",
    icon: "🏛️",
    districts: [
      { id: "sejong-city", name: "세종시" }
    ]
  },
  {
    id: "gyeonggi",
    name: "경기도",
    icon: "🏘️",
    districts: [
      { id: "suwon", name: "수원시" },
      { id: "seongnam", name: "성남시" },
      { id: "uijeongbu", name: "의정부시" },
      { id: "anyang", name: "안양시" },
      { id: "bucheon", name: "부천시" },
      { id: "gwangmyeong", name: "광명시" },
      { id: "pyeongtaek", name: "평택시" },
      { id: "dongducheon", name: "동두천시" },
      { id: "ansan", name: "안산시" },
      { id: "goyang", name: "고양시" },
      { id: "gwacheon", name: "과천시" },
      { id: "guri", name: "구리시" },
      { id: "namyangju", name: "남양주시" },
      { id: "osan", name: "오산시" },
      { id: "siheung", name: "시흥시" },
      { id: "gunpo", name: "군포시" },
      { id: "uiwang", name: "의왕시" },
      { id: "hanam", name: "하남시" },
      { id: "yongin", name: "용인시" },
      { id: "paju", name: "파주시" },
      { id: "icheon", name: "이천시" },
      { id: "anseong", name: "안성시" },
      { id: "gimpo", name: "김포시" },
      { id: "hwaseong", name: "화성시" },
      { id: "gwangju-gyeonggi", name: "광주시" },
      { id: "yangju", name: "양주시" },
      { id: "pocheon", name: "포천시" },
      { id: "yeoju", name: "여주시" },
      { id: "yeoncheon", name: "연천군" },
      { id: "gapyeong", name: "가평군" },
      { id: "yangpyeong", name: "양평군" }
    ]
  },
  {
    id: "gangwon",
    name: "강원도",
    icon: "⛰️",
    districts: [
      { id: "chuncheon", name: "춘천시" },
      { id: "wonju", name: "원주시" },
      { id: "gangneung", name: "강릉시" },
      { id: "donghae", name: "동해시" },
      { id: "taebaek", name: "태백시" },
      { id: "sokcho", name: "속초시" },
      { id: "samcheok", name: "삼척시" },
      { id: "hongcheon", name: "홍천군" },
      { id: "hoengseong", name: "횡성군" },
      { id: "yeongwol", name: "영월군" },
      { id: "pyeongchang", name: "평창군" },
      { id: "jeongseon", name: "정선군" },
      { id: "cheorwon", name: "철원군" },
      { id: "hwacheon", name: "화천군" },
      { id: "yanggu", name: "양구군" },
      { id: "inje", name: "인제군" },
      { id: "goseong-gangwon", name: "고성군" },
      { id: "yangyang", name: "양양군" }
    ]
  },
  {
    id: "chungbuk",
    name: "충청북도",
    icon: "🏞️",
    districts: [
      { id: "cheongju", name: "청주시" },
      { id: "chungju", name: "충주시" },
      { id: "jecheon", name: "제천시" },
      { id: "boeun", name: "보은군" },
      { id: "okcheon", name: "옥천군" },
      { id: "yeongdong", name: "영동군" },
      { id: "jeungpyeong", name: "증평군" },
      { id: "jincheon", name: "진천군" },
      { id: "goesan", name: "괴산군" },
      { id: "eumseong", name: "음성군" },
      { id: "danyang", name: "단양군" }
    ]
  },
  {
    id: "chungnam",
    name: "충청남도",
    icon: "🌾",
    districts: [
      { id: "cheonan", name: "천안시" },
      { id: "gongju", name: "공주시" },
      { id: "boryeong", name: "보령시" },
      { id: "asan", name: "아산시" },
      { id: "seosan", name: "서산시" },
      { id: "nonsan", name: "논산시" },
      { id: "gyeryong", name: "계룡시" },
      { id: "dangjin", name: "당진시" },
      { id: "geumsan", name: "금산군" },
      { id: "buyeo", name: "부여군" },
      { id: "seocheon", name: "서천군" },
      { id: "cheongyang", name: "청양군" },
      { id: "hongseong", name: "홍성군" },
      { id: "yesan", name: "예산군" },
      { id: "taean", name: "태안군" }
    ]
  },
  {
    id: "jeonbuk",
    name: "전라북도",
    icon: "🍃",
    districts: [
      { id: "jeonju", name: "전주시" },
      { id: "gunsan", name: "군산시" },
      { id: "iksan", name: "익산시" },
      { id: "jeongeup", name: "정읍시" },
      { id: "namwon", name: "남원시" },
      { id: "gimje", name: "김제시" },
      { id: "wanju", name: "완주군" },
      { id: "jinan", name: "진안군" },
      { id: "muju", name: "무주군" },
      { id: "jangsu", name: "장수군" },
      { id: "imsil", name: "임실군" },
      { id: "sunchang", name: "순창군" },
      { id: "gochang", name: "고창군" },
      { id: "buan", name: "부안군" }
    ]
  },
  {
    id: "jeonnam",
    name: "전라남도",
    icon: "🌿",
    districts: [
      { id: "mokpo", name: "목포시" },
      { id: "yeosu", name: "여수시" },
      { id: "suncheon", name: "순천시" },
      { id: "naju", name: "나주시" },
      { id: "gwangyang", name: "광양시" },
      { id: "damyang", name: "담양군" },
      { id: "gokseong", name: "곡성군" },
      { id: "gurye", name: "구례군" },
      { id: "goheung", name: "고흥군" },
      { id: "boseong", name: "보성군" },
      { id: "hwasun", name: "화순군" },
      { id: "jangheung", name: "장흥군" },
      { id: "gangjin", name: "강진군" },
      { id: "haenam", name: "해남군" },
      { id: "yeongam", name: "영암군" },
      { id: "muan", name: "무안군" },
      { id: "hampyeong", name: "함평군" },
      { id: "yeonggwang", name: "영광군" },
      { id: "jangseong", name: "장성군" },
      { id: "wando", name: "완도군" },
      { id: "jindo", name: "진도군" },
      { id: "sinan", name: "신안군" }
    ]
  },
  {
    id: "gyeongbuk",
    name: "경상북도",
    icon: "⛰️",
    districts: [
      { id: "pohang", name: "포항시" },
      { id: "gyeongju", name: "경주시" },
      { id: "gimcheon", name: "김천시" },
      { id: "andong", name: "안동시" },
      { id: "gumi", name: "구미시" },
      { id: "yeongju", name: "영주시" },
      { id: "yeongcheon", name: "영천시" },
      { id: "sangju", name: "상주시" },
      { id: "mungyeong", name: "문경시" },
      { id: "gyeongsan", name: "경산시" },
      { id: "uiseong", name: "의성군" },
      { id: "cheongsong", name: "청송군" },
      { id: "yeongyang", name: "영양군" },
      { id: "yeongdeok", name: "영덕군" },
      { id: "cheongdo", name: "청도군" },
      { id: "goryeong", name: "고령군" },
      { id: "seongju", name: "성주군" },
      { id: "chilgok", name: "칠곡군" },
      { id: "yecheon", name: "예천군" },
      { id: "bonghwa", name: "봉화군" },
      { id: "uljin", name: "울진군" },
      { id: "ulleung", name: "울릉군" }
    ]
  },
  {
    id: "gyeongnam",
    name: "경상남도",
    icon: "🏔️",
    districts: [
      { id: "changwon", name: "창원시" },
      { id: "jinju", name: "진주시" },
      { id: "tongyeong", name: "통영시" },
      { id: "sacheon", name: "사천시" },
      { id: "gimhae", name: "김해시" },
      { id: "miryang", name: "밀양시" },
      { id: "geoje", name: "거제시" },
      { id: "yangsan", name: "양산시" },
      { id: "uiryeong", name: "의령군" },
      { id: "haman", name: "함안군" },
      { id: "changnyeong", name: "창녕군" },
      { id: "goseong-gyeongnam", name: "고성군" },
      { id: "namhae", name: "남해군" },
      { id: "hadong", name: "하동군" },
      { id: "sancheong", name: "산청군" },
      { id: "hamyang", name: "함양군" },
      { id: "geochang", name: "거창군" },
      { id: "hapcheon", name: "합천군" }
    ]
  },
  {
    id: "jeju",
    name: "제주특별자치도",
    icon: "🏝️",
    districts: [
      { id: "jeju-city", name: "제주시" },
      { id: "seogwipo", name: "서귀포시" }
    ]
  }
];

// regionData를 사용하는 정적 헬퍼 함수 (반드시 regionData 정의 이후에 위치해야 함)
const getRegionLabelStatic = (regionId: string, districtId: string): string => {
  const region = regionData.find(r => r.id === regionId);
  if (!region) return "";
  const district = region.districts.find(d => d.id === districtId);
  if (!district) return region.name;
  return `${region.name} ${district.name}`;
};

// 폼 상태 타입 정의
interface FormState {
  buildingType: string;
  constructionScope: string[];
  roomCount: number | undefined;
  area: { pyeong: number | undefined; squareMeter: number | undefined };
  wallpaperType: string;
  additionalRequest: string[];
  visitDate: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  region: string;
  district: string;
  privacyConsent: boolean;
}

const initialFormState: FormState = {
  buildingType: "",
  constructionScope: [],
  roomCount: undefined,
  area: { pyeong: undefined, squareMeter: undefined },
  wallpaperType: "",
  additionalRequest: [],
  visitDate: "",
  name: "",
  phone: "",
  email: "",
  password: "",
  address: "",
  region: "",
  district: "",
  privacyConsent: false,
};

export default function QuoteRequestPage() {
  const router = useRouter();
  const districtRef = useRef<HTMLDivElement>(null); // 구/군 선택 영역 참조
  const nameInputRef = useRef<HTMLInputElement>(null); // 이름 입력 필드 참조
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 제출 방지용
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false); // 자동 제출 처리 중
  // const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);

  // 폼 데이터를 localStorage에 저장
  const saveFormDataToStorage = useCallback((data: FormState) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUOTE_FORM_STORAGE_KEY, JSON.stringify(data));
    }
  }, []);

  // localStorage에서 폼 데이터 복원
  const loadFormDataFromStorage = useCallback((): FormState | null => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(QUOTE_FORM_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved) as FormState;
        } catch (e) {
          console.error('폼 데이터 파싱 오류:', e);
        }
      }
    }
    return null;
  }, []);

  // 저장된 폼 데이터 삭제
  const clearFormDataFromStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(QUOTE_FORM_STORAGE_KEY);
      localStorage.removeItem(PENDING_SUBMIT_KEY);
    }
  }, []);

  // 대기 중인 제출 표시 설정
  const setPendingSubmit = useCallback((pending: boolean) => {
    if (typeof window !== 'undefined') {
      if (pending) {
        localStorage.setItem(PENDING_SUBMIT_KEY, 'true');
      } else {
        localStorage.removeItem(PENDING_SUBMIT_KEY);
      }
    }
  }, []);

  // 대기 중인 제출이 있는지 확인
  const hasPendingSubmit = useCallback((): boolean => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(PENDING_SUBMIT_KEY) === 'true';
    }
    return false;
  }, []);

  // 로그인 상태 확인 및 pending submit 처리
  useEffect(() => {
    const checkLoginAndPendingSubmit = async () => {
      const loginStatus = AuthManager.isLoggedIn();
      const user = AuthManager.getUserInfo();
      setIsLoggedIn(loginStatus);
      setUserInfo(user);

      // pending submit이 있고 로그인된 상태면 자동 제출 처리
      if (hasPendingSubmit() && loginStatus && user) {
        const savedFormData = loadFormDataFromStorage();
        if (savedFormData) {
          console.log('페이지 로드 시 pending submit 발견, 자동 제출 처리');
          setIsAutoSubmitting(true);
          toast.loading('견적 신청을 처리 중입니다...', {
            id: 'auto-submit-load',
            duration: 10000,
          });

          try {
            // API 요청 데이터 구성
            const requestData: CreateCustomerRequestRequest = {
              webCustomerId: user.customerId,
              buildingType: getBuildingTypeLabelStatic(savedFormData.buildingType),
              constructionLocation: getConstructionScopeLabelsStatic(savedFormData.constructionScope, savedFormData.roomCount),
              roomCount: savedFormData.roomCount || 0,
              area: savedFormData.area.pyeong || 0,
              areaSize: savedFormData.area.squareMeter || 0,
              wallpaper: getWallpaperTypeLabelStatic(savedFormData.wallpaperType),
              ceiling: "전체",
              specialInfo: getAdditionalRequestLabelsStatic(savedFormData.additionalRequest),
              specialInfoDetail: "",
              hasItems: savedFormData.additionalRequest.includes('furniture-move') ? "짐이 있음" : "",
              preferredDate: savedFormData.visitDate,
              preferredDateDetail: savedFormData.visitDate ? "원하는 날짜가 있어요" : "",
              region: getRegionLabelStatic(savedFormData.region, savedFormData.district),
              customerName: user.customerName,
              customerPhone: user.customerPhone,
              customerEmail: user.customerEmail,
              customerPassword: user.customerPassword,
              agreeTerms: savedFormData.privacyConsent,
              requestDate: new Date().toISOString(),
              status: "검토중",
              etc1: "",
              etc2: "",
              etc3: ""
            };

            const response = await CustomerRequestService.createCustomerRequest(requestData);

            if (response.success) {
              toast.dismiss('auto-submit-load');
              toast.success('견적 요청이 완료되었습니다!', {
                duration: 2000,
                position: 'top-center',
              });
              clearFormDataFromStorage();
              setIsComplete(true);
            } else {
              toast.dismiss('auto-submit-load');
              toast.error(response.message || '견적 요청 중 오류가 발생했습니다.', {
                duration: 3000,
                position: 'top-center',
              });
              clearFormDataFromStorage();
            }
          } catch (error) {
            console.error('자동 제출 오류:', error);
            toast.dismiss('auto-submit-load');
            toast.error('견적 요청 중 오류가 발생했습니다.', {
              duration: 3000,
              position: 'top-center',
            });
            clearFormDataFromStorage();
          } finally {
            setIsAutoSubmitting(false);
          }
        } else {
          // 폼 데이터가 없으면 pending submit 플래그만 삭제
          clearFormDataFromStorage();
        }
      }
    };

    checkLoginAndPendingSubmit();
  }, [hasPendingSubmit, loadFormDataFromStorage, clearFormDataFromStorage]);

  // 팝업창으로부터 메시지 수신 처리
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // 보안을 위해 origin 확인
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'GOOGLE_LOGIN_SUCCESS' || event.data.type === 'KAKAO_LOGIN_SUCCESS' || event.data.type === 'NAVER_LOGIN_SUCCESS') {
        toast.success('소셜 로그인이 완료되었습니다!', {
          duration: 2000,
          position: 'top-center',
        });

        // 로그인 상태 업데이트
        const loginStatus = AuthManager.isLoggedIn();
        const user = AuthManager.getUserInfo();
        setIsLoggedIn(loginStatus);
        setUserInfo(user);

        // 대기 중인 제출이 있는지 확인
        if (hasPendingSubmit()) {
          // 저장된 폼 데이터 복원
          const savedFormData = loadFormDataFromStorage();
          if (savedFormData && loginStatus && user) {
            setIsAutoSubmitting(true);
            toast.loading('견적 신청을 처리 중입니다...', {
              id: 'auto-submit',
              duration: 5000,
            });

            // 폼 데이터 복원 후 자동 제출
            try {
              // API 요청 데이터 구성 (정적 헬퍼 함수 사용)
              const requestData: CreateCustomerRequestRequest = {
                webCustomerId: user.customerId,
                buildingType: getBuildingTypeLabelStatic(savedFormData.buildingType),
                constructionLocation: getConstructionScopeLabelsStatic(savedFormData.constructionScope, savedFormData.roomCount),
                roomCount: savedFormData.roomCount || 0,
                area: savedFormData.area.pyeong || 0,
                areaSize: savedFormData.area.squareMeter || 0,
                wallpaper: getWallpaperTypeLabelStatic(savedFormData.wallpaperType),
                ceiling: "전체",
                specialInfo: getAdditionalRequestLabelsStatic(savedFormData.additionalRequest),
                specialInfoDetail: "",
                hasItems: savedFormData.additionalRequest.includes('furniture-move') ? "짐이 있음" : "",
                preferredDate: savedFormData.visitDate,
                preferredDateDetail: savedFormData.visitDate ? "원하는 날짜가 있어요" : "",
                region: getRegionLabelStatic(savedFormData.region, savedFormData.district),
                customerName: user.customerName,
                customerPhone: user.customerPhone,
                customerEmail: user.customerEmail,
                customerPassword: user.customerPassword,
                agreeTerms: savedFormData.privacyConsent,
                requestDate: new Date().toISOString(),
                status: "검토중",
                etc1: "",
                etc2: "",
                etc3: ""
              };

              const response = await CustomerRequestService.createCustomerRequest(requestData);

              if (response.success) {
                toast.dismiss('auto-submit');
                toast.success('견적 요청이 완료되었습니다!', {
                  duration: 2000,
                  position: 'top-center',
                });
                clearFormDataFromStorage();
                setIsComplete(true);
              } else {
                toast.dismiss('auto-submit');
                toast.error(response.message || '견적 요청 중 오류가 발생했습니다.', {
                  duration: 3000,
                  position: 'top-center',
                });
                clearFormDataFromStorage();
              }
            } catch (error) {
              console.error('자동 제출 오류:', error);
              toast.dismiss('auto-submit');
              toast.error('견적 요청 중 오류가 발생했습니다.', {
                duration: 3000,
                position: 'top-center',
              });
              clearFormDataFromStorage();
            } finally {
              setIsAutoSubmitting(false);
            }
          } else {
            clearFormDataFromStorage();
          }
        }
      } else if (event.data.type === 'GOOGLE_LOGIN_ERROR' || event.data.type === 'KAKAO_LOGIN_ERROR' || event.data.type === 'NAVER_LOGIN_ERROR') {
        toast.error(event.data.error || '로그인 중 오류가 발생했습니다.', {
          duration: 3000,
          position: 'top-center',
        });
        // 로그인 실패 시 저장된 데이터 삭제
        clearFormDataFromStorage();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentStep, hasPendingSubmit, loadFormDataFromStorage, clearFormDataFromStorage]);

  // 고객정보 단계로 넘어갈 때 스크롤 최상단 이동 및 이름 필드 포커스
  useEffect(() => {
    if (currentStep === 6) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // 모바일에서 로그인하지 않은 경우 이름 입력 필드에 포커스
      if (!isLoggedIn && window.innerWidth < 1024) {
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 300); // 스크롤 후 포커스
      }
    }
  }, [currentStep, isLoggedIn]);

  // 로그인 상태에 따른 총 단계 수 계산 (로그인된 경우 고객정보 단계 제외)
  const totalSteps = isLoggedIn ? steps.length - 1 : steps.length;

  // 진행률 계산
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // 평수 변환 함수
  const calculateSquareMeters = (pyeong: number | undefined) => {
    if (!pyeong) return undefined;
    return parseFloat((pyeong * 3.305785).toFixed(2));
  };

  // 현재 단계 검증
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // 건물 유형
        return !!formState.buildingType;
      case 1: // 시공 위치
        const hasConstructionScope = formState.constructionScope.length > 0;
        const hasRoomSelected = formState.constructionScope.includes('room');
        const hasRoomCount = formState.roomCount && formState.roomCount > 0;

        // "방"이 선택된 경우 방 개수도 입력되어야 함
        if (hasRoomSelected && !hasRoomCount) {
          return false;
        }

        return hasConstructionScope;
      case 2: // 시공 면적
        return !!formState.area.pyeong;
      case 3: // 벽지 종류
        return !!formState.wallpaperType;
      case 4: // 추가 요청사항 (선택사항)
        return true;
      case 5: // 지역 선택
        return !!(formState.region && formState.district);
      case 6: // 고객 정보 (로그인된 경우 스킵)
        if (isLoggedIn) return true; // 로그인된 경우 항상 통과
        return !!(formState.name && formState.phone && formState.email && formState.password);
      default:
        return true;
    }
  };

  // 다음 단계로 이동
  const nextStep = () => {
    if (!validateCurrentStep()) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 이전 단계로 이동
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 단일 선택 단계에서 카드 클릭 시 자동으로 다음 단계로 진행
  // 선택 상태 시각 피드백을 잠시 보여준 후 이동
  const advanceToNextStep = useCallback(() => {
    setTimeout(() => {
      setCurrentStep((prev) => {
        const lastIndex = steps.length - 1;
        // 로그인 사용자는 6단계(고객정보) 스킵
        if (isLoggedIn && prev + 1 === 6) return prev + 2 > lastIndex ? lastIndex : prev + 2;
        return prev + 1 > lastIndex ? lastIndex : prev + 1;
      });
    }, 250);
  }, [isLoggedIn]);

  // value를 label로 변환하는 헬퍼 함수들
  const getBuildingTypeLabel = (value: string): string => {
    const item = buildingTypes.find(type => type.value === value);
    return item ? `[${item.label}]` : "";
  };

  const getConstructionScopeLabels = (values: string[], roomCount?: number): string => {
    const labels = values.map(value => {
      const item = constructionScopes.find(scope => scope.value === value);
      if (!item) return "";

      // "방"이 선택되고 방 개수가 있는 경우 개수 정보 추가
      if (value === 'room' && roomCount) {
        return `[${item.label} ${roomCount}개]`;
      }

      return `[${item.label}]`;
    }).filter(label => label !== "");
    return labels.join(',');
  };

  const getWallpaperTypeLabel = (value: string): string => {
    const item = wallpaperTypes.find(type => type.value === value);
    return item ? `[${item.label}]` : "";
  };

  const getAdditionalRequestLabels = (values: string[]): string => {
    const labels = values.map(value => {
      const item = additionalRequests.find(req => req.value === value);
      return item ? item.label : "";
    }).filter(label => label !== "");
    return labels.join(', ');
  };

  const getRegionLabel = (regionId: string, districtId: string): string => {
    const region = regionData.find(r => r.id === regionId);
    if (!region) return "";

    const district = region.districts.find(d => d.id === districtId);
    if (!district) return region.name;

    return `${region.name} ${district.name}`;
  };

  // 견적 요청 완료 처리
  const handleQuoteRequest = async () => {
    // 중복 제출 방지
    if (isSubmitting || isLoading) {
      console.log('이미 제출 중입니다. 잠시만 기다려주세요.');
      return;
    }

    if (!confirm('견적 요청을 신청하시겠습니까?')) {
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    try {
      // 로그인된 경우 사용자 정보 사용, 비로그인시 폼 데이터 사용
      const customerName = isLoggedIn && userInfo ? userInfo.customerName : formState.name;
      const customerPhone = isLoggedIn && userInfo ? userInfo.customerPhone : formState.phone;
      const customerEmail = isLoggedIn && userInfo ? userInfo.customerEmail : formState.email;
      const customerPassword = isLoggedIn && userInfo ? userInfo.customerPassword : formState.password;
      const webCustomerId = isLoggedIn && userInfo ? userInfo.customerId : 0;

      // API 요청 데이터 구성
      const requestData: CreateCustomerRequestRequest = {
        webCustomerId: webCustomerId,
        buildingType: getBuildingTypeLabel(formState.buildingType),
        constructionLocation: getConstructionScopeLabels(formState.constructionScope, formState.roomCount),
        roomCount: formState.roomCount || 0,
        area: formState.area.pyeong || 0,
        areaSize: formState.area.squareMeter || 0,
        wallpaper: getWallpaperTypeLabel(formState.wallpaperType),
        ceiling: "전체",
        specialInfo: getAdditionalRequestLabels(formState.additionalRequest),
        specialInfoDetail: "",
        hasItems: formState.additionalRequest.includes('furniture-move') ? "짐이 있음" : "",
        preferredDate: formState.visitDate,
        preferredDateDetail: formState.visitDate ? "원하는 날짜가 있어요" : "",
        region: getRegionLabel(formState.region, formState.district),
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        customerPassword: customerPassword,
        agreeTerms: formState.privacyConsent,
        requestDate: new Date().toISOString(),
        status: "검토중",
        etc1: "",
        etc2: "",
        etc3: ""
      };

      // 로그인 상태 확인
      const currentLoginStatus = AuthManager.isTokenValid();

      let response;
      if (currentLoginStatus) {
        response = await CustomerRequestService.createCustomerRequest(requestData);
      } else {
        response = await CustomerRequestService.createCustomerRequestNonLogin(requestData);
      }

      if (response.success) {
        console.log("견적 요청 성공:", response.data);
        setIsComplete(true);
      } else {
        console.error("견적 요청 실패:", response.message);
        alert(response.message || "견적 요청 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("제출 오류:", error);
      alert("견적 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 중복 제출 방지
    if (isSubmitting || isLoading) {
      return;
    }

    // 마지막 단계(고객정보 또는 지역선택)에서는 견적 요청 처리
    if ((isLoggedIn && currentStep === 5) || (!isLoggedIn && currentStep === 6)) {
      await handleQuoteRequest();
      return;
    }

    // 그 외에는 다음 단계로 이동
    nextStep();
  };

  // 폼 초기화
  const resetForm = () => {
    setFormState({
      buildingType: "",
      constructionScope: [],
      roomCount: undefined,
      area: { pyeong: undefined, squareMeter: undefined },
      wallpaperType: "",
      additionalRequest: [],
      visitDate: "",
      name: "",
      phone: "",
      email: "",
      password: "",
      address: "",
      region: "",
      district: "",
      privacyConsent: false,
    });
    setCurrentStep(0);
    setIsComplete(false);
    setIsSubmitting(false);
  };

  // 폼 필드 업데이트
  const updateField = (field: string, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'area') {
      if ((value as { pyeong?: number })?.pyeong) {
        setFormState(prev => ({
          ...prev,
          area: {
            ...prev.area,
            squareMeter: calculateSquareMeters((value as { pyeong?: number }).pyeong)
          }
        }));
      }
    }
  };

  // 체크박스 토글
  const toggleCheckbox = (field: string, value: string) => {
    setFormState(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];

      // "방"이 선택 해제되면 방 개수도 초기화
      const updatedState = {
        ...prev,
        [field]: newArray
      };

      if (field === 'constructionScope' && value === 'room' && !newArray.includes('room')) {
        updatedState.roomCount = undefined;
      }

      return updatedState;
    });
  };

  // 자동 제출 중 로딩 화면
  if (isAutoSubmitting) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="quote-main-content flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center py-8 md:py-12 px-4 pt-24">
          <div className="max-w-lg mx-auto text-center p-6 md:p-8">
            <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                견적 요청 처리 중...
              </span>
            </h2>

            <div className="mb-10">
              <p className="text-xl text-slate-200 mb-4 leading-relaxed">
                소셜 로그인이 완료되었습니다!
              </p>
              <p className="text-lg text-slate-300 leading-relaxed">
                잠시만 기다려주세요.<br />
                견적 요청을 자동으로 처리하고 있습니다.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="quote-main-content flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center py-8 md:py-12 px-4 pt-24">
          <div className="max-w-lg mx-auto text-center p-6 md:p-8">
            {/* 성공 아이콘 */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
              <div className="w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
                <CheckIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                🎉 견적 요청 완료!
              </span>
            </h2>

            <div className="mb-10">
              <p className="text-xl text-slate-200 mb-4 leading-relaxed">
                견적 요청이 성공적으로 완료되었습니다!
              </p>
              <p className="text-lg text-slate-300 leading-relaxed">
                전문가들이 검토 후 <span className="text-blue-300 font-semibold">24시간 내</span>에<br />
                맞춤 견적을 제공해드릴 예정입니다.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 md:px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-base md:text-lg rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 min-h-[48px] hover:scale-105"
              >
                홈으로 돌아가기
              </button>

              <button
                onClick={resetForm}
                className="w-full px-6 md:px-8 py-4 bg-slate-700/50 hover:bg-slate-600/60 text-white font-semibold text-base md:text-lg rounded-xl border border-slate-600 hover:border-slate-500 backdrop-blur-sm transition-all duration-300 min-h-[48px] hover:scale-105"
              >
                새 견적 요청하기
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 빠른 링크 섹션 - 모바일에서는 숨김 */}
      <section className="hidden md:block w-full bg-gradient-to-br from-slate-900 via-blue-900/30 to-purple-900/30 pt-20 pb-4">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-base md:text-xl font-bold text-white mb-1">
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                견적 요청 서비스
              </span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">원하는 서비스를 선택해주세요</p>
          </div>

          {/* 카드들만 모바일에서 숨김 - 임시 주석 처리 */}
          {/* <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">견적 요청하기</h3>
                  <p className="text-slate-400 text-sm">새로운 도배 견적 요청</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                무료로 최대 5개의 견적을 받아보세요. 검증된 전문가들이 24시간 내에 연락드립니다.
              </p>
              <div className="text-blue-400 text-sm font-medium">여기서 시작 →</div>
            </div>

            <div
              onClick={() => router.push('/quote-request/list')}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mr-4">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">전체 견적 리스트</h3>
                  <p className="text-slate-400 text-sm">모든 견적 요청 보기</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                다른 고객들의 견적 요청을 확인하고 시장 가격을 파악해보세요.
              </p>
              <div className="text-emerald-400 text-sm font-medium">리스트 보기 →</div>
            </div>

            <div
              onClick={() => router.push('/quote-request/my-quotes')}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">내 견적 요청</h3>
                  <p className="text-slate-400 text-sm">내가 요청한 견적 관리</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                내가 요청한 견적들을 확인하고 진행 상황을 관리하세요.
              </p>
              <div className="text-purple-400 text-sm font-medium">내 견적 보기 →</div>
            </div>
          </div> */}
        </div>
      </section>

      {/* 모바일 상단 네비게이션 */}
      <div className="quote-mobile-nav lg:hidden w-full pt-16">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2 hover:scale-110 hover:rotate-5 transition-transform duration-300">
                    {(() => {
                      const Icon = steps[currentStep].icon;
                      return <Icon className="w-3 h-3 text-white" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">
                      {steps[currentStep].title}
                    </span>
                    <div className="text-xs text-blue-300">
                      {currentStep + 1}/{steps.length}단계
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-blue-400">
                    {Math.round(progress)}%
                  </div>
                  <div className="text-xs text-slate-400">완료</div>
                </div>
              </div>
              <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>




      {/* 메인 콘텐츠 영역 */}
      <main className="quote-main-content flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800 pt-4 md:pt-0">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* 왼쪽 사이드바 - 데스크톱에서만 표시 */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        견적 요청
                      </h2>
                      <p className="text-xs text-blue-200">
                        빠르고 정확하게
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-white">진행률</span>
                    <span className="text-xs font-bold text-blue-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <nav className="space-y-2">
                  {steps.map((step, index) => {
                    // 로그인된 경우 고객정보 단계(6번) 스킵
                    if (isLoggedIn && index === 6) return null;

                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isSkipped = isLoggedIn && index === 6;

                    return (
                      <div
                        key={step.id}
                        className={`relative flex items-center p-3 rounded-xl transition-all duration-300 ${isActive
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg'
                          : isCompleted
                            ? 'bg-green-500/10 border border-green-400/30'
                            : isSkipped
                              ? 'bg-slate-600/20 border border-slate-500/20 opacity-50'
                              : 'bg-slate-800/30 border border-slate-600/30 hover:bg-slate-700/30'
                          }`}
                      >
                        <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isActive
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25'
                          : isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25'
                            : isSkipped
                              ? 'bg-slate-500 shadow-md opacity-50'
                              : 'bg-slate-600 shadow-md'
                          }`}>
                          {isCompleted ? (
                            <CheckIcon className="w-4 h-4 text-white" />
                          ) : (
                            <Icon className="w-4 h-4 text-white" />
                          )}
                        </div>

                        <div className="ml-3 flex-1 relative">
                          <div className={`text-xs font-semibold transition-colors duration-300 ${isActive ? 'text-white' : isCompleted ? 'text-green-300' : isSkipped ? 'text-slate-400' : 'text-slate-300'
                            }`}>
                            {step.title}
                            {isSkipped && isLoggedIn && <span className="ml-2 text-xs text-blue-300">(스킵됨)</span>}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {isSkipped && isLoggedIn ? "로그인 정보 사용" : step.description}
                          </div>
                        </div>

                        <div className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive
                          ? 'bg-blue-500 text-white'
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : isSkipped
                              ? 'bg-slate-500 text-slate-300 opacity-50'
                              : 'bg-slate-600 text-slate-300'
                          }`}>
                          {index + 1}
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-2 col-span-full">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl mb-20 lg:mb-0">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-10">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 mr-3">
                          {(() => {
                            const Icon = steps[currentStep].icon;
                            return <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />;
                          })()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{steps[currentStep].title}</h3>
                          <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">{steps[currentStep].description}</p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                          <span className="text-sm font-bold text-blue-300">
                            {currentStep + 1}/{steps.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 sm:hidden">{steps[currentStep].description}</p>
                  </div>

                  <div className="mb-6 md:mb-8">
                    {/* 1단계: 건물 유형 */}
                    {currentStep === 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {buildingTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`group relative p-2 md:p-3 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 min-h-[65px] md:min-h-[70px] hover:scale-105 hover:-translate-y-1 ${formState.buildingType === type.value
                              ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                              : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                              }`}
                            onClick={() => {
                              updateField('buildingType', type.value);
                              advanceToNextStep();
                            }}
                          >
                            {formState.buildingType === type.value && (
                              <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <CheckIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                              </div>
                            )}

                            <div className="relative mb-1 md:mb-2">
                              <div className={`text-lg md:text-xl mb-1 transition-transform duration-300 ${formState.buildingType === type.value ? 'scale-110' : 'group-hover:scale-105'
                                }`}>
                                {type.icon}
                              </div>
                            </div>

                            <div className="relative">
                              <h4 className={`text-xs md:text-sm font-bold mb-0.5 transition-colors duration-300 ${formState.buildingType === type.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                                }`}>
                                {type.label}
                              </h4>
                              <p className={`text-xs leading-tight transition-colors duration-300 ${formState.buildingType === type.value ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                                }`}>
                                {type.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2단계: 시공 위치 */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                          {constructionScopes.map((scope) => (
                            <div
                              key={scope.value}
                              className={`group relative p-3 md:p-4 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 min-h-[90px] md:min-h-[100px] hover:scale-105 hover:-translate-y-1 ${formState.constructionScope.includes(scope.value)
                                ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                }`}
                              onClick={() => toggleCheckbox('constructionScope', scope.value)}
                            >
                              {formState.constructionScope.includes(scope.value) && (
                                <div className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                  <CheckIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                </div>
                              )}

                              <div className="relative mb-2 md:mb-3">
                                <div className={`text-xl md:text-2xl mb-1 transition-transform duration-300 ${formState.constructionScope.includes(scope.value) ? 'scale-110' : 'group-hover:scale-105'
                                  }`}>
                                  {scope.icon}
                                </div>
                              </div>

                              <div className="relative">
                                <h4 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${formState.constructionScope.includes(scope.value) ? 'text-white' : 'text-white group-hover:text-blue-200'
                                  }`}>
                                  {scope.label}
                                </h4>
                                <p className={`text-xs leading-relaxed transition-colors duration-300 ${formState.constructionScope.includes(scope.value) ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                                  }`}>
                                  {scope.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 방 개수 입력 필드 - "방"이 선택되었을 때만 표시 */}
                        {formState.constructionScope.includes('room') && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-500/10 border border-blue-400/30 rounded-xl p-3 animate-in slide-in-from-top duration-300">
                            <div className="flex  items-center mb-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white text-sm font-bold">🛏️</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white">방 개수 입력</h4>
                                <p className="text-sm text-blue-200">도배할 방의 개수를 입력해주세요</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                  방 개수 *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  placeholder="예: 3"
                                  value={formState.roomCount || ''}
                                  onChange={(e) => updateField('roomCount', parseInt(e.target.value) || undefined)}
                                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3단계: 시공 면적 */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              평수 입력
                            </label>
                            <input
                              type="number"
                              placeholder="예: 25"
                              value={formState.area.pyeong || ''}
                              onChange={(e) => updateField('area', {
                                pyeong: parseFloat(e.target.value) || undefined,
                                squareMeter: formState.area.squareMeter
                              })}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              제곱미터 (자동 계산)
                            </label>
                            <input
                              type="text"
                              value={formState.area.squareMeter ? `${formState.area.squareMeter}㎡` : ''}
                              readOnly
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-300 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4단계: 벽지 종류 */}
                    {currentStep === 3 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {wallpaperTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`group relative p-3 md:p-4 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 min-h-[100px] md:min-h-[110px] hover:scale-105 hover:-translate-y-1 ${formState.wallpaperType === type.value
                              ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                              : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                              }`}
                            onClick={() => {
                              updateField('wallpaperType', type.value);
                              advanceToNextStep();
                            }}
                          >
                            {formState.wallpaperType === type.value && (
                              <div className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <CheckIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                              </div>
                            )}

                            <div className="relative mb-2 md:mb-3">
                              <div className={`text-xl md:text-2xl mb-1 transition-transform duration-300 ${formState.wallpaperType === type.value ? 'scale-110' : 'group-hover:scale-105'
                                }`}>
                                {type.icon}
                              </div>
                            </div>

                            <div className="relative">
                              <h4 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${formState.wallpaperType === type.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                                }`}>
                                {type.label}
                              </h4>
                              <p className={`text-xs leading-relaxed mb-1 transition-colors duration-300 ${formState.wallpaperType === type.value ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                                }`}>
                                {type.description}
                              </p>
                              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${type.price === '저렴' ? 'bg-green-500/20 text-green-300' :
                                type.price === '중간' ? 'bg-yellow-500/20 text-yellow-300' :
                                  type.price === '비싸' ? 'bg-orange-500/20 text-orange-300' :
                                    'bg-red-500/20 text-red-300'
                                }`}>
                                {type.price}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 5단계: 추가 요청사항 */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-white mb-3">추가 서비스 (선택사항)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                            {additionalRequests.map((request) => (
                              <div
                                key={request.value}
                                className={`group relative p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 min-h-[56px] hover:scale-[1.02] ${formState.additionalRequest.includes(request.value)
                                  ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25'
                                  : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                  }`}
                                onClick={() => toggleCheckbox('additionalRequest', request.value)}
                              >
                                {formState.additionalRequest.includes(request.value) && (
                                  <div className="absolute top-2 right-2 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <CheckIcon className="w-2 h-2 text-white" />
                                  </div>
                                )}

                                <div className="flex items-center">
                                  <div className={`text-base mr-3 transition-transform duration-300 ${formState.additionalRequest.includes(request.value) ? 'scale-110' : 'group-hover:scale-105'
                                    }`}>
                                    {request.icon}
                                  </div>
                                  <h4 className={`text-sm font-semibold transition-colors duration-300 ${formState.additionalRequest.includes(request.value) ? 'text-white' : 'text-white group-hover:text-blue-200'
                                    }`}>
                                    {request.label}
                                  </h4>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            방문 희망 날짜 (선택사항)
                          </label>
                          <input
                            type="date"
                            value={formState.visitDate}
                            onChange={(e) => updateField('visitDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-blue-400 focus:outline-none transition-colors input-mobile"
                          />
                        </div>
                      </div>
                    )}

                    {/* 6단계: 지역 선택 */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <div>
                          {/* 선택된 지역 표시 */}
                          {formState.region && formState.district && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                    <CheckIcon className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-blue-300">선택된 지역</p>
                                    <p className="text-lg font-bold text-white">
                                      {regionData.find(r => r.id === formState.region)?.name} {regionData.find(r => r.id === formState.region)?.districts.find(d => d.id === formState.district)?.name}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    updateField('region', '');
                                    updateField('district', '');
                                  }}
                                  className="text-sm text-blue-300 hover:text-blue-200 underline"
                                >
                                  다시 선택
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 시/도 선택 */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              시/도 선택 *
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-2">
                              {regionData.map((region) => (
                                <button
                                  key={region.id}
                                  type="button"
                                  onClick={() => {
                                    updateField('region', region.id);
                                    updateField('district', ''); // 구/군 초기화

                                    // 모바일에서 구/군 선택 영역으로 스크롤
                                    setTimeout(() => {
                                      if (districtRef.current && window.innerWidth < 1024) {
                                        const element = districtRef.current;
                                        const yOffset = -120; // 헤더와 여유 공간을 위한 오프셋
                                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

                                        window.scrollTo({
                                          top: y,
                                          behavior: 'smooth'
                                        });
                                      }
                                    }, 150);
                                  }}
                                  className={`relative py-4 px-3 border-2 rounded-lg transition-all duration-300 hover:scale-[1.02] min-h-[80px] ${formState.region === region.id
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25'
                                    : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60'
                                    }`}
                                >
                                  {formState.region === region.id && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                      <CheckIcon className="w-2 h-2 text-white" />
                                    </div>
                                  )}
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="text-xl mb-1">{region.icon}</div>
                                    <span className={`text-sm font-semibold ${formState.region === region.id ? 'text-white' : 'text-slate-200'
                                      }`}>
                                      {region.name}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 구/군 선택 - 시/도가 선택된 경우만 표시 */}
                          {formState.region && (
                            <div ref={districtRef} className="animate-in slide-in-from-top duration-300">
                              <label className="block text-sm font-medium text-white mb-3">
                                구/군 선택 *
                              </label>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {regionData.find(r => r.id === formState.region)?.districts.map((district) => (
                                  <button
                                    key={district.id}
                                    type="button"
                                    onClick={() => {
                                      updateField('district', district.id);
                                      advanceToNextStep();
                                    }}
                                    className={`relative py-2 px-2 border-2 rounded-lg transition-all duration-300 hover:scale-[1.02] min-h-[50px] ${formState.district === district.id
                                      ? 'border-green-400 bg-gradient-to-br from-green-500/20 to-emerald-500/20 shadow-lg shadow-green-500/25'
                                      : 'border-slate-600/50 hover:border-green-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60'
                                      }`}
                                  >
                                    {formState.district === district.id && (
                                      <div className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                        <CheckIcon className="w-2 h-2 text-white" />
                                      </div>
                                    )}
                                    <div className="flex items-center justify-center">
                                      <span className={`text-xs font-semibold text-center ${formState.district === district.id ? 'text-white' : 'text-slate-200'
                                        }`}>
                                        {district.name}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 7단계: 고객 정보 (로그인된 경우 스킵) */}
                    {currentStep === 6 && !isLoggedIn && (
                      <div className="space-y-6">
                        {/* 소셜 로그인 섹션 */}
                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-2xl p-6">
                          <div className="text-center mb-4">
                            <h4 className="text-sm font-semibold text-white mb-1">빠른 가입하기</h4>
                            <p className="text-xs text-slate-400">소셜 계정으로 간편하게 가입하세요</p>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {/* Google 로그인 버튼 */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  // 소셜 로그인 전에 현재 폼 데이터 저장
                                  saveFormDataToStorage(formState);
                                  setPendingSubmit(true);
                                  await SocialAuthService.initiateGoogleLogin();
                                } catch (error) {
                                  console.error('Google 로그인 시작 오류:', error);
                                  // 팝업 차단 등 실제 오류인 경우에만 저장된 데이터 삭제
                                  const errorMessage = error instanceof Error ? error.message : '';
                                  if (errorMessage.includes('팝업') || errorMessage.includes('차단')) {
                                    clearFormDataFromStorage();
                                    toast.error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', {
                                      duration: 3000,
                                      position: 'top-center',
                                    });
                                  }
                                  // 로그인 취소나 타임아웃은 무시 (페이지 로드 시 처리)
                                }
                              }}
                              className="flex items-center justify-center p-3 bg-white/10 hover:bg-white/20 border border-slate-500 rounded-xl transition-all duration-200 group hover:scale-105"
                              title="Google로 시작하기"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.09,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.941l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-1.85,4.216-3.197,5.849l0,0l6.373,5.103C37.007,36.067,44,29.24,44,20.083z" />
                              </svg>
                            </button>

                            {/* Kakao 로그인 버튼 */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  // 소셜 로그인 전에 현재 폼 데이터 저장
                                  saveFormDataToStorage(formState);
                                  setPendingSubmit(true);
                                  await SocialAuthService.initiateKakaoLogin();
                                } catch (error) {
                                  console.error('Kakao 로그인 시작 오류:', error);
                                  // 팝업 차단 등 실제 오류인 경우에만 저장된 데이터 삭제
                                  const errorMessage = error instanceof Error ? error.message : '';
                                  if (errorMessage.includes('팝업') || errorMessage.includes('차단')) {
                                    clearFormDataFromStorage();
                                    toast.error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', {
                                      duration: 3000,
                                      position: 'top-center',
                                    });
                                  }
                                  // 로그인 취소나 타임아웃은 무시 (페이지 로드 시 처리)
                                }
                              }}
                              className="flex items-center justify-center p-3 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-500/50 rounded-xl text-yellow-300 transition-all duration-200 group hover:scale-105"
                              title="카카오로 시작하기"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                                <path fill="currentColor" d="M24 4c-11.046 0-20 7.402-20 16.534 0 6.206 4.136 11.575 10.242 14.205-.322 2.154-1.784 7.561-1.823 7.801 0 0-.062.548.356.691.418.143 1.017-.252 1.635-.779 1.771-1.542 9.436-8.329 12.879-11.379 2.159.177 4.353.271 6.711.271 11.046 0 20-7.402 20-16.534C44 11.402 35.046 4 24 4z" />
                              </svg>
                            </button>

                            {/* Naver 로그인 버튼 */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  // 소셜 로그인 전에 현재 폼 데이터 저장
                                  saveFormDataToStorage(formState);
                                  setPendingSubmit(true);
                                  await SocialAuthService.initiateNaverLogin();
                                } catch (error) {
                                  console.error('Naver 로그인 시작 오류:', error);
                                  // 팝업 차단 등 실제 오류인 경우에만 저장된 데이터 삭제
                                  const errorMessage = error instanceof Error ? error.message : '';
                                  if (errorMessage.includes('팝업') || errorMessage.includes('차단')) {
                                    clearFormDataFromStorage();
                                    toast.error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', {
                                      duration: 3000,
                                      position: 'top-center',
                                    });
                                  }
                                  // 로그인 취소나 타임아웃은 무시 (페이지 로드 시 처리)
                                }
                              }}
                              className="flex items-center justify-center p-3 bg-[#03C75A]/20 hover:bg-[#03C75A]/30 border border-[#03C75A]/50 rounded-xl text-[#03C75A] transition-all duration-200 group hover:scale-105"
                              title="네이버로 시작하기"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                                <path fill="#03C75A" d="M44 24c0 11.045-8.955 20-20 20S4 35.045 4 24 12.955 4 24 4s20 8.955 20 20z" />
                                <path fill="#FFF" d="M15.5 15.5h6.5l8.5 12.5V15.5h6v17h-6.5l-8.5-12.5v12.5h-6v-17z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* 구분선 */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 border-t border-slate-600"></div>
                          <p className="text-xs text-slate-400 font-medium">또는 직접 입력</p>
                          <div className="flex-1 border-t border-slate-600"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              이름 *
                            </label>
                            <input
                              ref={nameInputRef}
                              type="text"
                              placeholder="홍길동"
                              value={formState.name}
                              onChange={(e) => updateField('name', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              핸드폰번호 *
                            </label>
                            <input
                              type="tel"
                              placeholder="(-) 없이 숫자만 입력 (예: 01012345678)"
                              value={formState.phone}
                              onChange={(e) => updateField('phone', e.target.value)}
                              maxLength={11}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              이메일 *
                            </label>
                            <input
                              type="email"
                              placeholder="example@email.com"
                              value={formState.email}
                              onChange={(e) => updateField('email', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              비밀번호 *
                            </label>
                            <input
                              type="password"
                              placeholder="비밀번호를 입력하세요"
                              value={formState.password}
                              onChange={(e) => updateField('password', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 로그인된 사용자를 위한 정보 표시 */}
                    {currentStep === 6 && isLoggedIn && userInfo && (
                      <div className="space-y-6">
                        <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">로그인된 사용자 정보</h4>
                              <p className="text-sm text-blue-200">아래 정보로 견적 요청이 진행됩니다</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-blue-200 mb-1">이름</label>
                              <div className="text-white font-semibold">{userInfo.customerName}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-200 mb-1">핸드폰번호</label>
                              <div className="text-white font-semibold">{userInfo.customerPhone}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-200 mb-1">이메일</label>
                              <div className="text-white font-semibold">{userInfo.customerEmail}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}


                  </div>

                </form>
              </div>
            </div>
          </div>

          {/* 네비게이션 버튼 - 완전히 독립적으로 모바일 하단 고정 */}
          <div className="fixed lg:hidden bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-900 via-slate-900 to-slate-900/95 border-t border-white/10 pt-3 pb-3 px-4 backdrop-blur-xl shadow-2xl">
            <div className="container mx-auto max-w-7xl">
              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`group relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 min-h-[48px] w-1/3 ${currentStep === 0
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600'
                    : 'bg-slate-700/50 hover:bg-slate-600/60 text-white border border-slate-600 hover:border-slate-500 backdrop-blur-sm shadow-lg hover:shadow-xl active:scale-95'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm">이전</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || isSubmitting || !validateCurrentStep()}
                  className={`group relative px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-xl min-h-[48px] w-2/3 ${isLoading || isSubmitting || !validateCurrentStep()
                    ? 'bg-slate-600/50 text-slate-300 cursor-not-allowed border border-slate-600'
                    : (isLoggedIn && currentStep === 5) || (!isLoggedIn && currentStep === 6)
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border border-green-400/50 hover:border-green-300/50 shadow-green-500/25 hover:shadow-green-500/40 active:scale-95'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-blue-400/50 hover:border-blue-300/50 shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    {isLoading || isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>신청 중...</span>
                      </>
                    ) : (isLoggedIn && currentStep === 5) || (!isLoggedIn && currentStep === 6) ? (
                      <>
                        <CheckIcon className="w-5 h-5 mr-2" />
                        <span>견적 신청하기</span>
                      </>
                    ) : (
                      <>
                        <span>다음 단계</span>
                        <ChevronRightIcon className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 데스크톱용 버튼 - 기존 위치 유지 */}
          <div className="hidden lg:block container mx-auto px-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-1"></div>
              <div className="lg:col-span-2">
                <div className="border-t border-white/10 pt-6">
                  <div className="flex justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className={`group relative px-4 py-4 rounded-xl font-semibold transition-all duration-300 min-h-[48px] w-1/3 ${currentStep === 0
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600'
                        : 'bg-slate-700/50 hover:bg-slate-600/60 text-white border border-slate-600 hover:border-slate-500 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105'
                        }`}
                    >
                      <div className="flex items-center justify-center">
                        <ChevronLeftIcon className="w-5 h-5 mr-2" />
                        <span className="text-base">이전</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || isSubmitting || !validateCurrentStep()}
                      className={`group relative px-4 py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-xl min-h-[48px] w-2/3 ${isLoading || isSubmitting || !validateCurrentStep()
                        ? 'bg-slate-600/50 text-slate-300 cursor-not-allowed border border-slate-600'
                        : (isLoggedIn && currentStep === 5) || (!isLoggedIn && currentStep === 6)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border border-green-400/50 hover:border-green-300/50 shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-blue-400/50 hover:border-blue-300/50 shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105'
                        }`}
                    >
                      <div className="flex items-center justify-center">
                        {isLoading || isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                            <span>신청 중...</span>
                          </>
                        ) : (isLoggedIn && currentStep === 5) || (!isLoggedIn && currentStep === 6) ? (
                          <>
                            <CheckIcon className="w-5 h-5 mr-3" />
                            <span>견적 신청하기</span>
                          </>
                        ) : (
                          <>
                            <span>다음 단계</span>
                            <ChevronRightIcon className="w-5 h-5 ml-3" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 