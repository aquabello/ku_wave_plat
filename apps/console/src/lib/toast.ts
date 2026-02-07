import { FetchError } from 'ofetch';
import { toast } from '@/hooks/use-toast';

/**
 * 공통 Toast 유틸리티
 *
 * - useToast() 훅 없이 어디서든 호출 가능
 * - 성공(초록)/삭제(주황)/실패(빨강) 색상으로 일관된 UX
 * - API 에러 메시지 자동 파싱
 *
 * @example
 * import { showToast } from '@/lib/toast';
 *
 * showToast.success('저장 완료', '건물이 등록되었습니다.');
 * showToast.delete('삭제 완료', '건물이 삭제되었습니다.');
 * showToast.error('등록 실패', '오류가 발생했습니다.');
 * showToast.apiError(error, '기본 에러 메시지');
 */

export const showToast = {
  /** 성공 토스트 (초록) */
  success(title: string, description?: string) {
    toast({ variant: 'success', title, description });
  },

  /** 삭제 토스트 (주황) */
  delete(title: string, description?: string) {
    toast({ variant: 'warning', title, description });
  },

  /** 에러 토스트 (빨강) */
  error(title: string, description?: string) {
    toast({ variant: 'destructive', title, description });
  },

  /**
   * API 에러 자동 파싱 토스트 (빨강)
   * FetchError에서 서버 에러 메시지를 추출하여 표시
   */
  apiError(error: unknown, fallbackMessage: string) {
    const description =
      error instanceof FetchError && error.data?.message
        ? Array.isArray(error.data.message)
          ? error.data.message.join(', ')
          : error.data.message
        : fallbackMessage;
    toast({ variant: 'destructive', title: '오류', description });
  },
};
