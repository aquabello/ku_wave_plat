/**
 * 콘텐츠 타입
 */
export type ContentType = 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';

/**
 * 콘텐츠 목록 아이템 (목록 조회용)
 */
export interface ContentListItem {
  content_seq: number;
  content_name: string;
  content_code: string;
  content_type: ContentType;
  content_file_path: string | null;
  content_url: string | null;
  content_duration: number | null;
  content_width: number | null;
  content_height: number | null;
  content_size: number | null;
  content_mime_type: string | null;
  content_thumbnail: string | null;
  content_description: string | null;
  usage_count: number;
  reg_date: string; // ISO 8601
  upd_date: string; // ISO 8601
}

/**
 * 콘텐츠 상세 정보
 */
export interface Content {
  content_seq: number;
  content_name: string;
  content_code: string;
  content_type: ContentType;
  content_file_path: string | null;
  content_url: string | null;
  content_duration: number | null;
  content_width: number | null;
  content_height: number | null;
  content_size: number | null;
  content_mime_type: string | null;
  content_thumbnail: string | null;
  content_description: string | null;
  content_order: number;
  content_isdel: 'Y' | 'N';
  reg_date: string; // ISO 8601
  upd_date: string; // ISO 8601
}

/**
 * 콘텐츠 등록 DTO
 * Note: file 필드는 FormData로 전송 시 File 객체 사용
 */
export interface CreateContentDto {
  content_name: string;
  content_code: string;
  content_type: ContentType;
  content_url?: string;
  content_duration?: number;
  content_description?: string;
}

/**
 * 콘텐츠 수정 DTO
 * Note: file 필드는 FormData로 전송 시 File 객체 사용
 */
export interface UpdateContentDto {
  content_name?: string;
  content_type?: ContentType;
  content_url?: string;
  content_duration?: number;
  content_description?: string;
  content_order?: number;
}
