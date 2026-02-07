'use client';

import { useState } from 'react';
import {
  Search,
  Building2,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Check,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// --- 메뉴 계층 구조 (사이드바 기준) ---

interface MenuGroup {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

const MENU_TREE: MenuGroup[] = [
  {
    id: 'controller',
    name: '컨트롤러',
    children: [
      { id: 'controller-hardware', name: '하드웨어 설정' },
      { id: 'controller-control', name: '제어관리' },
    ],
  },
  {
    id: 'rfid',
    name: 'RFID',
    children: [
      { id: 'rfid-tag', name: '태그 관리' },
      { id: 'rfid-reader', name: '리더기 관리' },
      { id: 'rfid-log', name: '로그' },
    ],
  },
  {
    id: 'screen-share',
    name: '화면공유',
    children: [
      { id: 'screen-session', name: '세션 목록' },
      { id: 'screen-settings', name: '공유 설정' },
    ],
  },
  {
    id: 'ai-system',
    name: 'AI시스템',
    children: [
      { id: 'ai-lecture-summary', name: '강의요약' },
    ],
  },
  {
    id: 'display',
    name: '디스플레이',
    children: [
      { id: 'display-player', name: '플레이어' },
      { id: 'display-list', name: '리스트관리' },
      { id: 'display-content', name: '콘텐츠관리' },
    ],
  },
  {
    id: 'member',
    name: '회원관리',
    children: [
      { id: 'member-list', name: '사용자 목록' },
      { id: 'member-permissions', name: '권한 관리' },
      { id: 'member-activity', name: '활동 로그' },
    ],
  },
  {
    id: 'settings',
    name: '환경설정',
    children: [
      { id: 'settings-buildings', name: '건물관리' },
      { id: 'settings-system', name: '시스템 설정' },
    ],
  },
];

// 전체 메뉴 ID 목록
const ALL_MENU_IDS = MENU_TREE.flatMap((g) => [g.id, ...g.children.map((c) => c.id)]);

// --- 더미 데이터 ---

interface PermissionUser {
  no: number;
  seq: number;
  id: string;
  name: string;
  userType: string;
  step: string;
  assignedBuildings: string[];
  assignedMenus: string[]; // menu id 배열 (부모 + 자식)
}

const DUMMY_BUILDINGS = [
  '동물생명과학관',
  '공학관A',
  '공학관B',
  '산학협동관',
  '새천년관',
  '법학관',
  '상허기념도서관',
  '경영관',
];

const DUMMY_DATA: PermissionUser[] = [
  {
    no: 5,
    seq: 1,
    id: 'admin',
    name: '관리자',
    userType: 'SUPER',
    step: 'OK',
    assignedBuildings: DUMMY_BUILDINGS,
    assignedMenus: ALL_MENU_IDS,
  },
  {
    no: 4,
    seq: 2,
    id: 'manager01',
    name: '김건국',
    userType: 'ADMIN',
    step: 'OK',
    assignedBuildings: ['동물생명과학관', '공학관A', '공학관B'],
    assignedMenus: [
      'controller', 'controller-hardware', 'controller-control',
      'rfid', 'rfid-tag', 'rfid-reader',
      'display', 'display-player', 'display-list', 'display-content',
    ],
  },
  {
    no: 3,
    seq: 3,
    id: 'user01',
    name: '이웨이브',
    userType: 'USER',
    step: 'OK',
    assignedBuildings: ['산학협동관'],
    assignedMenus: [
      'controller', 'controller-hardware',
      'display', 'display-player',
    ],
  },
  {
    no: 2,
    seq: 4,
    id: 'user02',
    name: '박플랫',
    userType: 'USER',
    step: 'ST',
    assignedBuildings: [],
    assignedMenus: [],
  },
  {
    no: 1,
    seq: 5,
    id: 'user03',
    name: '최반려',
    userType: 'USER',
    step: 'BN',
    assignedBuildings: [],
    assignedMenus: [],
  },
];

// --- 회원구분 라벨 ---

const USER_TYPE_LABELS: Record<string, string> = {
  SUPER: '최고관리자',
  ADMIN: '관리자',
  USER: '일반',
};

function getUserTypeLabel(type: string | null) {
  if (!type) return '-';
  return USER_TYPE_LABELS[type] ?? type;
}

function getUserTypeBadgeClass(type: string | null) {
  switch (type) {
    case 'SUPER':
      return 'bg-purple-100 text-purple-700';
    case 'ADMIN':
      return 'bg-blue-100 text-blue-700';
    case 'USER':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// --- 승인여부 라벨 ---

const STEP_LABELS: Record<string, string> = {
  ST: '대기',
  OK: '승인',
  BN: '반려',
};

function getStepLabel(step: string | null) {
  if (!step) return '-';
  return STEP_LABELS[step] ?? step;
}

function getStepBadgeClass(step: string | null) {
  switch (step) {
    case 'OK':
      return 'bg-green-100 text-green-700';
    case 'ST':
      return 'bg-yellow-100 text-yellow-700';
    case 'BN':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// --- 할당 메뉴 카운트 (상위 메뉴 기준) ---

function countAssignedMainMenus(menuIds: string[]): number {
  return MENU_TREE.filter((g) => menuIds.includes(g.id)).length;
}

// --- 메뉴 트리 체크박스 컴포넌트 ---

function MenuTreeCheckbox({
  selectedMenus,
  onToggle,
  disabled,
}: {
  selectedMenus: string[];
  onToggle: (ids: string[], checked: boolean) => void;
  disabled?: boolean;
}) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    MENU_TREE.map((g) => g.id),
  );

  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  };

  return (
    <div className="space-y-1">
      {MENU_TREE.map((group) => {
        const childIds = group.children.map((c) => c.id);
        const checkedCount = childIds.filter((id) => selectedMenus.includes(id)).length;
        const allChecked = checkedCount === childIds.length;
        const someChecked = checkedCount > 0 && !allChecked;
        const isExpanded = expandedGroups.includes(group.id);

        return (
          <div key={group.id}>
            {/* 상위 메뉴 */}
            <div
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                allChecked
                  ? 'bg-blue-50 border border-blue-200'
                  : someChecked
                    ? 'bg-blue-50/50 border border-blue-100'
                    : 'hover:bg-muted/50 border border-transparent'
              } ${disabled ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                className="p-0.5 -ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => toggleExpand(group.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <Checkbox
                checked={disabled || allChecked ? true : someChecked ? 'indeterminate' : false}
                onCheckedChange={(checked) => {
                  if (disabled) return;
                  onToggle([group.id, ...childIds], !!checked);
                }}
                disabled={disabled}
              />
              <span className="text-sm font-medium flex-1">{group.name}</span>
              <span className="text-xs text-muted-foreground">
                {checkedCount}/{childIds.length}
              </span>
            </div>

            {/* 하위 메뉴 */}
            {isExpanded && (
              <div className="ml-7 space-y-0.5 mt-0.5">
                {group.children.map((child) => {
                  const checked = selectedMenus.includes(child.id);
                  return (
                    <label
                      key={child.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        checked
                          ? 'bg-blue-50/70'
                          : 'hover:bg-muted/30'
                      } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      <Checkbox
                        checked={disabled || checked}
                        onCheckedChange={(val) => {
                          if (disabled) return;
                          onToggle([child.id], !!val);
                        }}
                        disabled={disabled}
                      />
                      <span className={`text-sm ${checked ? 'text-blue-700' : 'text-muted-foreground'}`}>
                        {child.name}
                      </span>
                      {checked && <Check className="h-3.5 w-3.5 text-blue-600 ml-auto" />}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- 할당 상세 Sheet ---

function AssignmentSheet({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: PermissionUser;
}) {
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>(user.assignedBuildings);
  const [selectedMenus, setSelectedMenus] = useState<string[]>(user.assignedMenus);

  const toggleBuilding = (building: string) => {
    setSelectedBuildings((prev) =>
      prev.includes(building) ? prev.filter((b) => b !== building) : [...prev, building],
    );
  };

  const handleMenuToggle = (ids: string[], checked: boolean) => {
    setSelectedMenus((prev) => {
      if (checked) {
        const newSet = new Set(prev);
        ids.forEach((id) => newSet.add(id));
        // 하위 전체 선택 시 상위도 자동 추가
        MENU_TREE.forEach((group) => {
          const childIds = group.children.map((c) => c.id);
          if (childIds.every((cid) => newSet.has(cid))) {
            newSet.add(group.id);
          }
        });
        return Array.from(newSet);
      } else {
        const removeSet = new Set(ids);
        // 상위 제거 시 하위도 모두 제거
        ids.forEach((id) => {
          const group = MENU_TREE.find((g) => g.id === id);
          if (group) {
            group.children.forEach((c) => removeSet.add(c.id));
          }
        });
        // 하위 일부 제거 시 상위도 제거
        const result = prev.filter((mid) => !removeSet.has(mid));
        MENU_TREE.forEach((group) => {
          const childIds = group.children.map((c) => c.id);
          if (!childIds.every((cid) => result.includes(cid))) {
            const idx = result.indexOf(group.id);
            if (idx !== -1) result.splice(idx, 1);
          }
        });
        return result;
      }
    });
  };

  const isSuperUser = user.userType === 'SUPER';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl">권한 설정</SheetTitle>
          <SheetDescription>
            <span className="font-semibold text-foreground">{user.name}</span>
            ({user.id})의 건물 및 메뉴 접근 권한을 관리합니다.
          </SheetDescription>
        </SheetHeader>

        {/* 사용자 요약 */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">구분</Label>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getUserTypeBadgeClass(user.userType)}`}>
              {getUserTypeLabel(user.userType)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">상태</Label>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStepBadgeClass(user.step)}`}>
              {getStepLabel(user.step)}
            </span>
          </div>
        </div>

        {isSuperUser && (
          <div className="mb-6 px-1 py-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
            최고관리자는 모든 건물과 메뉴에 자동으로 접근 권한이 부여됩니다.
          </div>
        )}

        <Tabs defaultValue="buildings" className="px-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buildings" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              건물 ({selectedBuildings.length})
            </TabsTrigger>
            <TabsTrigger value="menus" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              메뉴 ({countAssignedMainMenus(selectedMenus)})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buildings" className="mt-4">
            <div className="space-y-1">
              {DUMMY_BUILDINGS.map((building) => {
                const checked = selectedBuildings.includes(building);
                return (
                  <label
                    key={building}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      checked
                        ? 'bg-green-50 border border-green-200'
                        : 'hover:bg-muted/50 border border-transparent'
                    } ${isSuperUser ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <Checkbox
                      checked={isSuperUser || checked}
                      onCheckedChange={() => toggleBuilding(building)}
                      disabled={isSuperUser}
                    />
                    <Building2 className={`h-4 w-4 ${checked ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${checked ? 'font-medium' : ''}`}>{building}</span>
                    {checked && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                  </label>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="menus" className="mt-4">
            <MenuTreeCheckbox
              selectedMenus={selectedMenus}
              onToggle={handleMenuToggle}
              disabled={isSuperUser}
            />
          </TabsContent>
        </Tabs>

        {!isSuperUser && (
          <div className="flex gap-3 pt-6 px-1 border-t mt-6">
            <Button className="flex-1">저장</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// --- 메인 페이지 ---

export default function PermissionsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PermissionUser | null>(null);

  const filtered = searchQuery
    ? DUMMY_DATA.filter(
        (u) =>
          u.id.includes(searchQuery) ||
          u.name.includes(searchQuery),
      )
    : DUMMY_DATA;

  const handleRowClick = (user: PermissionUser) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">권한 관리</h1>
      </div>

      {/* 검색 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="아이디, 이름으로 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchQuery(searchInput)}
            >
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
            <div className="text-sm text-muted-foreground">
              총{' '}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>
              명
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 권한 목록 테이블 */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">No.</TableHead>
                <TableHead className="w-[150px]">아이디</TableHead>
                <TableHead className="w-[120px]">이름</TableHead>
                <TableHead className="w-[110px] text-center">회원구분</TableHead>
                <TableHead className="w-[100px] text-center">승인여부</TableHead>
                <TableHead className="text-center">할당건물</TableHead>
                <TableHead className="text-center">할당메뉴</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {searchQuery
                      ? '검색 결과가 없습니다'
                      : '등록된 사용자가 없습니다'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow
                    key={item.seq}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {item.no}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{item.id}</span>
                    </TableCell>
                    <TableCell className="font-semibold">{item.name}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getUserTypeBadgeClass(item.userType)}`}
                      >
                        {getUserTypeLabel(item.userType)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStepBadgeClass(item.step)}`}
                      >
                        {getStepLabel(item.step)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.assignedBuildings.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700">
                          <Building2 className="h-3.5 w-3.5" />
                          {item.assignedBuildings.length}개 건물
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">미할당</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {countAssignedMainMenus(item.assignedMenus) > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700">
                          <LayoutGrid className="h-3.5 w-3.5" />
                          {countAssignedMainMenus(item.assignedMenus)}개 메뉴
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">미할당</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 할당 상세 Sheet */}
      {sheetOpen && selectedUser && (
        <AssignmentSheet
          key={selectedUser.seq}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          user={selectedUser}
        />
      )}
    </div>
  );
}
