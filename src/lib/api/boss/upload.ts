// 이미지 업로드 — 백엔드가 Cloudflare Images 로 올리고 URL 을 돌려준다.
//
// 웹은 예전에 base64 dataURL 을 그대로 저장했는데, 서버 컬럼이 URL 길이(255~500)라
// 서명 · 로고 · 도장 · 사진 저장이 "Data too long" 으로 깨졌다. 앱과 같이 URL 만 저장한다.
import BossApiClient from '@/lib/bossApi';

export const bossUploadApi = {
  image: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return BossApiClient.postPrivate<{ url: string }>('/images/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

/** canvas → PNG File (서명처럼 그림을 그려 올릴 때) */
export function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('이미지를 만들지 못했습니다.'));
        return;
      }
      resolve(new File([blob], name, { type: 'image/png' }));
    }, 'image/png');
  });
}
