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
import { useCreateWorkerServerMutation } from '@/hooks/use-ai-system';

const registerSchema = z.object({
  serverName: z.string().min(1, '서버명을 입력하세요').max(100),
  serverUrl: z.string().url('올바른 URL을 입력하세요'),
  apiKey: z.string().min(1, 'API 키를 입력하세요'),
  callbackSecret: z.string().optional(),
  gpuInfo: z.string().optional(),
  maxConcurrentJobs: z.coerce.number().min(1).optional(),
  defaultSttModel: z.string().optional(),
  defaultLlmModel: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface WorkerServerRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerServerRegisterDialog({
  open,
  onOpenChange,
}: WorkerServerRegisterDialogProps) {
  const { mutate: createServer, isPending } = useCreateWorkerServerMutation();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      serverName: '',
      serverUrl: '',
      apiKey: '',
      callbackSecret: '',
      gpuInfo: '',
      maxConcurrentJobs: 1,
      defaultSttModel: 'large-v3',
      defaultLlmModel: 'llama3',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    createServer(
      {
        serverName: data.serverName,
        serverUrl: data.serverUrl,
        apiKey: data.apiKey,
        callbackSecret: data.callbackSecret || undefined,
        gpuInfo: data.gpuInfo || undefined,
        maxConcurrentJobs: data.maxConcurrentJobs,
        defaultSttModel: data.defaultSttModel || undefined,
        defaultLlmModel: data.defaultLlmModel || undefined,
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
          <SheetTitle>Worker 서버 등록</SheetTitle>
          <SheetDescription>
            AI 처리용 GPU Worker 서버를 등록합니다.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="serverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>서버명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: GPU서버-1호" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>서버 URL *</FormLabel>
                  <FormControl>
                    <Input placeholder="http://10.0.1.50:8080" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="wk-xxxx..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="callbackSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Callback Secret</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="cs-xxxx..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gpuInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GPU 정보</FormLabel>
                  <FormControl>
                    <Input placeholder="RTX 4070 12GB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxConcurrentJobs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최대 동시 Job</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultSttModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기본 STT 모델</FormLabel>
                    <FormControl>
                      <Input placeholder="large-v3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultLlmModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기본 LLM 모델</FormLabel>
                    <FormControl>
                      <Input placeholder="llama3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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
