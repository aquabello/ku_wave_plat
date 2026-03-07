'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  useCreatePresetMutation,
  useUpdatePresetMutation,
} from '@/hooks/use-recorders';
import type {
  RecorderPreset,
  CreateRecorderPresetDto,
  UpdateRecorderPresetDto,
} from '@ku/types';

const presetSchema = z.object({
  presetName: z
    .string()
    .min(1, '프리셋명을 입력하세요')
    .max(50, '프리셋명은 최대 50자입니다'),
  presetNumber: z.coerce.number().min(1, '프리셋 번호는 1 이상이어야 합니다'),
  panValue: z.coerce.number(),
  tiltValue: z.coerce.number(),
  zoomValue: z.coerce.number(),
  presetDescription: z.string().optional().or(z.literal('')),
  presetOrder: z.coerce.number().min(0),
});

type PresetFormData = z.infer<typeof presetSchema>;

interface PresetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recorderSeq: number;
  preset: RecorderPreset | null;
}

export function PresetFormDialog({
  open,
  onOpenChange,
  recorderSeq,
  preset,
}: PresetFormDialogProps) {
  const isEdit = !!preset;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '프리셋 수정' : '프리셋 등록'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '프리셋 정보를 수정합니다.'
              : '새로운 프리셋을 등록합니다.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PresetForm
            key={preset?.recPresetSeq ?? 'new'}
            recorderSeq={recorderSeq}
            preset={preset}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PresetForm({
  recorderSeq,
  preset,
  onClose,
}: {
  recorderSeq: number;
  preset: RecorderPreset | null;
  onClose: () => void;
}) {
  const isEdit = !!preset;
  const { mutate: createPreset, isPending: isCreating } =
    useCreatePresetMutation();
  const { mutate: updatePreset, isPending: isUpdating } =
    useUpdatePresetMutation();
  const isPending = isCreating || isUpdating;

  const form = useForm<PresetFormData>({
    resolver: zodResolver(presetSchema),
    defaultValues: {
      presetName: preset?.presetName ?? '',
      presetNumber: preset?.presetNumber ?? 1,
      panValue: preset?.panValue ?? 0,
      tiltValue: preset?.tiltValue ?? 0,
      zoomValue: preset?.zoomValue ?? 0,
      presetDescription: preset?.presetDescription ?? '',
      presetOrder: preset?.presetOrder ?? 0,
    },
  });

  const onSubmit = (data: PresetFormData) => {
    if (isEdit && preset) {
      const payload: UpdateRecorderPresetDto = {
        presetName: data.presetName,
        presetNumber: data.presetNumber,
        panValue: data.panValue,
        tiltValue: data.tiltValue,
        zoomValue: data.zoomValue,
        presetDescription: data.presetDescription || undefined,
        presetOrder: data.presetOrder,
      };
      updatePreset(
        {
          recorderSeq,
          recPresetSeq: preset.recPresetSeq,
          data: payload,
        },
        { onSuccess: () => onClose() },
      );
    } else {
      const payload: CreateRecorderPresetDto = {
        presetName: data.presetName,
        presetNumber: data.presetNumber,
        panValue: data.panValue,
        tiltValue: data.tiltValue,
        zoomValue: data.zoomValue,
        presetDescription: data.presetDescription || undefined,
        presetOrder: data.presetOrder,
      };
      createPreset(
        { recorderSeq, data: payload },
        { onSuccess: () => onClose() },
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="presetName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>프리셋명 *</FormLabel>
              <FormControl>
                <Input placeholder="프리셋명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="presetNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>프리셋 번호 *</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="panValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pan</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tiltValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tilt</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zoomValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zoom</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="presetDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="프리셋에 대한 설명 (선택)"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="presetOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>정렬 순서</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? '수정' : '등록'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
