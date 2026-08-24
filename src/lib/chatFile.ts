/**
 * 채팅 첨부파일 관련 유틸리티
 *
 * 서버는 filePath를 `/uploads/20250510/123456.jpg` 같은 상대 경로로 내려주므로
 * 채팅 API 베이스를 붙여 실제 접근 가능한 URL로 변환한다.
 */

const CHAT_API_BASE = process.env.NEXT_PUBLIC_CHAT_API_URL || 'https://www.tigerbk.com/chat-api';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];

/** 첨부파일 경로를 브라우저에서 열 수 있는 절대 URL로 변환 */
export const resolveChatFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${CHAT_API_BASE.replace(/\/$/, '')}/${filePath.replace(/^\//, '')}`;
};

/** 이미지 파일 여부 (미리보기 표시 대상) */
export const isImageFile = (filePath: string): boolean => {
  if (!filePath) return false;
  const lower = filePath.toLowerCase().split('?')[0];
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

/** 경로에서 파일명만 추출 */
export const getFileName = (filePath: string): string => {
  if (!filePath) return '파일';
  return decodeURIComponent(filePath.split('/').pop() || '파일');
};
