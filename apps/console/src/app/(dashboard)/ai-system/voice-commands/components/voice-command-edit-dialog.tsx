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
import { useUpdateVoiceCommandMutation } from '@/hooks/use-ai-system';
import type { VoiceCommandListItem } from '@ku/types';

const editSchema = z.object({
  keyword: z.string().min(1, '키워드를 입력하세요').max(100),
  keywordAliases: z.string().optional(),
  spaceDeviceSeq: z.coerce.number().min(1, '장비를 선택하세요'),
  commandSeq: z.coerce.number().min(1, '명령을 선택하세요'),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  commandPriority: z.coerce.number().min(0).optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface VoiceCommandEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  command: VoiceCommandListItem | null;
}

export function VoiceCommandEditDialog({
  open,
  onOpenChange,
  command,
}: VoiceCommandEditDialogProps) {
  if (!command) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>음성 명령어 수정</SheetTitle>
          <SheetDescription>
            음성 명령어 정보를 수정합니다.
          </SheetDescription>
        </SheetHeader>
        <EditForm
          key={command.voiceCommandSeq}
          command={command}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function EditForm({
  command,
  onClose,
}: {
  command: VoiceCommandListItem;
  onClose: () => void;
}) {
  const { mutate: updateCommand, isPending } = useUpdateVoiceCommandMutation();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      keyword: command.keyword,
      keywordAliases: command.keywordAliases?.join(', ') ?? '',
      spaceDeviceSeq: command.spaceDeviceSeq,
      commandSeq: command.commandSeq,
      minConfidence: command.minConfidence,
      commandPriority: command.commandPriority,
    },
  });

  const onSubmit = (data: EditFormData) => {
    const aliases = data.keywordAliases
      ? data.keywordAliases.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    updateCommand(
      {
        seq: command.voiceCommandSeq,
        data: {
          keyword: data.keyword,
          keywordAliases: aliases,
          spaceDeviceSeq: data.spaceDeviceSeq,
          commandSeq: data.commandSeq,
          minConfidence: data.minConfidence,
          commandPriority: data.commandPriority,
        },
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="p-3 rounded-lg border bg-muted/30">
          <p className="text-xs text-muted-foreground">공간</p>
          <p className="text-sm font-medium">{command.spaceName}</p>
        </div>

        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>키워드 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="keywordAliases"
          render={({ field }) => (
            <FormItem>
              <FormLabel>별칭 (쉼표 구분)</FormLabel>
              <FormControl>
                <Input placeholder="예: 화면 올려, 스크린 업" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="spaceDeviceSeq"
            render={({ field }) => (
              <FormItem>
                <FormLabel>장비 시퀀스 *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commandSeq"
            render={({ field }) => (
              <FormItem>
                <FormLabel>명령 시퀀스 *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minConfidence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>최소 신뢰도</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commandPriority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>우선순위</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
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
