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
import { useCreateVoiceCommandMutation } from '@/hooks/use-ai-system';

const registerSchema = z.object({
  spaceSeq: z.coerce.number().min(1, '공간을 선택하세요'),
  keyword: z.string().min(1, '키워드를 입력하세요').max(100),
  keywordAliases: z.string().optional(),
  spaceDeviceSeq: z.coerce.number().min(1, '장비를 선택하세요'),
  commandSeq: z.coerce.number().min(1, '명령을 선택하세요'),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  commandPriority: z.coerce.number().min(0).optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface VoiceCommandRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceCommandRegisterDialog({
  open,
  onOpenChange,
}: VoiceCommandRegisterDialogProps) {
  const { mutate: createCommand, isPending } = useCreateVoiceCommandMutation();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      spaceSeq: 0,
      keyword: '',
      keywordAliases: '',
      spaceDeviceSeq: 0,
      commandSeq: 0,
      minConfidence: 0.85,
      commandPriority: 0,
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    const aliases = data.keywordAliases
      ? data.keywordAliases.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    createCommand(
      {
        spaceSeq: data.spaceSeq,
        keyword: data.keyword,
        keywordAliases: aliases,
        spaceDeviceSeq: data.spaceDeviceSeq,
        commandSeq: data.commandSeq,
        minConfidence: data.minConfidence,
        commandPriority: data.commandPriority,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>음성 명령어 등록</SheetTitle>
          <SheetDescription>
            공간에 연결된 장비 제어를 위한 음성 명령어를 등록합니다.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="spaceSeq"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>공간 시퀀스 *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="공간 시퀀스 번호" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>키워드 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 스크린 올려" {...field} />
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
                      <Input type="number" placeholder="장비 시퀀스" {...field} />
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
                      <Input type="number" placeholder="명령 시퀀스" {...field} />
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
                      <Input type="number" step="0.01" placeholder="0.85" {...field} />
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
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                등록
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
