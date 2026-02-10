'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Search,
  Plus,
  Pencil,
  Trash2,
  DoorOpen,
  ArrowLeft,
  Loader2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showToast } from '@/lib/toast';
import { getBuildings } from '@/lib/api/buildings';
import { getSpaces, createSpace, updateSpace, deleteSpace } from '@/lib/api/spaces';
import type {
  SpaceListItem,
  CreateSpaceDto,
  UpdateSpaceDto,
} from '@ku/types';

// --- 상수 ---

const SPACE_TYPES = ['강의실', '실험실', '사무실', '회의실', '기타'] as const;

// --- 공간 폼 스키마 ---

const spaceFormSchema = z.object({
  spaceName: z.string().min(1, '공간명을 입력해주세요'),
  spaceFloor: z.string().optional(),
  spaceType: z.string().optional(),
  spaceCapacity: z.coerce.number().min(0, '0 이상 입력해주세요'),
  spaceDescription: z.string().optional(),
});

type SpaceFormValues = z.infer<typeof spaceFormSchema>;

// --- 공간 추가/수정 Sheet ---

function SpaceFormSheet({
  open,
  onOpenChange,
  space,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: SpaceListItem | null;
  onSubmit: (data: SpaceFormValues) => void;
  isSubmitting: boolean;
}) {
  const isEdit = !!space;

  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: {
      spaceName: space?.spaceName ?? '',
      spaceFloor: space?.spaceFloor ?? '',
      spaceType: space?.spaceType ?? '',
      spaceCapacity: space?.spaceCapacity ?? 0,
      spaceDescription: space?.spaceDescription ?? '',
    },
  });

  // 시트가 열릴 때마다 폼 초기화
  useEffect(() => {
    if (open) {
      form.reset({
        spaceName: space?.spaceName ?? '',
        spaceFloor: space?.spaceFloor ?? '',
        spaceType: space?.spaceType ?? '',
        spaceCapacity: space?.spaceCapacity ?? 0,
        spaceDescription: space?.spaceDescription ?? '',
      });
    }
  }, [open, space, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <DoorOpen className="h-5 w-5 text-konkuk-green" />
            {isEdit ? '공간 수정' : '공간 추가'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? '공간 정보를 수정합니다. 변경 후 저장 버튼을 눌러주세요.'
              : '새 공간 정보를 입력해주세요. * 표시는 필수 항목입니다.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-1">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              공간 정보
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="spaceName">
                  공간명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="spaceName"
                  placeholder="예: 101호 강의실"
                  {...form.register('spaceName')}
                />
                {form.formState.errors.spaceName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.spaceName.message}
                  </p>
                )}
              </div>
              {isEdit && space?.spaceCode && (
                <div className="space-y-2">
                  <Label>공간 코드</Label>
                  <Input
                    value={space.spaceCode}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    자동 채번되어 수정할 수 없습니다
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="spaceFloor">층</Label>
                <Input
                  id="spaceFloor"
                  placeholder="예: 1, 2, B1"
                  {...form.register('spaceFloor')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spaceType">유형</Label>
                <Controller
                  control={form.control}
                  name="spaceType"
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spaceCapacity">수용인원</Label>
                <Input
                  id="spaceCapacity"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...form.register('spaceCapacity')}
                />
                {form.formState.errors.spaceCapacity && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.spaceCapacity.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spaceDescription">설명</Label>
                <textarea
                  id="spaceDescription"
                  rows={3}
                  placeholder="공간에 대한 설명을 입력해주세요"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register('spaceDescription')}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? '처리 중...'
                : isEdit
                  ? '수정 완료'
                  : '공간 추가'}
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

// --- 공간 삭제 확인 Dialog ---

function DeleteSpaceDialog({
  open,
  onOpenChange,
  space,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: SpaceListItem | null;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            공간 삭제
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">
              {space?.spaceName}
            </span>
            을(를) 삭제하시겠습니까?
            <br />
            삭제된 공간은 복구할 수 없습니다.
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

export default function BuildingDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const buildingSeq = Number(params.buildingSeq);

  // 공간 검색/필터/페이지 상태
  const [spaceSearchInput, setSpaceSearchInput] = useState('');
  const [spaceSearchQuery, setSpaceSearchQuery] = useState('');
  const [spaceFloorFilter, setSpaceFloorFilter] = useState('');
  const [spaceTypeFilter, setSpaceTypeFilter] = useState('');
  const [spacePage, setSpacePage] = useState(1);

  // 공간 Sheet 상태
  const [spaceSheetOpen, setSpaceSheetOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<SpaceListItem | null>(null);

  // 공간 삭제 Dialog 상태
  const [spaceDeleteOpen, setSpaceDeleteOpen] = useState(false);
  const [deletingSpace, setDeletingSpace] = useState<SpaceListItem | null>(
    null,
  );

  // --- 데이터 조회 ---

  // 건물 정보 조회
  const { data: buildingData, isLoading: buildingLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => getBuildings({ limit: 100 }),
  });
  const building =
    buildingData?.items.find((b) => b.buildingSeq === buildingSeq) ?? null;

  // 공간 목록 조회
  const { data: spaceData, isLoading: spaceLoading } = useQuery({
    queryKey: [
      'spaces',
      buildingSeq,
      spacePage,
      spaceSearchQuery,
      spaceFloorFilter,
      spaceTypeFilter,
    ],
    queryFn: () =>
      getSpaces(buildingSeq, {
        page: spacePage,
        limit: 20,
        search: spaceSearchQuery || undefined,
        floor: spaceFloorFilter || undefined,
        type: spaceTypeFilter || undefined,
      }),
    enabled: !!buildingSeq,
  });

  const spaces = spaceData?.items ?? [];

  // --- 공간 Mutations ---

  const createSpaceMutation = useMutation({
    mutationFn: (dto: CreateSpaceDto) => createSpace(buildingSeq, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces', buildingSeq] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setSpaceSheetOpen(false);
      showToast.success('등록 완료', '공간이 등록되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '공간 등록 중 오류가 발생했습니다');
    },
  });

  const updateSpaceMutation = useMutation({
    mutationFn: ({
      spaceSeq,
      dto,
    }: {
      spaceSeq: number;
      dto: UpdateSpaceDto;
    }) => updateSpace(buildingSeq, spaceSeq, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces', buildingSeq] });
      setSpaceSheetOpen(false);
      showToast.success('수정 완료', '공간 정보가 수정되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '공간 수정 중 오류가 발생했습니다');
    },
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: (spaceSeq: number) => deleteSpace(buildingSeq, spaceSeq),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces', buildingSeq] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setSpaceDeleteOpen(false);
      setDeletingSpace(null);
      showToast.delete('삭제 완료', '공간이 삭제되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '공간 삭제 중 오류가 발생했습니다');
    },
  });

  // --- 공간 핸들러 ---

  const handleSpaceAdd = () => {
    setEditingSpace(null);
    setSpaceSheetOpen(true);
  };

  const handleSpaceEdit = (space: SpaceListItem) => {
    setEditingSpace(space);
    setSpaceSheetOpen(true);
  };

  const handleSpaceDeleteClick = (space: SpaceListItem) => {
    setDeletingSpace(space);
    setSpaceDeleteOpen(true);
  };

  const handleSpaceFormSubmit = (formData: SpaceFormValues) => {
    const dto: CreateSpaceDto = {
      spaceName: formData.spaceName,
      spaceFloor: formData.spaceFloor || undefined,
      spaceType: formData.spaceType || undefined,
      spaceCapacity: formData.spaceCapacity,
      spaceDescription: formData.spaceDescription || undefined,
    };

    if (editingSpace) {
      updateSpaceMutation.mutate({ spaceSeq: editingSpace.spaceSeq, dto });
    } else {
      createSpaceMutation.mutate(dto);
    }
  };

  const handleSpaceDeleteConfirm = () => {
    if (!deletingSpace) return;
    deleteSpaceMutation.mutate(deletingSpace.spaceSeq);
  };

  const handleSpaceSearch = () => {
    setSpaceSearchQuery(spaceSearchInput);
    setSpacePage(1);
  };

  const handleResetFilters = () => {
    setSpaceSearchInput('');
    setSpaceSearchQuery('');
    setSpaceFloorFilter('');
    setSpaceTypeFilter('');
    setSpacePage(1);
  };

  // --- 로딩 상태 ---

  if (buildingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/buildings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">건물관리</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-2" />
              <p>건물 정보를 찾을 수 없습니다.</p>
              <Button variant="link" className="mt-2" asChild>
                <Link href="/settings/buildings">건물 목록으로 돌아가기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 + 브레드크럼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/buildings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link
                href="/settings/buildings"
                className="hover:text-foreground transition-colors"
              >
                건물관리
              </Link>
              <span>/</span>
              <span className="text-foreground">{building.buildingName}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7 text-konkuk-green" />
              {building.buildingName}
            </h1>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="공간명, 코드로 검색"
                    value={spaceSearchInput}
                    onChange={(e) => setSpaceSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSpaceSearch();
                    }}
                    className="pl-9"
                  />
                </div>
                <Input
                  placeholder="층 (예: 1, B1)"
                  value={spaceFloorFilter}
                  onChange={(e) => {
                    setSpaceFloorFilter(e.target.value);
                    setSpacePage(1);
                  }}
                  className="w-[120px]"
                />
                <Select
                  value={spaceTypeFilter}
                  onValueChange={(value) => {
                    setSpaceTypeFilter(value === '__all__' ? '' : value);
                    setSpacePage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="유형 전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">유형 전체</SelectItem>
                    {SPACE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleSpaceSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  검색
                </Button>
                {(spaceSearchQuery || spaceFloorFilter || spaceTypeFilter) && (
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    초기화
                  </Button>
                )}
                <div className="flex-1" />
                <div className="text-sm text-muted-foreground">
                  총{' '}
                  <span className="font-semibold text-foreground">
                    {spaceData?.total ?? 0}
                  </span>
                  건
                </div>
                <Button onClick={handleSpaceAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  공간 추가
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 공간 목록 테이블 */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">No.</TableHead>
                    <TableHead className="w-[120px]">공간코드</TableHead>
                    <TableHead>공간명</TableHead>
                    <TableHead className="w-[80px] text-center">층</TableHead>
                    <TableHead className="w-[100px] text-center">
                      유형
                    </TableHead>
                    <TableHead className="w-[100px] text-center">
                      수용인원
                    </TableHead>
                    <TableHead className="w-[100px] text-center">
                      관리
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spaceLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-muted-foreground"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          로딩 중...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : spaces.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <DoorOpen className="h-8 w-8" />
                          {spaceSearchQuery ||
                          spaceFloorFilter ||
                          spaceTypeFilter
                            ? '검색 결과가 없습니다'
                            : '등록된 공간이 없습니다'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    spaces.map((space, index) => (
                      <TableRow key={space.spaceSeq}>
                        <TableCell className="font-medium text-muted-foreground">
                          {(spaceData?.total ?? 0) -
                            ((spacePage - 1) * 20 + index)}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-konkuk-green/10 px-2 py-1 text-xs font-medium text-konkuk-green">
                            {space.spaceCode || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {space.spaceName}
                        </TableCell>
                        <TableCell className="text-center">
                          {space.spaceFloor || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {space.spaceType ? (
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                              {space.spaceType}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {space.spaceCapacity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-konkuk-green"
                              onClick={() => handleSpaceEdit(space)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleSpaceDeleteClick(space)}
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
              {spaceData && spaceData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={spacePage <= 1}
                    onClick={() => setSpacePage((p) => p - 1)}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {spacePage} / {spaceData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={spacePage >= spaceData.totalPages}
                    onClick={() => setSpacePage((p) => p + 1)}
                  >
                    다음
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
      {/* 공간 추가/수정 Sheet */}
      <SpaceFormSheet
        key={editingSpace?.spaceSeq ?? 'new'}
        open={spaceSheetOpen}
        onOpenChange={setSpaceSheetOpen}
        space={editingSpace}
        onSubmit={handleSpaceFormSubmit}
        isSubmitting={
          createSpaceMutation.isPending || updateSpaceMutation.isPending
        }
      />

      {/* 공간 삭제 확인 Dialog */}
      <DeleteSpaceDialog
        open={spaceDeleteOpen}
        onOpenChange={setSpaceDeleteOpen}
        space={deletingSpace}
        onConfirm={handleSpaceDeleteConfirm}
        isDeleting={deleteSpaceMutation.isPending}
      />
    </div>
  );
}
