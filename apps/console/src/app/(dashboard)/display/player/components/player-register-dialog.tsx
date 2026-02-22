'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Copy, Check, KeyRound } from 'lucide-react';
import type { CreatePlayerDto } from '@ku/types';
import { useCreatePlayerMutation } from '@/hooks/use-players';
import { useBuildingsQuery } from '@/hooks/use-buildings';
import { usePlaylistsQuery } from '@/hooks/use-playlists';
import type { CreatePlayerResponse } from '@/lib/api/players';
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
  const [registeredData, setRegisteredData] = useState<CreatePlayerResponse | null>(null);
  const [copied, setCopied] = useState(false);
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
      onSuccess: (response) => {
        form.reset();
        setRegisteredData(response);
      },
    });
  };

  const handleCopyApiKey = async () => {
    if (!registeredData) return;
    try {
      await navigator.clipboard.writeText(registeredData.player_api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = registeredData.player_api_key;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setRegisteredData(null);
    setCopied(false);
    setIsAdvancedOpen(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {registeredData ? (
          // 등록 성공 화면: API Key 표시
          <>
            <SheetHeader>
              <SheetTitle>플레이어 등록 완료</SheetTitle>
              <SheetDescription>
                플레이어가 성공적으로 등록되었습니다. API Key를 반드시 복사하여 보관하세요.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* 등록 정보 요약 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">플레이어 코드</p>
                  <p className="text-sm font-mono font-medium">{registeredData.player_code}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">승인 상태</p>
                  <p className="text-sm font-medium">승인 대기</p>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-medium">Player API Key</h3>
                </div>
                <div className="p-3 rounded-lg border-2 border-amber-200 bg-amber-50">
                  <p className="text-xs text-amber-700 mb-2">
                    이 키는 다시 확인할 수 없습니다. 반드시 복사하여 안전한 곳에 보관하세요.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border break-all select-all">
                      {registeredData.player_api_key}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyApiKey}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 mt-1">클립보드에 복사되었습니다</p>
                  )}
                </div>
              </div>

              {/* 닫기 버튼 */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleClose}>확인</Button>
              </div>
            </div>
          </>
        ) : (
          // 등록 폼
          <>
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
                        <FormDescription>디스플레이의 설치 방향을 선택하세요</FormDescription>
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
