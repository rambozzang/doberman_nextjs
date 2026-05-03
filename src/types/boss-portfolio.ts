// 사장님 포트폴리오 타입 정의
// Flutter `lib/app/portfolio/model/portfolio_item.dart` 와
// `lib/repo/portfolio_repo.dart` 의 요청/응답 스키마를 1:1 매칭한다.

// 외부 링크
export interface PortfolioExternalLink {
  url: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  sortOrder?: number;
}

// 포트폴리오 이미지 (서버 응답/요청 공통)
export interface PortfolioImage {
  imageType: 'BEFORE' | 'AFTER';
  filePath: string;
  sortOrder?: number;
}

// 서버 응답에 들어오는 원시 포트폴리오 항목
// (Flutter PortfolioItem.fromJson 이 흡수하는 키 집합)
export interface BossPortfolioItem {
  id: string | number;
  custId?: string;
  title: string;
  description?: string | null;
  buildingType?: string | null;
  region?: string | null;
  area?: number | null;
  wallpaperType?: string | null;
  cost?: number | null;
  workDate?: string | null;   // yyyy-MM-dd
  createdAt?: string | null;  // ISO 또는 yyyy-MM-dd
  isPublic?: boolean | 'Y' | 'N';

  // 서버는 BEFORE/AFTER 가 섞인 images 배열로 내려준다
  images?: PortfolioImage[];
  // 일부 응답은 분리되어 내려올 수 있어 함께 지원
  beforeImages?: string[];
  afterImages?: string[];

  // 외부 링크
  links?: PortfolioExternalLink[];
  externalLinks?: PortfolioExternalLink[];
}

// 생성/수정 요청 페이로드 (Flutter _toCreateRequest / _toUpdateRequest 동일)
export interface BossPortfolioCreateRequest {
  custId: string;
  title: string;
  description?: string | null;
  buildingType?: string | null;
  region?: string | null;
  area?: number | null;
  wallpaperType?: string | null;
  cost?: number | null;
  workDate: string;          // yyyy-MM-dd
  isPublic: 'Y' | 'N';
  images: PortfolioImage[];
  links: PortfolioExternalLink[];
}

export interface BossPortfolioUpdateRequest extends BossPortfolioCreateRequest {
  id: number;
}

// 폼에서 사용하는 정규화된 모델
export interface BossPortfolioForm {
  title: string;
  description: string;
  buildingType: string;
  region: string;
  area: string;        // input value
  wallpaperType: string;
  cost: string;        // input value
  workDate: string;    // yyyy-MM-dd
  isPublic: boolean;
  beforeImages: string[];
  afterImages: string[];
  externalLinks: PortfolioExternalLink[];
}
