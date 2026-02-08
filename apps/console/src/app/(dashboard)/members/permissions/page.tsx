'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Building2,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
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
import { getPermissions } from '@/lib/api/permissions';
import { getMenuTree, getUserMenus, updateUserMenus } from '@/lib/api/menus';
import { getBuildings } from '@/lib/api/buildings';
import { showToast } from '@/lib/toast';
import type { PermissionListItem, GNBMenuItem, BuildingListItem } from '@ku/types';

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

// --- 메뉴 트리 체크박스 컴포넌트 ---

function MenuTreeCheckbox({
  menuTree,
  selectedMenus,
  onToggle,
  disabled,
}: {
  menuTree: GNBMenuItem[];
  selectedMenus: Set<number>;
  onToggle: (seqs: number[], checked: boolean) => void;
  disabled?: boolean;
}) {
  const [expandedGroups, setExpandedGroups] = useState<number[]>(
    menuTree.map((g) => g.menuSeq),
  );

  const toggleExpand = (menuSeq: number) => {
    setExpandedGroups((prev) =>
      prev.includes(menuSeq) ? prev.filter((id) => id !== menuSeq) : [...prev, menuSeq],
    );
  };

  return (
    <div className="space-y-1">
      {menuTree.map((group) => {
        const childSeqs = group.children.map((c) => c.menuSeq);
        const checkedCount = childSeqs.filter((seq) => selectedMenus.has(seq)).length;
        const allChecked = checkedCount === childSeqs.length && childSeqs.length > 0;
        const someChecked = checkedCount > 0 && !allChecked;
        const isExpanded = expandedGroups.includes(group.menuSeq);

        return (
          <div key={group.menuSeq}>
            {/* 상위 메뉴 (GNB) */}
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
                onClick={() => toggleExpand(group.menuSeq)}
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
                  onToggle([group.menuSeq, ...childSeqs], !!checked);
                }}
                disabled={disabled}
              />
              <span className="text-sm font-medium flex-1">{group.menuName}</span>
              <span className="text-xs text-muted-foreground">
                {checkedCount}/{childSeqs.length}
              </span>
            </div>

            {/* 하위 메뉴 (LNB) */}
            {isExpanded && (
              <div className="ml-7 space-y-0.5 mt-0.5">
                {group.children.map((child) => {
                  const checked = selectedMenus.has(child.menuSeq);
                  return (
                    <label
                      key={child.menuSeq}
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
                          onToggle([child.menuSeq], !!val);
                        }}
                        disabled={disabled}
                      />
                      <span className={`text-sm ${checked ? 'text-blue-700' : 'text-muted-foreground'}`}>
                        {child.menuName}
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

// --- 할당 상세 Sheet 내부 Form 컴포넌트 ---

function AssignmentForm({
  user,
  menuTree,
  initialMenuSeqs,
  buildings,
  onClose,
}: {
  user: PermissionListItem;
  menuTree: GNBMenuItem[];
  initialMenuSeqs: number[];
  buildings: BuildingListItem[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedMenus, setSelectedMenus] = useState<Set<number>>(() => {
    const initial = new Set(initialMenuSeqs);
    // 정규화: 하위 메뉴가 1개라도 있으면 GNB 부모 포함
    menuTree.forEach((group) => {
      const childSeqs = group.children.map((c) => c.menuSeq);
      const hasAnyChild = childSeqs.some((cseq) => initial.has(cseq));
      if (hasAnyChild) {
        initial.add(group.menuSeq);
      } else {
        initial.delete(group.menuSeq);
      }
    });
    return initial;
  });

  const [selectedBuildings, setSelectedBuildings] = useState<Set<number>>(() => new Set());

  const handleBuildingToggle = (buildingSeq: number, checked: boolean) => {
    setSelectedBuildings((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(buildingSeq);
      } else {
        newSet.delete(buildingSeq);
      }
      return newSet;
    });
  };

  const handleBuildingToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedBuildings(new Set(buildings.map((b) => b.buildingSeq)));
    } else {
      setSelectedBuildings(new Set());
    }
  };

  const mutation = useMutation({
    mutationFn: (menuSeqs: number[]) => updateUserMenus(user.seq, { menuSeqs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['userMenus', user.seq] });
      onClose();
      setTimeout(() => {
        showToast.success(
          '저장 완료',
          `${user.name}의 메뉴 권한이 저장되었습니다. 해당 사용자는 재로그인이 필요합니다.`
        );
      }, 100);
    },
    onError: (error) => {
      showToast.apiError(error, '메뉴 권한 저장 중 오류가 발생했습니다.');
    },
  });

  const handleMenuToggle = (seqs: number[], checked: boolean) => {
    setSelectedMenus((prev) => {
      const newSet = new Set(prev);

      if (checked) {
        seqs.forEach((seq) => newSet.add(seq));
      } else {
        seqs.forEach((seq) => {
          newSet.delete(seq);

          // 상위 메뉴 제거 시 하위 메뉴도 모두 제거
          const group = menuTree.find((g) => g.menuSeq === seq);
          if (group) {
            group.children.forEach((c) => newSet.delete(c.menuSeq));
          }
        });
      }

      // 하위 메뉴 1개라도 선택 → GNB 추가, 전부 해제 → GNB 제거
      menuTree.forEach((group) => {
        const childSeqs = group.children.map((c) => c.menuSeq);
        const hasAnyChild = childSeqs.some((cseq) => newSet.has(cseq));
        if (hasAnyChild) {
          newSet.add(group.menuSeq);
        } else {
          newSet.delete(group.menuSeq);
        }
      });

      return newSet;
    });
  };

  const handleSave = () => {
    mutation.mutate(Array.from(selectedMenus));
  };

  const isSuperUser = user.userType === 'SUPER';

  const countAssignedGNBMenus = menuTree.filter((g) => selectedMenus.has(g.menuSeq)).length;

  return (
    <div>
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

      <Tabs defaultValue="menus" className="px-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buildings" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            건물 ({selectedBuildings.size})
          </TabsTrigger>
          <TabsTrigger value="menus" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            메뉴 ({countAssignedGNBMenus})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buildings" className="mt-4">
          {buildings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">등록된 건물이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* 전체 선택 */}
              <label
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border ${
                  selectedBuildings.size === buildings.length && buildings.length > 0
                    ? 'bg-green-50 border-green-200'
                    : 'hover:bg-muted/50 border-transparent'
                } ${isSuperUser ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <Checkbox
                  checked={
                    isSuperUser ||
                    (selectedBuildings.size === buildings.length && buildings.length > 0)
                      ? true
                      : selectedBuildings.size > 0
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) => {
                    if (!isSuperUser) handleBuildingToggleAll(!!checked);
                  }}
                  disabled={isSuperUser}
                />
                <span className="text-sm font-medium flex-1">전체 선택</span>
                <span className="text-xs text-muted-foreground">
                  {isSuperUser ? buildings.length : selectedBuildings.size}/{buildings.length}
                </span>
              </label>

              {/* 건물 목록 */}
              {buildings.map((building) => {
                const checked = isSuperUser || selectedBuildings.has(building.buildingSeq);
                return (
                  <label
                    key={building.buildingSeq}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                      checked ? 'bg-green-50/70' : 'hover:bg-muted/30'
                    } ${isSuperUser ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(val) => {
                        if (!isSuperUser) handleBuildingToggle(building.buildingSeq, !!val);
                      }}
                      disabled={isSuperUser}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${checked ? 'text-green-700 font-medium' : 'text-muted-foreground'}`}>
                        {building.buildingName}
                      </span>
                      {building.buildingCode && (
                        <span className="ml-2 text-xs text-muted-foreground/60">
                          {building.buildingCode}
                        </span>
                      )}
                    </div>
                    {building.buildingLocation && (
                      <span className="text-xs text-muted-foreground/50 truncate max-w-[120px]">
                        {building.buildingLocation}
                      </span>
                    )}
                    {checked && <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                  </label>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="menus" className="mt-4">
          <MenuTreeCheckbox
            menuTree={menuTree}
            selectedMenus={selectedMenus}
            onToggle={handleMenuToggle}
            disabled={isSuperUser}
          />
        </TabsContent>
      </Tabs>

      {!isSuperUser && (
        <div className="flex gap-3 pt-6 px-1 border-t mt-6">
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            취소
          </Button>
        </div>
      )}
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
  user: PermissionListItem;
}) {
  // 전체 메뉴 트리 로드
  const { data: menuTree, isLoading: isLoadingMenuTree } = useQuery({
    queryKey: ['menuTree'],
    queryFn: getMenuTree,
  });

  // 사용자 메뉴 권한 로드
  const { data: userMenuData, isLoading: isLoadingUserMenus } = useQuery({
    queryKey: ['userMenus', user.seq],
    queryFn: () => getUserMenus(user.seq),
  });

  // 건물 리스트 로드
  const { data: buildingData, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildingList'],
    queryFn: () => getBuildings({ limit: 100 }),
  });

  const isLoading = isLoadingMenuTree || isLoadingUserMenus || isLoadingBuildings;
  const isReady = menuTree && userMenuData && buildingData;

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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isReady ? (
          <AssignmentForm
            key={`${user.seq}-${userMenuData.menuSeqs.join(',')}`}
            user={user}
            menuTree={menuTree}
            initialMenuSeqs={userMenuData.menuSeqs}
            buildings={buildingData.items}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            메뉴 데이터를 불러올 수 없습니다.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// --- 메인 페이지 ---

export default function PermissionsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PermissionListItem | null>(null);

  // 권한 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['permissions', page, searchQuery],
    queryFn: () => getPermissions({
      page,
      limit: 10,
      search: searchQuery || undefined
    }),
  });

  const handleRowClick = (user: PermissionListItem) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
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
                    handleSearch();
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSearch}
            >
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
            <div className="text-sm text-muted-foreground">
              총{' '}
              <span className="font-semibold text-foreground">
                {data?.total ?? 0}
              </span>
              명
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 권한 목록 테이블 */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                {!data || data.items.length === 0 ? (
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
                  data.items.map((item) => (
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
                        {item.assignedMenus.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700">
                            <LayoutGrid className="h-3.5 w-3.5" />
                            {item.assignedMenus.length}개 메뉴
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
          )}
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
