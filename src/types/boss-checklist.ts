// 사장님(boss) 체크리스트 관련 타입 정의
// Flutter `lib/app/check_list/model/check_data.dart` 와 1:1 매칭

// 방 정보 (정사이즈, 천장, 벽)
export interface RoomInfo {
  defSize: string;
  skySize: string;
  wallSize: string;
}

// 체크리스트 데이터
// Flutter CheckData 와 동일 필드명 유지 (서버 호환)
export interface CheckData {
  customerId: string;
  roomsInfo: RoomInfo[];
  housingType: string;
  areaType: string;
  areaText: string;
  oldWallPage: string[];
  extendTypes: string[];
  artWallType: string;
  zimYn: string;
  umulSky: string[];
  balconyTypes: string[];
  systemTypes: string[];
  virusStatus: string;
  virusText: string;
  moldingStatus: string;
  moldingText: string;
  lightStatus: string;
  lightText: string;
  concentCoverTypes: string[];
  livingRoomText: string;
  roomHeight: string;
  livingRoomHeight: string;
  wallPage: string;
  ceilingPage: string;
  wallPageNum: string;
  artWallPrice: string;
  floorPage: string;
  floorPageLength: string;
  floorPrice: string;
  totalPrice: string;
  prePayment: string;
  balance: string;
  bigo: string;
}

// 칩(선택지) 데이터 모델
// Flutter `lib/app/check_list/widget/chip_widget.dart` CustomChipData 매칭
export interface ChipItem {
  title: string;
  type: string;
  isSelected: boolean;
}

// 빈 CheckData 생성 헬퍼
export const createEmptyCheckData = (customerId = ''): CheckData => ({
  customerId,
  roomsInfo: [
    { defSize: '', skySize: '', wallSize: '' },
    { defSize: '', skySize: '', wallSize: '' },
    { defSize: '', skySize: '', wallSize: '' },
    { defSize: '', skySize: '', wallSize: '' },
  ],
  housingType: '',
  areaType: '',
  areaText: '',
  oldWallPage: [],
  extendTypes: [],
  artWallType: '',
  zimYn: '',
  umulSky: [],
  balconyTypes: [],
  systemTypes: [],
  virusStatus: '',
  virusText: '',
  moldingStatus: '',
  moldingText: '',
  lightStatus: '',
  lightText: '',
  concentCoverTypes: [],
  livingRoomText: '',
  roomHeight: '',
  livingRoomHeight: '',
  wallPage: '',
  ceilingPage: '',
  wallPageNum: '',
  artWallPrice: '',
  floorPage: '',
  floorPageLength: '',
  floorPrice: '',
  totalPrice: '',
  prePayment: '',
  balance: '',
  bigo: '',
});

// 칩 상수 - Flutter ChipDataConstants 매칭
export const CHIP_HOUSING_TYPE: ChipItem[] = [
  { title: '아파트', type: '1', isSelected: false },
  { title: '주택', type: '2', isSelected: false },
  { title: '빌라', type: '3', isSelected: false },
  { title: '원,투룸', type: '4', isSelected: false },
  { title: '오피스텔', type: '5', isSelected: false },
  { title: '상가', type: '6', isSelected: false },
  { title: '그외', type: '7', isSelected: false },
];

export const CHIP_OLD_WALL_PAGE: ChipItem[] = [
  { title: '합지', type: '1', isSelected: false },
  { title: '실크', type: '2', isSelected: false },
  { title: '장폭', type: '3', isSelected: false },
  { title: '소폭', type: '4', isSelected: false },
  { title: '방염', type: '5', isSelected: false },
  { title: '기타', type: '6', isSelected: false },
];

export const CHIP_AREA: ChipItem[] = [
  { title: '공급면적', type: '1', isSelected: false },
  { title: '전용면적', type: '2', isSelected: false },
];

export const CHIP_EXTEND_TYPE: ChipItem[] = [
  { title: '없음', type: '99', isSelected: false },
  { title: '거실', type: '1', isSelected: false },
  { title: '안방', type: '2', isSelected: false },
  { title: '방2', type: '3', isSelected: false },
  { title: '방3', type: '4', isSelected: false },
  { title: '방4', type: '5', isSelected: false },
];

export const CHIP_ART_WALL_TYPE: ChipItem[] = [
  { title: '없음', type: '99', isSelected: false },
  { title: '도배', type: '1', isSelected: false },
];

export const CHIP_ZIM_YN: ChipItem[] = [
  { title: '없음', type: '99', isSelected: false },
  { title: '있음', type: '1', isSelected: false },
];

export const CHIP_UMUL_SKY: ChipItem[] = [
  { title: '없음', type: '99', isSelected: false },
  { title: '우물', type: '1', isSelected: false },
  { title: '이중', type: '2', isSelected: false },
];

export const CHIP_BALCONY: ChipItem[] = [
  { title: '없음', type: '99', isSelected: false },
  { title: '거실', type: '1', isSelected: false },
  { title: '안방', type: '2', isSelected: false },
  { title: '방2', type: '3', isSelected: false },
  { title: '방3', type: '4', isSelected: false },
];

export const CHIP_SYSTEM: ChipItem[] = [
  { title: '없음', type: '99', isSelected: false },
  { title: '시공안함', type: '1', isSelected: false },
  { title: '드레스', type: '2', isSelected: false },
  { title: '팬트리', type: '3', isSelected: false },
  { title: '파우더', type: '4', isSelected: false },
];

export const CHIP_VIRUS: ChipItem[] = [
  { title: '이상없음', type: '99', isSelected: false },
];

export const CHIP_MOLDING: ChipItem[] = [
  { title: '이상없음', type: '99', isSelected: false },
];

export const CHIP_LIGHT: ChipItem[] = [
  { title: '이상없음', type: '99', isSelected: false },
];

export const CHIP_CONCENT_COVER: ChipItem[] = [
  { title: '없음', type: '99', isSelected: false },
  { title: '거실', type: '1', isSelected: false },
  { title: '안방', type: '2', isSelected: false },
  { title: '방2', type: '3', isSelected: false },
  { title: '방3', type: '4', isSelected: false },
];
