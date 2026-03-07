'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
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
import {
  useRecorderQuery,
  useUpdateRecorderMutation,
} from '@/hooks/use-recorders';
import type {
  RecorderListItem,
  RecorderDetail,
  UpdateRecorderDto,
  RecorderProtocol,
} from '@ku/types';

const protocols: { value: RecorderProtocol; label: string }[] = [
  { value: 'HTTP', label: 'HTTP' },
  { value: 'ONVIF', label: 'ONVIF' },
  { value: 'RTSP', label: 'RTSP' },
];

const editSchema = z.object({
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

type EditFormData = z.infer<typeof editSchema>;

interface RecorderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recorder: RecorderListItem | null;
}

export function RecorderEditDialog({
  open,
  onOpenChange,
  recorder,
}: RecorderEditDialogProps) {
  const { data: detail, isLoading } = useRecorderQuery(
    recorder?.recorderSeq ?? 0,
    open && !!recorder,
  );

  if (!recorder) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>녹화기 수정</SheetTitle>
          <SheetDescription>
            녹화기 정보를 수정합니다. 비밀번호를 비워두면 기존 비밀번호가
            유지됩니다.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <EditForm
            key={detail.recorderSeq}
            detail={detail}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function EditForm({
  detail,
  onClose,
}: {
  detail: RecorderDetail;
  onClose: () => void;
}) {
  const { mutate: updateRecorder, isPending } = useUpdateRecorderMutation();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      recorderName: detail.recorderName,
      recorderIp: detail.recorderIp,
      recorderPort: detail.recorderPort,
      recorderProtocol: detail.recorderProtocol,
      recorderUsername: detail.recorderUsername ?? '',
      recorderPassword: '',
      recorderModel: detail.recorderModel ?? '',
      recorderOrder: detail.recorderOrder,
    },
  });

  const onSubmit = (data: EditFormData) => {
    const payload: UpdateRecorderDto = {
      recorderName: data.recorderName,
      recorderIp: data.recorderIp,
      recorderPort: data.recorderPort,
      recorderProtocol: data.recorderProtocol as RecorderProtocol,
      recorderUsername: data.recorderUsername || undefined,
      recorderPassword: data.recorderPassword || undefined,
      recorderModel: data.recorderModel || undefined,
      recorderOrder: data.recorderOrder,
    };

    updateRecorder(
      { recorderSeq: detail.recorderSeq, data: payload },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* 위치 정보 (읽기 전용) */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">위치 정보</h3>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">건물 / 공간</p>
            <p className="text-sm font-medium">
              {detail.buildingName} {detail.spaceName} ({detail.spaceFloor})
            </p>
          </div>
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
                  <Input {...field} />
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
                    <Input type="number" {...field} />
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
                    <Input
                      type="password"
                      placeholder="변경 시에만 입력"
                      {...field}
                    />
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
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3 pt-4">
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
            수정
          </Button>
        </div>
      </form>
    </Form>
  );
}
