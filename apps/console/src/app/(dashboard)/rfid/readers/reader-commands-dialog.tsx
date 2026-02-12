'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2, Loader2, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showToast } from '@/lib/toast';
import { getReaderCommands, updateReaderCommands } from '@/lib/api/nfc';
import type {
  NfcReaderListItem,
  NfcReaderCommandDevice,
  NfcReaderCommandMappingItem,
} from '@ku/types';

interface LocalMapping {
  spaceDeviceSeq: number;
  enabled: boolean;
  enterCommandSeq: number | null;
  exitCommandSeq: number | null;
}

interface ReaderCommandsDialogProps {
  reader: NfcReaderListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReaderCommandsDialog({ reader, open, onOpenChange }: ReaderCommandsDialogProps) {
  const queryClient = useQueryClient();
  const [mappings, setMappings] = useState<LocalMapping[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['nfc-reader-commands', reader?.readerSeq],
    queryFn: () => getReaderCommands(reader!.readerSeq),
    enabled: open && !!reader,
  });

  // data → localMappings 동기화
  useEffect(() => {
    if (!data) return;
    setMappings(
      data.devices.map((d) => ({
        spaceDeviceSeq: d.spaceDeviceSeq,
        enabled: d.isMapped,
        enterCommandSeq: d.enterCommand?.commandSeq ?? null,
        exitCommandSeq: d.exitCommand?.commandSeq ?? null,
      })),
    );
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (items: NfcReaderCommandMappingItem[]) =>
      updateReaderCommands(reader!.readerSeq, { mappings: items }),
    onSuccess: (result) => {
      showToast.success(result.message || '명령어 매핑이 저장되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['nfc-reader-commands', reader?.readerSeq] });
    },
    onError: (error: any) => {
      showToast.apiError(error, '명령어 매핑 저장에 실패했습니다.');
    },
  });

  const mapAllMutation = useMutation({
    mutationFn: () => updateReaderCommands(reader!.readerSeq, { mapAll: true }),
    onSuccess: (result) => {
      showToast.success(result.message || '전체 장비가 매핑되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['nfc-reader-commands', reader?.readerSeq] });
    },
    onError: (error: any) => {
      showToast.apiError(error, '전체 등록에 실패했습니다.');
    },
  });

  const updateMapping = useCallback(
    (spaceDeviceSeq: number, patch: Partial<Omit<LocalMapping, 'spaceDeviceSeq'>>) => {
      setMappings((prev) =>
        prev.map((m) => (m.spaceDeviceSeq === spaceDeviceSeq ? { ...m, ...patch } : m)),
      );
    },
    [],
  );

  const handleToggleDevice = useCallback(
    (device: NfcReaderCommandDevice, checked: boolean) => {
      if (checked) {
        // 활성화 시 POWER_ON/POWER_OFF 자동 선택
        const powerOn = device.availableCommands.find((c) => c.commandType === 'POWER_ON');
        const powerOff = device.availableCommands.find((c) => c.commandType === 'POWER_OFF');
        updateMapping(device.spaceDeviceSeq, {
          enabled: true,
          enterCommandSeq: powerOn?.commandSeq ?? null,
          exitCommandSeq: powerOff?.commandSeq ?? null,
        });
      } else {
        updateMapping(device.spaceDeviceSeq, {
          enabled: false,
          enterCommandSeq: null,
          exitCommandSeq: null,
        });
      }
    },
    [updateMapping],
  );

  const handleSave = () => {
    const items: NfcReaderCommandMappingItem[] = mappings
      .filter((m) => m.enabled)
      .map((m) => ({
        spaceDeviceSeq: m.spaceDeviceSeq,
        enterCommandSeq: m.enterCommandSeq,
        exitCommandSeq: m.exitCommandSeq,
      }));
    saveMutation.mutate(items);
  };

  const handleClearAll = () => {
    setMappings((prev) =>
      prev.map((m) => ({ ...m, enabled: false, enterCommandSeq: null, exitCommandSeq: null })),
    );
  };

  const getMapping = (spaceDeviceSeq: number) =>
    mappings.find((m) => m.spaceDeviceSeq === spaceDeviceSeq);

  const isPending = saveMutation.isPending || mapAllMutation.isPending;
  const enabledCount = mappings.filter((m) => m.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            명령어 매핑
          </DialogTitle>
          <DialogDescription>
            {data ? (
              <>
                <strong>{data.readerName}</strong> — {data.buildingName} &gt; {data.spaceName}
                <span className="ml-2 text-xs">
                  (매핑 {enabledCount}/{data.totalDevices}개)
                </span>
              </>
            ) : (
              'NFC 태깅 시 실행할 장비별 명령어를 설정합니다.'
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !data || data.devices.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            할당된 호실에 등록된 장비가 없습니다.
          </div>
        ) : (
          <>
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                매핑이 없으면 기존 동작(전체 장비 POWER ON/OFF)이 유지됩니다.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={isPending || enabledCount === 0}
                >
                  <ZapOff className="mr-1 h-3.5 w-3.5" />
                  전체 해제
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mapAllMutation.mutate()}
                  disabled={isPending}
                >
                  <Zap className="mr-1 h-3.5 w-3.5" />
                  전체 등록
                </Button>
              </div>
            </div>

            {/* Device table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">사용</TableHead>
                    <TableHead>장비명</TableHead>
                    <TableHead className="w-32">프리셋</TableHead>
                    <TableHead className="w-20 text-center">상태</TableHead>
                    <TableHead className="w-48">입실 명령어</TableHead>
                    <TableHead className="w-48">퇴실 명령어</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.devices.map((device) => {
                    const local = getMapping(device.spaceDeviceSeq);
                    const enabled = local?.enabled ?? false;

                    return (
                      <TableRow key={device.spaceDeviceSeq}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={enabled}
                            onCheckedChange={(checked) =>
                              handleToggleDevice(device, checked === true)
                            }
                            disabled={device.deviceStatus === 'INACTIVE'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{device.deviceName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {device.presetName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              device.deviceStatus === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {device.deviceStatus === 'ACTIVE' ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={
                              enabled && local?.enterCommandSeq
                                ? String(local.enterCommandSeq)
                                : '__none__'
                            }
                            onValueChange={(val) =>
                              updateMapping(device.spaceDeviceSeq, {
                                enterCommandSeq: val === '__none__' ? null : Number(val),
                              })
                            }
                            disabled={!enabled}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="선택 안함" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">선택 안함</SelectItem>
                              {device.availableCommands.map((cmd) => (
                                <SelectItem key={cmd.commandSeq} value={String(cmd.commandSeq)}>
                                  {cmd.commandName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={
                              enabled && local?.exitCommandSeq
                                ? String(local.exitCommandSeq)
                                : '__none__'
                            }
                            onValueChange={(val) =>
                              updateMapping(device.spaceDeviceSeq, {
                                exitCommandSeq: val === '__none__' ? null : Number(val),
                              })
                            }
                            disabled={!enabled}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="선택 안함" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">선택 안함</SelectItem>
                              {device.availableCommands.map((cmd) => (
                                <SelectItem key={cmd.commandSeq} value={String(cmd.commandSeq)}>
                                  {cmd.commandName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            닫기
          </Button>
          <Button onClick={handleSave} disabled={isPending || isLoading}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
