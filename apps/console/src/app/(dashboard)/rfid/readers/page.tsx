'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cpu, Search, Plus, Pencil, Trash2, Key, Copy, RefreshCw, Loader2, Settings2 } from 'lucide-react';
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/lib/toast';
import { ReaderCommandsDialog } from './reader-commands-dialog';
import {
  getReaders,
  getReader,
  createReader,
  updateReader,
  deleteReader,
  regenerateReaderKey,
} from '@/lib/api/nfc';
import { getBuildings } from '@/lib/api/buildings';
import { getSpaces } from '@/lib/api/spaces';
import type {
  NfcReaderListItem,
  NfcReaderDetail,
  CreateNfcReaderRequest,
  UpdateNfcReaderRequest,
} from '@ku/types';

// Form schema
const readerFormSchema = z.object({
  readerName: z.string().min(1, '리더기명을 입력해주세요'),
  buildingSeq: z.coerce.number().min(1, '건물을 선택해주세요'),
  spaceSeq: z.coerce.number().min(1, '공간을 선택해주세요'),
  readerSerial: z.string().optional(),
  readerStatus: z.string().optional(),
});

type ReaderFormData = z.infer<typeof readerFormSchema>;

// Status badge color
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return '활성';
    case 'INACTIVE':
      return '비활성';
    default:
      return status;
  }
};

// ==================== Reader Form Child Component ====================

function ReaderFormContent({
  editDetail,
  buildingsData,
  isEditMode,
  onSubmit,
  onCancel,
  isPending,
}: {
  editDetail: NfcReaderDetail | null;
  buildingsData: { items: Array<{ buildingSeq: number; buildingName: string }> } | undefined;
  isEditMode: boolean;
  onSubmit: (data: ReaderFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [selectedBuildingSeq, setSelectedBuildingSeq] = useState<number | null>(
    editDetail?.buildingSeq || null
  );

  const { data: spacesData } = useQuery({
    queryKey: ['spaces-for-building', selectedBuildingSeq],
    queryFn: () => getSpaces(selectedBuildingSeq!, { limit: 100 }),
    enabled: !!selectedBuildingSeq,
  });

  const form = useForm<ReaderFormData>({
    resolver: zodResolver(readerFormSchema),
    defaultValues: {
      readerName: editDetail?.readerName || '',
      buildingSeq: editDetail?.buildingSeq || 0,
      spaceSeq: editDetail?.spaceSeq || 0,
      readerSerial: editDetail?.readerSerial || '',
      readerStatus: editDetail?.readerStatus || 'ACTIVE',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
      <div className="space-y-4">
        {/* 리더기명 */}
        <div>
          <Label htmlFor="readerName">
            리더기명 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="readerName"
            {...form.register('readerName')}
            placeholder="리더기명을 입력하세요"
          />
          {form.formState.errors.readerName && (
            <p className="mt-1 text-sm text-destructive">
              {form.formState.errors.readerName.message}
            </p>
          )}
        </div>

        {/* 건물 선택 */}
        <div>
          <Label htmlFor="buildingSeq">
            건물 <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="buildingSeq"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(value) => {
                  field.onChange(Number(value));
                  setSelectedBuildingSeq(Number(value));
                  form.setValue('spaceSeq', 0);
                }}
              >
                <SelectTrigger id="buildingSeq">
                  <SelectValue placeholder="건물을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {buildingsData?.items.map((building) => (
                    <SelectItem key={building.buildingSeq} value={String(building.buildingSeq)}>
                      {building.buildingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.buildingSeq && (
            <p className="mt-1 text-sm text-destructive">
              {form.formState.errors.buildingSeq.message}
            </p>
          )}
        </div>

        {/* 공간 선택 */}
        <div>
          <Label htmlFor="spaceSeq">
            공간 <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="spaceSeq"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={!selectedBuildingSeq}
              >
                <SelectTrigger id="spaceSeq">
                  <SelectValue placeholder={selectedBuildingSeq ? '공간을 선택하세요' : '건물을 먼저 선택하세요'} />
                </SelectTrigger>
                <SelectContent>
                  {spacesData?.items.map((space) => (
                    <SelectItem key={space.spaceSeq} value={String(space.spaceSeq)}>
                      {space.spaceName}{space.spaceFloor ? ` (${space.spaceFloor})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.spaceSeq && (
            <p className="mt-1 text-sm text-destructive">
              {form.formState.errors.spaceSeq.message}
            </p>
          )}
        </div>

        {/* 시리얼번호 */}
        <div>
          <Label htmlFor="readerSerial">시리얼번호</Label>
          <Input
            id="readerSerial"
            {...form.register('readerSerial')}
            placeholder="시리얼번호를 입력하세요 (선택)"
          />
        </div>

        {/* 상태 (edit only) */}
        {isEditMode && (
          <div>
            <Label htmlFor="readerStatus">상태</Label>
            <Controller
              name="readerStatus"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value || 'ACTIVE'} onValueChange={field.onChange}>
                  <SelectTrigger id="readerStatus">
                    <SelectValue placeholder="상태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">활성</SelectItem>
                    <SelectItem value="INACTIVE">비활성</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : isEditMode ? (
            '수정'
          ) : (
            '등록'
          )}
        </Button>
      </div>
    </form>
  );
}

// ==================== Page Component ====================

export default function NfcReadersPage() {
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingReader, setEditingReader] = useState<NfcReaderListItem | null>(null);
  const [editDetail, setEditDetail] = useState<NfcReaderDetail | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [readerToDelete, setReaderToDelete] = useState<NfcReaderListItem | null>(null);

  // API Key dialog state
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKeyDisplay, setApiKeyDisplay] = useState('');
  const [apiKeyReaderName, setApiKeyReaderName] = useState('');

  // Regenerate key dialog state
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [readerToRegenerate, setReaderToRegenerate] = useState<NfcReaderListItem | null>(null);

  // Command mapping dialog state
  const [commandsDialogOpen, setCommandsDialogOpen] = useState(false);
  const [commandsReader, setCommandsReader] = useState<NfcReaderListItem | null>(null);

  const pageSize = 10;

  // Readers query
  const {
    data: readersData,
    isLoading: readersLoading,
  } = useQuery({
    queryKey: ['nfc-readers', page, pageSize, searchTerm, buildingFilter, statusFilter],
    queryFn: () =>
      getReaders({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        buildingSeq: buildingFilter === '__all__' ? undefined : Number(buildingFilter),
        status: statusFilter === '__all__' ? undefined : statusFilter,
      }),
  });

  // Buildings query for filter and form dropdown
  const { data: buildingsData } = useQuery({
    queryKey: ['buildings-all'],
    queryFn: () => getBuildings({ limit: 100 }),
  });

  // Mutations
  const createReaderMutation = useMutation({
    mutationFn: (data: CreateNfcReaderRequest) => createReader(data),
    onSuccess: (result: NfcReaderDetail) => {
      showToast.success('리더기가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['nfc-readers'] });
      setSheetOpen(false);
      // Show the generated API key
      setApiKeyReaderName(result.readerName);
      setApiKeyDisplay(result.readerApiKey);
      setApiKeyDialogOpen(true);
    },
    onError: (error: any) => {
      showToast.apiError(error, '리더기 등록에 실패했습니다.');
    },
  });

  const updateReaderMutation = useMutation({
    mutationFn: ({ readerSeq, data }: { readerSeq: number; data: UpdateNfcReaderRequest }) =>
      updateReader(readerSeq, data),
    onSuccess: () => {
      showToast.success('리더기가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['nfc-readers'] });
      setSheetOpen(false);
      setEditingReader(null);
    },
    onError: (error: any) => {
      showToast.apiError(error, '리더기 수정에 실패했습니다.');
    },
  });

  const deleteReaderMutation = useMutation({
    mutationFn: (readerSeq: number) => deleteReader(readerSeq),
    onSuccess: () => {
      showToast.delete('리더기 삭제', '리더기가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['nfc-readers'] });
      setDeleteDialogOpen(false);
      setReaderToDelete(null);
    },
    onError: (error: any) => {
      showToast.apiError(error, '리더기 삭제에 실패했습니다.');
      setDeleteDialogOpen(false);
      setReaderToDelete(null);
    },
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: (readerSeq: number) => regenerateReaderKey(readerSeq),
    onSuccess: (result) => {
      showToast.success('API Key가 재발급되었습니다.');
      setRegenerateDialogOpen(false);
      setReaderToRegenerate(null);
      // Show the new key
      setApiKeyReaderName(readerToRegenerate?.readerName || '');
      setApiKeyDisplay(result.readerApiKey);
      setApiKeyDialogOpen(true);
    },
    onError: (error: any) => {
      showToast.apiError(error, 'API Key 재발급에 실패했습니다.');
      setRegenerateDialogOpen(false);
      setReaderToRegenerate(null);
    },
  });

  // Handlers
  const handleAddReader = () => {
    setEditingReader(null);
    setEditDetail(null);
    setSheetOpen(true);
  };

  const handleEditReader = async (reader: NfcReaderListItem) => {
    try {
      const detail = await getReader(reader.readerSeq);
      // 공간 목록을 미리 로드하여 Select에 옵션이 준비되도록 함
      await queryClient.prefetchQuery({
        queryKey: ['spaces-for-building', detail.buildingSeq],
        queryFn: () => getSpaces(detail.buildingSeq, { limit: 100 }),
      });
      setEditingReader(reader);
      setEditDetail(detail);
      setSheetOpen(true);
    } catch (error: any) {
      showToast.apiError(error, '리더기 조회에 실패했습니다.');
    }
  };

  const handleDeleteReader = (reader: NfcReaderListItem) => {
    setReaderToDelete(reader);
    setDeleteDialogOpen(true);
  };

  const handleShowApiKey = async (reader: NfcReaderListItem) => {
    try {
      const detail = await getReader(reader.readerSeq);
      setApiKeyReaderName(detail.readerName);
      setApiKeyDisplay(detail.readerApiKey);
      setApiKeyDialogOpen(true);
    } catch (error: any) {
      showToast.apiError(error, 'API Key 조회에 실패했습니다.');
    }
  };

  const handleRegenerateKey = (reader: NfcReaderListItem) => {
    setReaderToRegenerate(reader);
    setRegenerateDialogOpen(true);
  };

  const handleOpenCommands = (reader: NfcReaderListItem) => {
    setCommandsReader(reader);
    setCommandsDialogOpen(true);
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKeyDisplay);
      showToast.success('API Key가 클립보드에 복사되었습니다.');
    } catch {
      showToast.error('복사 실패', '클립보드 복사에 실패했습니다.');
    }
  };

  const handleReaderSubmit = (data: ReaderFormData) => {
    if (editingReader) {
      const updatePayload: UpdateNfcReaderRequest = {
        readerName: data.readerName || undefined,
        spaceSeq: data.spaceSeq || undefined,
        readerSerial: data.readerSerial || undefined,
        readerStatus: (data.readerStatus as 'ACTIVE' | 'INACTIVE') || undefined,
      };
      updateReaderMutation.mutate({ readerSeq: editingReader.readerSeq, data: updatePayload });
    } else {
      const createPayload: CreateNfcReaderRequest = {
        spaceSeq: data.spaceSeq,
        readerName: data.readerName,
        readerSerial: data.readerSerial || undefined,
      };
      createReaderMutation.mutate(createPayload);
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingReader(null);
    setEditDetail(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setBuildingFilter('__all__');
    setStatusFilter('__all__');
    setPage(1);
  };

  const hasFilters = searchTerm || buildingFilter !== '__all__' || statusFilter !== '__all__';

  const startNum = readersData ? readersData.total - (page - 1) * pageSize : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Cpu className="h-6 w-6" />
        <h1 className="text-2xl font-bold">리더기 관리</h1>
      </div>

      {/* Reader Management */}
      <Card>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="mb-4 flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="reader-search">리더기명 검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reader-search"
                  placeholder="리더기명으로 검색"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="reader-building">건물</Label>
              <Select
                value={buildingFilter}
                onValueChange={(value) => {
                  setBuildingFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="reader-building">
                  <SelectValue placeholder="건물 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">건물 전체</SelectItem>
                  {buildingsData?.items.map((building) => (
                    <SelectItem key={building.buildingSeq} value={String(building.buildingSeq)}>
                      {building.buildingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label htmlFor="reader-status">상태</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="reader-status">
                  <SelectValue placeholder="상태 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체</SelectItem>
                  <SelectItem value="ACTIVE">활성</SelectItem>
                  <SelectItem value="INACTIVE">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="outline" onClick={resetFilters}>
                필터 초기화
              </Button>
            )}
          </div>

          {/* Action Bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              총 {readersData?.total || 0}개
            </div>
            <Button onClick={handleAddReader}>
              <Plus className="mr-2 h-4 w-4" />
              리더기 등록
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>리더기명</TableHead>
                  <TableHead className="w-36">리더기코드</TableHead>
                  <TableHead className="w-36">시리얼번호</TableHead>
                  <TableHead className="w-36">설치 공간</TableHead>
                  <TableHead className="w-28">건물명</TableHead>
                  <TableHead className="w-24 text-center">상태</TableHead>
                  <TableHead className="w-28">등록일</TableHead>
                  <TableHead className="w-44 text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readersLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : readersData?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      리더기가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  readersData?.items.map((reader, index) => (
                    <TableRow key={reader.readerSeq}>
                      <TableCell>{startNum - index}</TableCell>
                      <TableCell className="font-medium">{reader.readerName}</TableCell>
                      <TableCell className="font-mono text-xs">{reader.readerCode}</TableCell>
                      <TableCell>{reader.readerSerial || '-'}</TableCell>
                      <TableCell>{reader.spaceName}</TableCell>
                      <TableCell>{reader.buildingName}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusBadgeColor(reader.readerStatus)}>
                          {getStatusLabel(reader.readerStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(reader.regDate).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="명령어 매핑"
                            onClick={() => handleOpenCommands(reader)}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="API Key 보기"
                            onClick={() => handleShowApiKey(reader)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="API Key 재발급"
                            onClick={() => handleRegenerateKey(reader)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="수정"
                            onClick={() => handleEditReader(reader)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="삭제"
                            onClick={() => handleDeleteReader(reader)}
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
          </div>

          {/* Pagination */}
          {readersData && readersData.total > pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {page} / {Math.ceil(readersData.total / pageSize)} 페이지
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(readersData.total / pageSize)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reader Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) handleSheetClose(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingReader ? '리더기 수정' : '리더기 등록'}</SheetTitle>
            <SheetDescription>
              NFC 리더기 정보를 입력하세요.
            </SheetDescription>
          </SheetHeader>
          <ReaderFormContent
            key={editDetail ? `edit-${editDetail.readerSeq}` : 'create'}
            editDetail={editDetail}
            buildingsData={buildingsData}
            isEditMode={!!editingReader}
            onSubmit={handleReaderSubmit}
            onCancel={handleSheetClose}
            isPending={createReaderMutation.isPending || updateReaderMutation.isPending}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>리더기 삭제</DialogTitle>
            <DialogDescription>
              정말로 <strong>{readerToDelete?.readerName}</strong> 리더기를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setReaderToDelete(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (readerToDelete) {
                  deleteReaderMutation.mutate(readerToDelete.readerSeq);
                }
              }}
              disabled={deleteReaderMutation.isPending}
            >
              {deleteReaderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Display Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key</DialogTitle>
            <DialogDescription>
              <strong>{apiKeyReaderName}</strong> 리더기의 API Key입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
              <code className="flex-1 break-all text-sm">{apiKeyDisplay}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyApiKey}
                title="복사"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              이 키는 NFC Agent 설정에 사용됩니다. 안전한 곳에 보관해주세요.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setApiKeyDialogOpen(false)}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reader Commands Mapping Dialog */}
      <ReaderCommandsDialog
        reader={commandsReader}
        open={commandsDialogOpen}
        onOpenChange={(open) => {
          setCommandsDialogOpen(open);
          if (!open) setCommandsReader(null);
        }}
      />

      {/* Regenerate Key Confirmation Dialog */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key 재발급</DialogTitle>
            <DialogDescription>
              <strong>{readerToRegenerate?.readerName}</strong> 리더기의 API Key를 재발급하시겠습니까?
              <br />기존 키는 즉시 무효화되며, 해당 리더기의 Agent 설정을 업데이트해야 합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRegenerateDialogOpen(false);
                setReaderToRegenerate(null);
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                if (readerToRegenerate) {
                  regenerateKeyMutation.mutate(readerToRegenerate.readerSeq);
                }
              }}
              disabled={regenerateKeyMutation.isPending}
            >
              {regenerateKeyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  재발급 중...
                </>
              ) : (
                '재발급'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
