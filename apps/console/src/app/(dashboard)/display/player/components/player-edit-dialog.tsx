'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import type { PlayerListItem, UpdatePlayerDto } from '@ku/types';
import { useUpdatePlayerMutation } from '@/hooks/use-players';
import { useBuildingsQuery } from '@/hooks/use-buildings';
import { usePlaylistsQuery } from '@/hooks/use-playlists';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Zod 스키마 정의 (등록 폼과 동일)
const updatePlayerSchema = z.object({
  player_name: z.string().min(1, '플레이어명을 입력하세요').max(100, '플레이어명은 최대 100자입니다'),
  player_ip: z.string().ip({ version: 'v4', message: '올바른 IPv4 주소를 입력하세요' }),
  playlist_seq: z.number().optional(),
  player_did: z.string().max(100).optional().or(z.literal('')),
  player_mac: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'MAC 주소 형식이 올바르지 않습니다 (예: AA:BB:CC:DD:EE:FF)')
    .optional()
    .or(z.literal('')),
  player_orientation: z.enum(['LANDSCAPE', 'PORTRAIT']).optional(),
  player_description: z.string().optional().or(z.literal('')),
});

type UpdatePlayerFormData = z.infer<typeof updatePlayerSchema>;

interface PlayerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: PlayerListItem | null;
}

// 자식 컴포넌트로 분리 (데이터 로드 후 폼 초기화)
function PlayerEditForm({
  player,
  onSuccess,
  onCancel,
}: {
  player: PlayerListItem;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { mutate: updatePlayer, isPending } = useUpdatePlayerMutation();
  const { data: playlistsData, isLoading: isPlaylistsLoading } = usePlaylistsQuery();

  const form = useForm<UpdatePlayerFormData>({
    resolver: zodResolver(updatePlayerSchema),
    defaultValues: {
      player_name: player.player_name,
      player_ip: player.player_ip,
      playlist_seq: player.playlist?.playlist_seq,
      player_orientation: player.player_orientation || 'LANDSCAPE',
      player_did: player.player_did || '',
      player_mac: player.player_mac || '',
      player_description: player.player_description || '',
    },
  });

  const onSubmit = (data: UpdatePlayerFormData) => {
    // 빈 문자열을 undefined로 변환
    const payload: UpdatePlayerDto = {
      player_name: data.player_name,
      player_ip: data.player_ip,
      playlist_seq: data.playlist_seq,
      player_orientation: data.player_orientation,
      player_did: data.player_did || undefined,
      player_mac: data.player_mac || undefined,
      player_description: data.player_description || undefined,
    };

    updatePlayer(
      { playerSeq: player.player_seq, data: payload },
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* 필수 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">필수 정보</h3>

          {/* 건물 (읽기 전용) */}
          <div className="grid gap-2">
            <FormLabel>건물</FormLabel>
            <div className="text-sm font-medium px-3 py-2 border rounded-md bg-muted">
              {player.building.building_name} ({player.building.building_code})
            </div>
            <p className="text-sm text-muted-foreground">건물은 수정할 수 없습니다</p>
          </div>

          <FormField
            control={form.control}
            name="player_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>플레이어명 *</FormLabel>
                <FormControl>
                  <Input placeholder="본관 1층 로비 디스플레이" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="player_ip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP 주소 *</FormLabel>
                <FormControl>
                  <Input placeholder="192.168.1.100" {...field} />
                </FormControl>
                <FormDescription>플레이어가 사용할 IPv4 주소를 입력하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="playlist_seq"
            render={({ field }) => (
              <FormItem>
                <FormLabel>플레이리스트</FormLabel>
                <Select
                  disabled={isPlaylistsLoading}
                  onValueChange={(value) => field.onChange(value && value !== '0' ? parseInt(value, 10) : undefined)}
                  value={field.value?.toString() || '0'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="플레이리스트를 선택하세요 (선택사항)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="0">선택 안 함</SelectItem>
                    {playlistsData?.items.map((playlist) => (
                      <SelectItem key={playlist.playlist_seq} value={playlist.playlist_seq.toString()}>
                        {playlist.playlist_name} ({playlist.playlist_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>플레이어에 할당할 플레이리스트를 선택하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 고급 옵션 */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>{isAdvancedOpen ? '▼' : '▶'}</span>
            고급 옵션
          </button>

          {isAdvancedOpen && (
            <div className="space-y-4 pl-6">
              <FormField
                control={form.control}
                name="player_did"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device ID</FormLabel>
                    <FormControl>
                      <Input placeholder="DID-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="player_mac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MAC 주소</FormLabel>
                    <FormControl>
                      <Input placeholder="AA:BB:CC:DD:EE:FF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="player_orientation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>화면 방향</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="LANDSCAPE">가로 (Landscape)</SelectItem>
                        <SelectItem value="PORTRAIT">세로 (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="player_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Textarea placeholder="플레이어에 대한 추가 설명을 입력하세요" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
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

export function PlayerEditDialog({
  open,
  onOpenChange,
  player,
}: PlayerEditDialogProps) {
  if (!player) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>플레이어 수정</SheetTitle>
          <SheetDescription>
            플레이어 정보를 수정합니다. 플레이어 코드는 변경할 수 없습니다.
          </SheetDescription>
        </SheetHeader>

        <PlayerEditForm
          key={player.player_seq}
          player={player}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
