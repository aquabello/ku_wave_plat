'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Search, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
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
import {
  getPresets,
  getPreset,
  createPreset,
  updatePreset,
  deletePreset,
} from '@/lib/api/controller';
import type {
  PresetListItem,
  CreatePresetDto,
  UpdatePresetDto,
} from '@ku/types';

// Form schemas
const presetFormSchema = z.object({
  presetName: z.string().min(1, '프리셋명을 입력해주세요'),
  protocolType: z.string().min(1, '프로토콜을 선택해주세요'),
  commIp: z.string().optional(),
  commPort: z.coerce.number().optional(),
  presetDescription: z.string().optional(),
  commands: z.array(
    z.object({
      commandSeq: z.number().optional(),
      commandName: z.string().min(1, '명령어명을 입력해주세요'),
      commandCode: z.string().min(1, '명령어 코드를 입력해주세요'),
      commandType: z.string().optional(),
      commandOrder: z.coerce.number().optional(),
    })
  ),
});

type PresetFormData = z.infer<typeof presetFormSchema>;

// Protocol badge colors
const getProtocolBadgeColor = (protocol: string) => {
  switch (protocol) {
    case 'TCP':
      return 'bg-blue-100 text-blue-800';
    case 'UDP':
      return 'bg-purple-100 text-purple-800';
    case 'WOL':
      return 'bg-orange-100 text-orange-800';
    case 'HTTP':
      return 'bg-green-100 text-green-800';
    case 'RS232':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function HardwareSettingsPage() {
  const queryClient = useQueryClient();

  // Preset state
  const [presetSearchTerm, setPresetSearchTerm] = useState('');
  const [presetProtocolFilter, setPresetProtocolFilter] = useState('__all__');
  const [presetPage, setPresetPage] = useState(1);
  const [presetSheetOpen, setPresetSheetOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetListItem | null>(null);
  const [deletePresetDialogOpen, setDeletePresetDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<PresetListItem | null>(null);

  const pageSize = 10;

  // Preset queries
  const {
    data: presetsData,
    isLoading: presetsLoading,
  } = useQuery({
    queryKey: ['presets', presetPage, pageSize, presetSearchTerm, presetProtocolFilter],
    queryFn: () =>
      getPresets({
        page: presetPage,
        limit: pageSize,
        search: presetSearchTerm || undefined,
        protocol: presetProtocolFilter === '__all__' ? undefined : presetProtocolFilter,
      }),
  });

  // Preset form
  const presetForm = useForm<PresetFormData>({
    resolver: zodResolver(presetFormSchema),
    defaultValues: {
      presetName: '',
      protocolType: '',
      commIp: '',
      commPort: undefined,
      presetDescription: '',
      commands: [],
    },
  });

  const {
    fields: commandFields,
    append: appendCommand,
    remove: removeCommand,
  } = useFieldArray({
    control: presetForm.control,
    name: 'commands',
  });

  // Preset mutations
  const createPresetMutation = useMutation({
    mutationFn: (data: CreatePresetDto) => createPreset(data),
    onSuccess: () => {
      showToast.success('프리셋이 추가되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      setPresetSheetOpen(false);
      presetForm.reset();
    },
    onError: (error: any) => {
      showToast.apiError(error, '프리셋 추가에 실패했습니다.');
    },
  });

  const updatePresetMutation = useMutation({
    mutationFn: ({ presetSeq, data }: { presetSeq: number; data: UpdatePresetDto }) =>
      updatePreset(presetSeq, data),
    onSuccess: () => {
      showToast.success('프리셋이 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      setPresetSheetOpen(false);
      setEditingPreset(null);
      presetForm.reset();
    },
    onError: (error: any) => {
      showToast.apiError(error, '프리셋 수정에 실패했습니다.');
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (presetSeq: number) => deletePreset(presetSeq),
    onSuccess: () => {
      showToast.delete('프리셋 삭제', '프리셋이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      setDeletePresetDialogOpen(false);
      setPresetToDelete(null);
    },
    onError: (error: any) => {
      showToast.apiError(error, '프리셋 삭제에 실패했습니다.');
      setDeletePresetDialogOpen(false);
      setPresetToDelete(null);
    },
  });

  // Handlers
  const handleAddPreset = () => {
    setEditingPreset(null);
    presetForm.reset({
      presetName: '',
      protocolType: '',
      commIp: '',
      commPort: undefined,
      presetDescription: '',
      commands: [],
    });
    setPresetSheetOpen(true);
  };

  const handleEditPreset = async (preset: PresetListItem) => {
    try {
      const detail = await getPreset(preset.presetSeq);
      setEditingPreset(preset);
      presetForm.reset({
        presetName: detail.presetName,
        protocolType: detail.protocolType,
        commIp: detail.commIp || '',
        commPort: detail.commPort || undefined,
        presetDescription: detail.presetDescription || '',
        commands: detail.commands?.map((cmd, index) => ({
          commandSeq: cmd.commandSeq,
          commandName: cmd.commandName,
          commandCode: cmd.commandCode,
          commandType: cmd.commandType || '',
          commandOrder: cmd.commandOrder ?? index,
        })) || [],
      });
      setPresetSheetOpen(true);
    } catch (error: any) {
      showToast.apiError(error, '프리셋 조회에 실패했습니다.');
    }
  };

  const handleDeletePreset = (preset: PresetListItem) => {
    setPresetToDelete(preset);
    setDeletePresetDialogOpen(true);
  };

  const handlePresetSubmit = (data: PresetFormData) => {
    if (editingPreset) {
      const updatePayload: UpdatePresetDto = {
        presetName: data.presetName || undefined,
        protocolType: data.protocolType || undefined,
        commIp: data.commIp || undefined,
        commPort: data.commPort || undefined,
        presetDescription: data.presetDescription || undefined,
        commands: data.commands.map((cmd, index) => ({
          commandSeq: cmd.commandSeq,
          commandName: cmd.commandName,
          commandCode: cmd.commandCode,
          commandType: cmd.commandType || undefined,
          commandOrder: cmd.commandOrder ?? index,
        })),
      };
      updatePresetMutation.mutate({ presetSeq: editingPreset.presetSeq, data: updatePayload });
    } else {
      const createPayload: CreatePresetDto = {
        presetName: data.presetName,
        protocolType: data.protocolType,
        commIp: data.commIp || undefined,
        commPort: data.commPort || undefined,
        presetDescription: data.presetDescription || undefined,
        commands: data.commands.map((cmd, index) => ({
          commandName: cmd.commandName,
          commandCode: cmd.commandCode,
          commandType: cmd.commandType || undefined,
          commandOrder: cmd.commandOrder ?? index,
        })),
      };
      createPresetMutation.mutate(createPayload);
    }
  };

  const handleAddCommand = () => {
    appendCommand({
      commandName: '',
      commandCode: '',
      commandType: '',
      commandOrder: commandFields.length,
    });
  };

  const resetPresetFilters = () => {
    setPresetSearchTerm('');
    setPresetProtocolFilter('__all__');
    setPresetPage(1);
  };

  const hasPresetFilters = presetSearchTerm || presetProtocolFilter !== '__all__';

  const presetStartNum = presetsData ? presetsData.total - (presetPage - 1) * pageSize : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">하드웨어 설정</h1>
      </div>

      {/* Preset Management */}
      <Card>
            <CardContent className="pt-6">
              {/* Filters */}
              <div className="mb-4 flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="preset-search">프리셋명 검색</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="preset-search"
                      placeholder="프리셋명으로 검색"
                      value={presetSearchTerm}
                      onChange={(e) => {
                        setPresetSearchTerm(e.target.value);
                        setPresetPage(1);
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="preset-protocol">프로토콜</Label>
                  <Select
                    value={presetProtocolFilter}
                    onValueChange={(value) => {
                      setPresetProtocolFilter(value);
                      setPresetPage(1);
                    }}
                  >
                    <SelectTrigger id="preset-protocol">
                      <SelectValue placeholder="프로토콜 전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">프로토콜 전체</SelectItem>
                      <SelectItem value="TCP">TCP</SelectItem>
                      <SelectItem value="UDP">UDP</SelectItem>
                      <SelectItem value="WOL">WOL</SelectItem>
                      <SelectItem value="HTTP">HTTP</SelectItem>
                      <SelectItem value="RS232">RS232</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasPresetFilters && (
                  <Button variant="outline" onClick={resetPresetFilters}>
                    필터 초기화
                  </Button>
                )}
              </div>

              {/* Action Bar */}
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  총 {presetsData?.total || 0}개
                </div>
                <Button onClick={handleAddPreset}>
                  <Plus className="mr-2 h-4 w-4" />
                  프리셋 추가
                </Button>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">No.</TableHead>
                      <TableHead>프리셋명</TableHead>
                      <TableHead className="w-32">프로토콜</TableHead>
                      <TableHead className="w-48">기본 IP:포트</TableHead>
                      <TableHead className="w-32 text-center">명령어 수</TableHead>
                      <TableHead className="w-32 text-center">사용 장비</TableHead>
                      <TableHead className="w-32 text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presetsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : presetsData?.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          프리셋이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      presetsData?.items.map((preset, index) => (
                        <TableRow key={preset.presetSeq}>
                          <TableCell>{presetStartNum - index}</TableCell>
                          <TableCell className="font-medium">{preset.presetName}</TableCell>
                          <TableCell>
                            <Badge className={getProtocolBadgeColor(preset.protocolType)}>
                              {preset.protocolType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {preset.commIp && preset.commPort
                              ? `${preset.commIp}:${preset.commPort}`
                              : preset.commIp || preset.commPort || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {preset.commandCount || 0}
                          </TableCell>
                          <TableCell className="text-center">
                            {preset.deviceCount || 0}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPreset(preset)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePreset(preset)}
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
              {presetsData && presetsData.total > pageSize && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {presetPage} / {Math.ceil(presetsData.total / pageSize)} 페이지
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPresetPage((p) => Math.max(1, p - 1))}
                      disabled={presetPage === 1}
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPresetPage((p) => p + 1)}
                      disabled={presetPage >= Math.ceil(presetsData.total / pageSize)}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Preset Form Sheet */}
      <Sheet open={presetSheetOpen} onOpenChange={setPresetSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingPreset ? '프리셋 수정' : '프리셋 추가'}</SheetTitle>
            <SheetDescription>
              장비 제어를 위한 프리셋 정보를 입력하세요.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={presetForm.handleSubmit(handlePresetSubmit)} className="mt-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="presetName">
                  프리셋명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="presetName"
                  {...presetForm.register('presetName')}
                  placeholder="프리셋명을 입력하세요"
                />
                {presetForm.formState.errors.presetName && (
                  <p className="mt-1 text-sm text-destructive">
                    {presetForm.formState.errors.presetName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="protocolType">
                  프로토콜 <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="protocolType"
                  control={presetForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="protocolType">
                        <SelectValue placeholder="프로토콜을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TCP">TCP</SelectItem>
                        <SelectItem value="UDP">UDP</SelectItem>
                        <SelectItem value="WOL">WOL</SelectItem>
                        <SelectItem value="HTTP">HTTP</SelectItem>
                        <SelectItem value="RS232">RS232</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {presetForm.formState.errors.protocolType && (
                  <p className="mt-1 text-sm text-destructive">
                    {presetForm.formState.errors.protocolType.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commIp">기본 통신 IP</Label>
                  <Input
                    id="commIp"
                    {...presetForm.register('commIp')}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label htmlFor="commPort">기본 통신 포트</Label>
                  <Input
                    id="commPort"
                    type="number"
                    {...presetForm.register('commPort')}
                    placeholder="8080"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="presetDescription">설명</Label>
                <textarea
                  id="presetDescription"
                  {...presetForm.register('presetDescription')}
                  placeholder="프리셋 설명을 입력하세요"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Commands Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">명령어</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCommand}>
                  <Plus className="mr-2 h-4 w-4" />
                  명령어 추가
                </Button>
              </div>

              <div className="space-y-3">
                {commandFields.map((field, index) => (
                  <div key={field.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">명령어 #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCommand(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`commands.${index}.commandName`}>
                          명령어명 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`commands.${index}.commandName`}
                          {...presetForm.register(`commands.${index}.commandName`)}
                          placeholder="예: 전원 켜기"
                        />
                        {presetForm.formState.errors.commands?.[index]?.commandName && (
                          <p className="mt-1 text-sm text-destructive">
                            {presetForm.formState.errors.commands[index]?.commandName?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`commands.${index}.commandType`}>명령어 유형</Label>
                        <Controller
                          name={`commands.${index}.commandType`}
                          control={presetForm.control}
                          render={({ field }) => (
                            <Select value={field.value || ''} onValueChange={field.onChange}>
                              <SelectTrigger id={`commands.${index}.commandType`}>
                                <SelectValue placeholder="유형 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="POWER_ON">전원 켜기</SelectItem>
                                <SelectItem value="POWER_OFF">전원 끄기</SelectItem>
                                <SelectItem value="INPUT_CHANGE">입력 변경</SelectItem>
                                <SelectItem value="CUSTOM">사용자 정의</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`commands.${index}.commandCode`}>
                        명령어 코드 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`commands.${index}.commandCode`}
                        {...presetForm.register(`commands.${index}.commandCode`)}
                        placeholder="예: 0x01 0x02 0x03"
                      />
                      {presetForm.formState.errors.commands?.[index]?.commandCode && (
                        <p className="mt-1 text-sm text-destructive">
                          {presetForm.formState.errors.commands[index]?.commandCode?.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {commandFields.length === 0 && (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    명령어가 없습니다. 명령어 추가 버튼을 눌러 추가하세요.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPresetSheetOpen(false);
                  setEditingPreset(null);
                  presetForm.reset();
                }}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createPresetMutation.isPending || updatePresetMutation.isPending}
              >
                {createPresetMutation.isPending || updatePresetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : editingPreset ? (
                  '수정'
                ) : (
                  '추가'
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Preset Dialog */}
      <Dialog open={deletePresetDialogOpen} onOpenChange={setDeletePresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프리셋 삭제</DialogTitle>
            <DialogDescription>
              정말로 <strong>{presetToDelete?.presetName}</strong> 프리셋을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletePresetDialogOpen(false);
                setPresetToDelete(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (presetToDelete) {
                  deletePresetMutation.mutate(presetToDelete.presetSeq);
                }
              }}
              disabled={deletePresetMutation.isPending}
            >
              {deletePresetMutation.isPending ? (
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

    </div>
  );
}
