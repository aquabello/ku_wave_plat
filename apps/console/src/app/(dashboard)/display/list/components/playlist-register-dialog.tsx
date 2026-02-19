'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreatePlaylistMutation } from '@/hooks/use-playlists';
import type { CreatePlaylistDto } from '@ku/types';
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
import { Textarea } from '@/components/ui/textarea';

const createPlaylistSchema = z.object({
  playlist_name: z
    .string()
    .min(2, '플레이리스트명은 2자 이상이어야 합니다')
    .max(100, '플레이리스트명은 100자 이하여야 합니다'),
  playlist_type: z.enum(['NORMAL', 'EMERGENCY', 'ANNOUNCEMENT']),
  playlist_screen_layout: z.enum(['1x1', '1x2', '1x4', '1x8']),
  playlist_random: z.enum(['Y', 'N']),
  playlist_status: z.enum(['ACTIVE', 'INACTIVE']),
  playlist_description: z
    .string()
    .max(200, '설명은 200자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),
});

type CreatePlaylistFormData = z.infer<typeof createPlaylistSchema>;

interface PlaylistRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlaylistRegisterDialog({
  open,
  onOpenChange,
}: PlaylistRegisterDialogProps) {
  const { mutate: createPlaylist, isPending } = useCreatePlaylistMutation();

  const form = useForm<CreatePlaylistFormData>({
    resolver: zodResolver(createPlaylistSchema),
    defaultValues: {
      playlist_name: '',
      playlist_type: 'NORMAL',
      playlist_screen_layout: '1x1',
      playlist_random: 'N',
      playlist_status: 'ACTIVE',
      playlist_description: '',
    },
  });

  const onSubmit = (data: CreatePlaylistFormData) => {
    const payload: CreatePlaylistDto = {
      ...data,
      playlist_description: data.playlist_description || undefined,
    };

    createPlaylist(payload, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>플레이리스트 등록</SheetTitle>
          <SheetDescription>
            새로운 플레이리스트를 등록합니다. 코드는 자동 생성됩니다.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="playlist_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>플레이리스트명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="플레이리스트명 입력 (2-100자)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="playlist_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>유형 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NORMAL">일반</SelectItem>
                      <SelectItem value="EMERGENCY">긴급</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">공지</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="playlist_screen_layout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>스크린구성 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="스크린구성 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1x1">1x1</SelectItem>
                      <SelectItem value="1x2">1x2</SelectItem>
                      <SelectItem value="1x4">1x4</SelectItem>
                      <SelectItem value="1x8">1x8</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="playlist_random"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>랜덤여부 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="재생 순서 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="N">순차</SelectItem>
                      <SelectItem value="Y">랜덤</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="playlist_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사용여부</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">활성</SelectItem>
                      <SelectItem value="INACTIVE">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="playlist_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="설명 입력 (최대 200자)"
                      rows={3}
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
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
