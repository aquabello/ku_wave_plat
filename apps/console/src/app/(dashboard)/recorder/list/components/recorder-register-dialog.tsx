'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateRecorderMutation } from '@/hooks/use-recorders';
import { useBuildingsQuery } from '@/hooks/use-buildings';
import { useSpacesQuery } from '@/hooks/use-spaces';
import { createPreset } from '@/lib/api/recorders';
import { useToast } from '@/hooks/use-toast';
import type {
  CreateRecorderDto,
  RecorderProtocol,
  CreateRecorderPresetDto,
} from '@ku/types';

const protocols: { value: RecorderProtocol; label: string }[] = [
  { value: 'HTTP', label: 'HTTP' },
  { value: 'ONVIF', label: 'ONVIF' },
  { value: 'RTSP', label: 'RTSP' },
];

const registerSchema = z.object({
  spaceSeq: z.coerce.number().positive('공간을 선택하세요'),
  recorderName: z
    .string()
    .min(1, '녹화기명을 입력하세요')
    .max(100, '녹화기명은 최대 100자입니다'),
  recorderIp: z
    .string()
    .min(1, 'IP 주소를 입력하세요')
    .regex(
      /^(\d{1,3}\.){3}\d{1,3}$/,
      '올바른 IP 주소 형식을 입력하세요 (예: 192.168.0.1)',
    ),
  recorderPort: z.coerce.number().min(1).max(65535),
  recorderProtocol: z.enum(['HTTP', 'ONVIF', 'RTSP']),
  recorderUsername: z.string().optional().or(z.literal('')),
  recorderPassword: z.string().optional().or(z.literal('')),
  recorderModel: z.string().optional().or(z.literal('')),
  recorderOrder: z.coerce.number().min(0),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface PresetDraft {
  id: string;
  presetName: string;
  presetNumber: number;
  panValue: number;
  tiltValue: number;
  zoomValue: number;
  presetDescription: string;
  presetOrder: number;
}

interface RecorderRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecorderRegisterDialog({
  open,
  onOpenChange,
}: RecorderRegisterDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>녹화기 등록</SheetTitle>
          <SheetDescription>
            새로운 녹화기를 등록합니다. 필수 항목을 입력하세요.
          </SheetDescription>
        </SheetHeader>
        {open && <RegisterForm onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function RegisterForm({ onClose }: { onClose: () => void }) {
  const [selectedBuildingSeq, setSelectedBuildingSeq] = useState<number | null>(
    null,
  );
  const [presetDrafts, setPresetDrafts] = useState<PresetDraft[]>([]);

  const { toast } = useToast();
  const createRecorderMutation = useCreateRecorderMutation();
  const { data: buildingsData } = useBuildingsQuery();
  const { data: spacesData, isLoading: isSpacesLoading } =
    useSpacesQuery(selectedBuildingSeq);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      spaceSeq: 0,
      recorderName: '',
      recorderIp: '',
      recorderPort: 80,
      recorderProtocol: 'HTTP',
      recorderUsername: '',
      recorderPassword: '',
      recorderModel: '',
      recorderOrder: 0,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleBuildingChange = (value: string) => {
    setSelectedBuildingSeq(Number(value));
    form.setValue('spaceSeq', 0);
  };

  const addPresetDraft = () => {
    setPresetDrafts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        presetName: '',
        presetNumber: prev.length + 1,
        panValue: 0,
        tiltValue: 0,
        zoomValue: 0,
        presetDescription: '',
        presetOrder: prev.length,
      },
    ]);
  };

  const updatePresetDraft = (
    id: string,
    field: keyof Omit<PresetDraft, 'id'>,
    value: string | number,
  ) => {
    setPresetDrafts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const removePresetDraft = (id: string) => {
    setPresetDrafts((prev) => prev.filter((p) => p.id !== id));
  };

  const onSubmit = async (data: RegisterFormData) => {
    // Validate preset drafts
    const invalidPresets = presetDrafts.filter(
      (p) => !p.presetName.trim() || p.presetNumber < 1,
    );
    if (invalidPresets.length > 0) {
      toast({
        variant: 'destructive',
        title: '프리셋 입력 오류',
        description: '프리셋명과 번호(1 이상)는 필수입니다.',
      });
      return;
    }

    const payload: CreateRecorderDto = {
      spaceSeq: data.spaceSeq,
      recorderName: data.recorderName,
      recorderIp: data.recorderIp,
      recorderPort: data.recorderPort,
      recorderProtocol: data.recorderProtocol as RecorderProtocol,
      recorderUsername: data.recorderUsername || undefined,
      recorderPassword: data.recorderPassword || undefined,
      recorderModel: data.recorderModel || undefined,
      recorderOrder: data.recorderOrder,
    };

    try {
      const recorder = await createRecorderMutation.mutateAsync(payload);

      // Create presets sequentially (best-effort after recorder creation)
      if (presetDrafts.length > 0) {
        try {
          for (const draft of presetDrafts) {
            const presetPayload: CreateRecorderPresetDto = {
              presetName: draft.presetName,
              presetNumber: draft.presetNumber,
              panValue: draft.panValue,
              tiltValue: draft.tiltValue,
              zoomValue: draft.zoomValue,
              presetDescription: draft.presetDescription || undefined,
              presetOrder: draft.presetOrder,
            };
            await createPreset(recorder.recorderSeq, presetPayload);
          }
        } catch {
          toast({
            variant: 'destructive',
            title: '프리셋 등록 실패',
            description:
              '일부 프리셋 등록에 실패했습니다. 수정 화면에서 추가하세요.',
          });
        }
      }

      onClose();
    } catch {
      // Recorder creation failed - error toast already shown by mutation
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* 위치 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">위치 정보</h3>

          {/* 건물 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              건물 선택 *
            </label>
            <Select
              onValueChange={handleBuildingChange}
              value={selectedBuildingSeq?.toString() ?? ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="건물을 선택하세요" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {buildingsData?.items.map((building) => (
                  <SelectItem
                    key={building.buildingSeq}
                    value={building.buildingSeq.toString()}
                  >
                    {building.buildingName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 공간 선택 */}
          <FormField
            control={form.control}
            name="spaceSeq"
            render={({ field }) => (
              <FormItem>
                <FormLabel>공간 선택 *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value > 0 ? field.value.toString() : ''}
                  disabled={!selectedBuildingSeq}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedBuildingSeq
                            ? '공간을 선택하세요'
                            : '건물을 먼저 선택하세요'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" sideOffset={4}>
                    {isSpacesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      spacesData?.items.map((space) => (
                        <SelectItem
                          key={space.spaceSeq}
                          value={space.spaceSeq.toString()}
                        >
                          {space.spaceName}
                          {space.spaceFloor ? ` (${space.spaceFloor}층)` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 녹화기 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">녹화기 정보</h3>

          <FormField
            control={form.control}
            name="recorderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>녹화기명 *</FormLabel>
                <FormControl>
                  <Input placeholder="녹화기명을 입력하세요" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="recorderIp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP 주소 *</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recorderPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>포트</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="80" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="recorderProtocol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로토콜</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" sideOffset={4}>
                    {protocols.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="recorderUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사용자명</FormLabel>
                  <FormControl>
                    <Input placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recorderPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="recorderModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>모델명</FormLabel>
                <FormControl>
                  <Input placeholder="모델명 (선택)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recorderOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>정렬 순서</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 프리셋 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">프리셋</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPresetDraft}
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </div>

          {presetDrafts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
              프리셋은 등록 후에도 추가할 수 있습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {presetDrafts.map((draft, index) => (
                <div key={draft.id} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      프리셋 {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removePresetDraft(draft.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">프리셋명 *</label>
                      <Input
                        value={draft.presetName}
                        onChange={(e) =>
                          updatePresetDraft(
                            draft.id,
                            'presetName',
                            e.target.value,
                          )
                        }
                        placeholder="프리셋명"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">번호 *</label>
                      <Input
                        type="number"
                        min={1}
                        value={draft.presetNumber}
                        onChange={(e) =>
                          updatePresetDraft(
                            draft.id,
                            'presetNumber',
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Pan</label>
                      <Input
                        type="number"
                        value={draft.panValue}
                        onChange={(e) =>
                          updatePresetDraft(
                            draft.id,
                            'panValue',
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Tilt</label>
                      <Input
                        type="number"
                        value={draft.tiltValue}
                        onChange={(e) =>
                          updatePresetDraft(
                            draft.id,
                            'tiltValue',
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Zoom</label>
                      <Input
                        type="number"
                        value={draft.zoomValue}
                        onChange={(e) =>
                          updatePresetDraft(
                            draft.id,
                            'zoomValue',
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">설명</label>
                    <Input
                      value={draft.presetDescription}
                      onChange={(e) =>
                        updatePresetDraft(
                          draft.id,
                          'presetDescription',
                          e.target.value,
                        )
                      }
                      placeholder="설명 (선택)"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            등록
          </Button>
        </div>
      </form>
    </Form>
  );
}
