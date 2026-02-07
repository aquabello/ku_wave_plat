'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Monitor,
  Users,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { showToast } from '@/lib/toast';
import {
  getBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from '@/lib/api/buildings';
import type { BuildingListItem, CreateBuildingDto } from '@ku/types';

// --- 폼 유효성 검증 ---

const buildingFormSchema = z.object({
  buildingName: z.string().min(1, '건물명을 입력해주세요'),
  buildingLocation: z.string().optional(),
  buildingFloorCount: z.coerce.number().min(0, '0 이상 입력해주세요'),
  buildingManagerName: z.string().optional(),
  buildingManagerPhone: z.string().optional(),
});

type BuildingFormValues = z.infer<typeof buildingFormSchema>;

// --- 건물 추가/수정 Sheet 폼 ---

function BuildingFormSheet({
  open,
  onOpenChange,
  building,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: BuildingListItem | null;
  onSubmit: (data: BuildingFormValues) => void;
  isSubmitting: boolean;
}) {
  const isEdit = !!building;

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      buildingName: building?.buildingName ?? '',
      buildingLocation: building?.buildingLocation ?? '',
      buildingFloorCount: building?.buildingFloorCount ?? 1,
      buildingManagerName: '',
      buildingManagerPhone: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-konkuk-green" />
            {isEdit ? '건물 수정' : '건물 추가'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? '건물 정보를 수정합니다. 변경 후 저장 버튼을 눌러주세요.'
              : '새 건물 정보를 입력해주세요. * 표시는 필수 항목입니다.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-1">
          {/* 기본 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              기본 정보
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="buildingName">
                  건물명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="buildingName"
                  placeholder="예: 공학관"
                  {...form.register('buildingName')}
                />
                {form.formState.errors.buildingName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.buildingName.message}
                  </p>
                )}
              </div>
              {isEdit && building?.buildingCode && (
                <div className="space-y-2">
                  <Label>건물 코드</Label>
                  <Input
                    value={building.buildingCode}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">자동 채번되어 수정할 수 없습니다</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="buildingLocation">위치</Label>
                <Input
                  id="buildingLocation"
                  placeholder="예: 서울시 광진구 능동로 120"
                  {...form.register('buildingLocation')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buildingFloorCount">층수</Label>
                <Input
                  id="buildingFloorCount"
                  type="number"
                  min={0}
                  {...form.register('buildingFloorCount')}
                />
              </div>
            </div>
          </div>

          {/* 담당자 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              담당자 정보
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="buildingManagerName">담당자명</Label>
                <Input
                  id="buildingManagerName"
                  placeholder="예: 홍길동"
                  {...form.register('buildingManagerName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buildingManagerPhone">연락처</Label>
                <Input
                  id="buildingManagerPhone"
                  placeholder="예: 02-450-0001"
                  {...form.register('buildingManagerPhone')}
                />
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? '처리 중...'
                : isEdit
                  ? '수정 완료'
                  : '건물 추가'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// --- 삭제 확인 Dialog ---

function DeleteBuildingDialog({
  open,
  onOpenChange,
  building,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: BuildingListItem | null;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            건물 삭제
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">
              {building?.buildingName}
            </span>
            을(를) 삭제하시겠습니까?
            <br />
            삭제된 건물은 복구할 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- 메인 페이지 ---

export default function BuildingsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Sheet 상태
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] =
    useState<BuildingListItem | null>(null);

  // 삭제 Dialog 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBuilding, setDeletingBuilding] =
    useState<BuildingListItem | null>(null);

  // 건물 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['buildings', page, searchQuery],
    queryFn: () =>
      getBuildings({ page, limit: 20, search: searchQuery || undefined }),
  });

  // 건물 등록 mutation
  const createMutation = useMutation({
    mutationFn: createBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setSheetOpen(false);
      showToast.success('등록 완료', '건물이 등록되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '건물 등록 중 오류가 발생했습니다');
    },
  });

  // 건물 수정 mutation
  const updateMutation = useMutation({
    mutationFn: ({ seq, dto }: { seq: number; dto: CreateBuildingDto }) =>
      updateBuilding(seq, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setSheetOpen(false);
      showToast.success('수정 완료', '건물 정보가 수정되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '건물 수정 중 오류가 발생했습니다');
    },
  });

  // 건물 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setDeleteDialogOpen(false);
      setDeletingBuilding(null);
      showToast.delete('삭제 완료', '건물이 삭제되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '건물 삭제 중 오류가 발생했습니다');
    },
  });

  const buildings = data?.items ?? [];

  // 건물 추가 핸들러
  const handleAdd = () => {
    setEditingBuilding(null);
    setSheetOpen(true);
  };

  // 건물 수정 핸들러
  const handleEdit = (building: BuildingListItem) => {
    setEditingBuilding(building);
    setSheetOpen(true);
  };

  // 건물 삭제 핸들러
  const handleDeleteClick = (building: BuildingListItem) => {
    setDeletingBuilding(building);
    setDeleteDialogOpen(true);
  };

  // 폼 제출 (추가/수정)
  const handleFormSubmit = (formData: BuildingFormValues) => {
    const dto: CreateBuildingDto = {
      buildingName: formData.buildingName,
      buildingLocation: formData.buildingLocation || undefined,
      buildingFloorCount: formData.buildingFloorCount,
      buildingManagerName: formData.buildingManagerName || undefined,
      buildingManagerPhone: formData.buildingManagerPhone || undefined,
    };

    if (editingBuilding) {
      updateMutation.mutate({ seq: editingBuilding.buildingSeq, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  // 삭제 확인
  const handleDeleteConfirm = () => {
    if (!deletingBuilding) return;
    deleteMutation.mutate(deletingBuilding.buildingSeq);
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">건물관리</h1>
          <p className="text-muted-foreground">
            캠퍼스 건물 정보를 관리합니다
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          건물 추가
        </Button>
      </div>

      {/* 검색 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="건물명으로 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                    setPage(1);
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery(searchInput);
                setPage(1);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
            <div className="text-sm text-muted-foreground">
              총{' '}
              <span className="font-semibold text-foreground">
                {data?.total ?? 0}
              </span>
              건
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 건물 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            건물 목록
          </CardTitle>
          <CardDescription>
            등록된 건물 목록을 확인하고 관리할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">No.</TableHead>
                <TableHead className="w-[120px]">건물코드</TableHead>
                <TableHead>건물명</TableHead>
                <TableHead>위치</TableHead>
                <TableHead className="w-[80px] text-center">층수</TableHead>
                <TableHead className="w-[100px] text-center">플레이어</TableHead>
                <TableHead className="w-[100px] text-center">할당사용자</TableHead>
                <TableHead className="w-[100px] text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : buildings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {searchQuery
                      ? '검색 결과가 없습니다'
                      : '등록된 건물이 없습니다'}
                  </TableCell>
                </TableRow>
              ) : (
                buildings.map((building, index) => (
                  <TableRow key={building.buildingSeq}>
                    <TableCell className="font-medium text-muted-foreground">
                      {(data?.total ?? 0) - ((page - 1) * 20 + index)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-konkuk-green/10 px-2 py-1 text-xs font-medium text-konkuk-green">
                        {building.buildingCode || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {building.buildingName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        {building.buildingLocation || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {building.buildingFloorCount ?? '-'}층
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Monitor className="h-3.5 w-3.5" />
                        {building.playerCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {building.assignedUserCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-konkuk-green"
                          onClick={() => handleEdit(building)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(building)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 페이징 */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 건물 추가/수정 Sheet */}
      <BuildingFormSheet
        key={editingBuilding?.buildingSeq ?? 'new'}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        building={editingBuilding}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* 삭제 확인 Dialog */}
      <DeleteBuildingDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        building={deletingBuilding}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
