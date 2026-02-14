'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import type { CreatePlayerDto } from '@ku/types';
import { useCreatePlayerMutation } from '@/hooks/use-players';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Zod 스키마 정의
const createPlayerSchema = z.object({
  player_name: z.string().min(1, '플레이어명을 입력하세요').max(100, '플레이어명은 최대 100자입니다'),
  building_seq: z.number({ required_error: '건물을 선택하세요' }),
  player_ip: z.string().ip({ version: 'v4', message: '올바른 IPv4 주소를 입력하세요' }),
  playlist_seq: z.number().optional(),
  space_seq: z.number().optional(),
  player_did: z.string().max(100).optional().or(z.literal('')),
  player_mac: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'MAC 주소 형식이 올바르지 않습니다 (예: AA:BB:CC:DD:EE:FF)')
    .optional()
    .or(z.literal('')),
  player_orientation: z.enum(['LANDSCAPE', 'PORTRAIT']).optional(),
  player_description: z.string().optional().or(z.literal('')),
});

type CreatePlayerFormData = z.infer<typeof createPlayerSchema>;

interface PlayerRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerRegisterDialog({ open, onOpenChange }: PlayerRegisterDialogProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { mutate: createPlayer, isPending } = useCreatePlayerMutation();
  const { data: buildingsData, isLoading: isBuildingsLoading } = useBuildingsQuery();
  const { data: playlistsData, isLoading: isPlaylistsLoading } = usePlaylistsQuery();

  const form = useForm<CreatePlayerFormData>({
    resolver: zodResolver(createPlayerSchema),
    defaultValues: {
      player_name: '',
      player_ip: '',
      player_orientation: 'LANDSCAPE',
      player_did: '',
      player_mac: '',
      player_description: '',
    },
  });

  const onSubmit = (data: CreatePlayerFormData) => {
    // 빈 문자열을 undefined로 변환
    const payload: CreatePlayerDto = {
      ...data,
      player_did: data.player_did || undefined,
      player_mac: data.player_mac || undefined,
      player_description: data.player_description || undefined,
    };

    createPlayer(payload, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>플레이어 등록</SheetTitle>
          <SheetDescription>
            새로운 디지털 사이니지 플레이어를 등록합니다. 플레이어 코드는 자동으로 생성됩니다.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* 필수 정보 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">필수 정보</h3>

              <FormField
                control={form.control}
                name="building_seq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>건물 *</FormLabel>
                    <Select
                      disabled={isBuildingsLoading}
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="건물을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" sideOffset={4}>
                        {buildingsData?.items.map((building) => (
                          <SelectItem key={building.buildingSeq} value={building.buildingSeq.toString()}>
                            {building.buildingName} ({building.buildingCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
