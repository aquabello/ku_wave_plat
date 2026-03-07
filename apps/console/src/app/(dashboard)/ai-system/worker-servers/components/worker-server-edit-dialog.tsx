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
import { useUpdateWorkerServerMutation } from '@/hooks/use-ai-system';
import type { WorkerServerListItem } from '@ku/types';

const editSchema = z.object({
  serverName: z.string().min(1, '서버명을 입력하세요').max(100),
  serverUrl: z.string().url('올바른 URL을 입력하세요'),
  apiKey: z.string().optional().or(z.literal('')),
  callbackSecret: z.string().optional().or(z.literal('')),
  gpuInfo: z.string().optional().or(z.literal('')),
  maxConcurrentJobs: z.coerce.number().min(1).optional(),
  defaultSttModel: z.string().optional().or(z.literal('')),
  defaultLlmModel: z.string().optional().or(z.literal('')),
});

type EditFormData = z.infer<typeof editSchema>;

interface WorkerServerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: WorkerServerListItem | null;
}

export function WorkerServerEditDialog({
  open,
  onOpenChange,
  server,
}: WorkerServerEditDialogProps) {
  if (!server) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Worker 서버 수정</SheetTitle>
          <SheetDescription>
            Worker 서버 정보를 수정합니다. API Key/Secret을 비워두면 기존 값이 유지됩니다.
          </SheetDescription>
        </SheetHeader>
        <EditForm
          key={server.workerServerSeq}
          server={server}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function EditForm({
  server,
  onClose,
}: {
  server: WorkerServerListItem;
  onClose: () => void;
}) {
  const { mutate: updateServer, isPending } = useUpdateWorkerServerMutation();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      serverName: server.serverName,
      serverUrl: server.serverUrl,
      apiKey: '',
      callbackSecret: '',
      gpuInfo: server.gpuInfo ?? '',
      maxConcurrentJobs: server.maxConcurrentJobs,
      defaultSttModel: server.defaultSttModel,
      defaultLlmModel: server.defaultLlmModel,
    },
  });

  const onSubmit = (data: EditFormData) => {
    updateServer(
      {
        seq: server.workerServerSeq,
        data: {
          serverName: data.serverName,
          serverUrl: data.serverUrl,
          apiKey: data.apiKey || undefined,
          callbackSecret: data.callbackSecret || undefined,
          gpuInfo: data.gpuInfo || undefined,
          maxConcurrentJobs: data.maxConcurrentJobs,
          defaultSttModel: data.defaultSttModel || undefined,
          defaultLlmModel: data.defaultLlmModel || undefined,
        },
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField
          control={form.control}
          name="serverName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>서버명 *</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} />
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
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input type="password" placeholder="변경 시에만 입력" {...field} />
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
                <Input type="password" placeholder="변경 시에만 입력" {...field} />
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
                <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
