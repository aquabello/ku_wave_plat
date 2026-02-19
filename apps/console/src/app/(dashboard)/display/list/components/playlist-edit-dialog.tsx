'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useUpdatePlaylistMutation } from '@/hooks/use-playlists';
import type { PlaylistListItem, UpdatePlaylistDto } from '@ku/types';
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

const updatePlaylistSchema = z.object({
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

type UpdatePlaylistFormData = z.infer<typeof updatePlaylistSchema>;

interface PlaylistEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: PlaylistListItem | null;
}

/**
 * 자식 컴포넌트 패턴: 데이터 로드 후 form 초기화
 * (useEffect + form.reset() 안티패턴 방지)
 */
function PlaylistEditForm({
  playlist,
  onSuccess,
  onCancel,
}: {
  playlist: PlaylistListItem;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { mutate: updatePlaylist, isPending } = useUpdatePlaylistMutation();

  const form = useForm<UpdatePlaylistFormData>({
    resolver: zodResolver(updatePlaylistSchema),
    defaultValues: {
      playlist_name: playlist.playlist_name,
      playlist_type: playlist.playlist_type,
      playlist_screen_layout: playlist.playlist_screen_layout,
      playlist_random: playlist.playlist_random,
      playlist_status: playlist.playlist_status,
      playlist_description: playlist.playlist_description || '',
    },
  });

  const onSubmit = (data: UpdatePlaylistFormData) => {
    const payload: UpdatePlaylistDto = {
      ...data,
      playlist_description: data.playlist_description || undefined,
    };

    updatePlaylist(
      { playlistSeq: playlist.playlist_seq, data: payload },
      {
        onSuccess: () => {
          form.reset();
          onSuccess();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {/* 코드 (읽기 전용) */}
        <div className="grid gap-2">
          <FormLabel>플레이리스트 코드</FormLabel>
          <div className="text-sm font-medium px-3 py-2 border rounded-md bg-muted font-mono">
            {playlist.playlist_code}
          </div>
          <p className="text-sm text-muted-foreground">코드는 수정할 수 없습니다</p>
        </div>

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
                    <SelectValue />
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
                    <SelectValue />
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
                    <SelectValue />
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
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

export function PlaylistEditDialog({
  open,
  onOpenChange,
  playlist,
}: PlaylistEditDialogProps) {
  if (!playlist) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>플레이리스트 수정</SheetTitle>
          <SheetDescription>
            플레이리스트 정보를 수정합니다.
          </SheetDescription>
        </SheetHeader>

        <PlaylistEditForm
          key={playlist.playlist_seq}
          playlist={playlist}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
