export type BuildingType =
  | 'apartment' | 'villa' | 'officetel' | 'house'
  | 'office' | 'commercial' | 'other';

export type Scope =
  | 'living-room' | 'room' | 'kitchen' | 'bathroom' | 'all-rooms';

export type WallpaperType =
  | 'vinyl' | 'fabric' | 'silk-vinyl' | 'natural' | 'premium';

export type AdditionalRequest =
  | 'furniture-move' | 'old-removal' | 'wall-repair' | 'quick-service';

export interface QuoteSlots {
  buildingType?: BuildingType;
  scope?: Scope[];
  roomCount?: number;
  area?: { pyeong?: number; squareMeter?: number };
  wallpaperType?: WallpaperType;
  additionalRequest?: AdditionalRequest[];
  visitDate?: string;
  region?: string;        // regionData id (예: 'seoul')
  district?: string;      // district id (예: 'gangnam')
}

export interface QuickReply {
  label: string;
  value: string;
  field: keyof QuoteSlots;
  icon?: string;
  multi?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  quickReplies?: QuickReply[];
  attachments?: { type: 'image'; url: string }[];
  isStreaming?: boolean;
  timestamp: number;
}

export interface ChatInput {
  messages: ChatMessage[];
  slots: QuoteSlots;
  userText?: string;
  selectedQuickReply?: QuickReply;
}

export interface ChatResponse {
  aiMessage: ChatMessage;
  updatedSlots: QuoteSlots;
  isComplete: boolean;
}

export interface ImageAnalysis {
  estimatedPyeong: number;
  detectedScope?: Scope;
  recommendedWallpaper?: WallpaperType;
  conditionScore: number;
  notes: string;
}

export interface PackageOption {
  id: 'budget' | 'standard' | 'premium';
  name: string;
  price: number;
  features: string[];
  highlight?: boolean;
}

export interface SimilarCase {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  pyeong: number;
  wallpaperType: WallpaperType;
  region: string;
}

export interface PriceEstimate {
  min: number;
  max: number;
  matchConfidence: number;
  packages: PackageOption[];
  similarCases: SimilarCase[];
}

export interface AIQuoteEngine {
  chat(input: ChatInput): Promise<ChatResponse>;
  analyzeImage(file: File): Promise<ImageAnalysis>;
  estimatePrice(slots: QuoteSlots): Promise<PriceEstimate>;
}
