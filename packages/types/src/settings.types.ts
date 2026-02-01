/**
 * 시스템 설정 응답 (tb_setting 테이블)
 */
export interface SettingResponse {
  seq: number;
  apiTime: string | null;
  playerTime: string | null;
  screenStart: string | null;
  screenEnd: string | null;
  playerVer: string | null;
  playerLink: string | null;
  watcherVer: string | null;
  watcherLink: string | null;
  noticeLink: string | null;
  introLink: string | null;
  defaultImage: string | null;
  regDate: string;
}

/**
 * 시스템 설정 수정 요청
 *
 * 필수: apiTime, playerTime, screenStart, screenEnd
 * 선택: playerVer, playerLink, watcherVer, watcherLink, noticeLink, introLink, defaultImage
 */
export interface UpdateSettingRequest {
  apiTime: string;
  playerTime: string;
  screenStart: string;
  screenEnd: string;
  playerVer?: string;
  playerLink?: string;
  watcherVer?: string;
  watcherLink?: string;
  noticeLink?: string;
  introLink?: string;
  defaultImage?: string;
}
