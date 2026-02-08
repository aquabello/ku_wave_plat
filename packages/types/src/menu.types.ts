/**
 * LNB 메뉴 아이템 (GET /api/v1/menus 하위 메뉴)
 */
export interface LNBMenuItem {
  menuSeq: number;
  menuName: string;
  menuCode: string;
  menuPath: string | null;
  menuOrder: number | null;
}

/**
 * GNB 메뉴 아이템 (GET /api/v1/menus 상위 메뉴)
 */
export interface GNBMenuItem {
  menuSeq: number;
  menuName: string;
  menuCode: string;
  menuOrder: number | null;
  children: LNBMenuItem[];
}

/**
 * 사용자 메뉴 권한 응답 (GET /api/v1/menus/users/:seq)
 */
export interface UserMenuResponse {
  userSeq: number;
  menuSeqs: number[];
  menuTree: GNBMenuItem[];
}

/**
 * 사용자 메뉴 권한 저장 요청 (PUT /api/v1/menus/users/:seq)
 */
export interface UpdateUserMenusRequest {
  menuSeqs: number[];
}
