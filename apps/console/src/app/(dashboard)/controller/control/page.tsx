'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Gamepad2,
  Building2,
  Zap,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { getBuildings } from '@/lib/api/buildings';
import {
  getControlSpaces,
  getSpaceDevices,
  getPresets,
  createDevice,
  updateDevice,
  deleteDevice,
  createDevicesBulk,
  executeCommand,
  executeBatch,
  getControlLogs,
  deleteControlLogs,
} from '@/lib/api/controller';
import type {
  ControlSpaceItem,
  ControlDevice,
  ControlCommand,
  ExecuteCommandResult,
  ControlLogItem,
  CreateDeviceDto,
  UpdateDeviceDto,
  BulkCreateDeviceDto,
} from '@ku/types';

// ==================== Schemas ====================

const deviceFormSchema = z.object({
  presetSeq: z.coerce.number().min(1, '프리셋을 선택해주세요'),
  deviceName: z.string().min(1, '장비명을 입력해주세요'),
  deviceIp: z.string().min(1, 'IP를 입력해주세요'),
  devicePort: z.coerce.number().min(1, '포트를 입력해주세요'),
  deviceStatus: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceFormSchema>;

const bulkFormSchema = z.object({
  presetSeq: z.coerce.number().min(1, '프리셋을 선택해주세요'),
  devices: z.array(
    z.object({
      spaceSeq: z.coerce.number().min(1, '공간을 선택해주세요'),
      deviceName: z.string().min(1, '장비명을 입력해주세요'),
      deviceIp: z.string().min(1, 'IP를 입력해주세요'),
      devicePort: z.coerce.number().min(1, '포트를 입력해주세요'),
    })
  ).min(1, '최소 1개 장비를 추가해주세요'),
});

type BulkFormData = z.infer<typeof bulkFormSchema>;

// ==================== Helpers ====================

const getProtocolBadgeColor = (protocol: string) => {
  switch (protocol) {
    case 'TCP': return 'bg-blue-100 text-blue-800';
    case 'UDP': return 'bg-purple-100 text-purple-800';
    case 'WOL': return 'bg-orange-100 text-orange-800';
    case 'HTTP': return 'bg-green-100 text-green-800';
    case 'RS232': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusBadgeColor = (status: string) => {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-gray-100 text-gray-600';
};

const getLogStatusBadge = (status: string) => {
  if (status === 'SUCCESS') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'FAIL') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
};

const getCommandVariant = (commandType: string): 'default' | 'destructive' | 'outline' => {
  if (commandType === 'POWER_ON') return 'default';
  if (commandType === 'POWER_OFF') return 'destructive';
  return 'outline';
};

// ==================== Page ====================

export default function ControlPage() {
  const queryClient = useQueryClient();

  // ---- State ----

  // Building selection
  const [selectedBuildingSeq, setSelectedBuildingSeq] = useState<number | null>(null);

  // Device management sheet
  const [manageSpaceSeq, setManageSpaceSeq] = useState<number | null>(null);
  const [manageSpaceName, setManageSpaceName] = useState('');

  // Device form dialog
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<ControlDevice | null>(null);

  // Bulk form dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Delete device dialog
  const [deleteDeviceDialogOpen, setDeleteDeviceDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<ControlDevice | null>(null);

  // Control panel
  const [controlSpaceSeq, setControlSpaceSeq] = useState<number | null>(null);
  const [controlSpaceName, setControlSpaceName] = useState('');

  // Command loading + results
  const [commandLoading, setCommandLoading] = useState<Record<string, boolean>>({});
  const [batchLoading, setBatchLoading] = useState<Record<number, boolean>>({});
  const [deviceResults, setDeviceResults] = useState<Record<number, ExecuteCommandResult | null>>({});

  // Logs
  const [logsFilter, setLogsFilter] = useState({
    resultStatus: '__all__',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
  });

  // ---- Queries ----

  // Buildings (always)
  const { data: buildingsData } = useQuery({
    queryKey: ['buildings', { limit: 100 }],
    queryFn: () => getBuildings({ limit: 100 }),
  });

  // Spaces list (when building selected)
  const { data: spacesData, isLoading: spacesLoading } = useQuery({
    queryKey: ['controlSpaces', selectedBuildingSeq],
    queryFn: () => getControlSpaces(selectedBuildingSeq!),
    enabled: !!selectedBuildingSeq,
  });

  // Space devices for management sheet
  const { data: manageDevicesData, isLoading: manageDevicesLoading } = useQuery({
    queryKey: ['spaceDevices', manageSpaceSeq],
    queryFn: () => getSpaceDevices(manageSpaceSeq!),
    enabled: !!manageSpaceSeq,
  });

  // Space devices for control panel
  const { data: controlDevicesData, isLoading: controlDevicesLoading } = useQuery({
    queryKey: ['spaceDevices', controlSpaceSeq],
    queryFn: () => getSpaceDevices(controlSpaceSeq!),
    enabled: !!controlSpaceSeq,
  });

  // Presets for device form
  const { data: presetsData } = useQuery({
    queryKey: ['presets', { limit: 100 }],
    queryFn: () => getPresets({ limit: 100 }),
  });

  // Control logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['controlLogs', selectedBuildingSeq, logsFilter],
    queryFn: () =>
      getControlLogs({
        buildingSeq: selectedBuildingSeq || undefined,
        resultStatus: logsFilter.resultStatus === '__all__' ? undefined : logsFilter.resultStatus,
        startDate: logsFilter.startDate || undefined,
        endDate: logsFilter.endDate || undefined,
        page: logsFilter.page,
        limit: logsFilter.limit,
      }),
    enabled: !!selectedBuildingSeq,
  });

  // ---- Device Form ----

  const deviceForm = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      presetSeq: 0,
      deviceName: '',
      deviceIp: '',
      devicePort: 0,
      deviceStatus: 'ACTIVE',
    },
  });

  const handlePresetChangeForDevice = (presetSeq: number) => {
    deviceForm.setValue('presetSeq', presetSeq);
    const preset = presetsData?.items.find((p) => p.presetSeq === presetSeq);
    if (preset && !editingDevice) {
      if (preset.commIp) deviceForm.setValue('deviceIp', preset.commIp);
      if (preset.commPort) deviceForm.setValue('devicePort', preset.commPort);
    }
  };

  // ---- Bulk Form ----

  const bulkForm = useForm<BulkFormData>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      presetSeq: 0,
      devices: [],
    },
  });

  const { fields: bulkFields, append: appendBulkDevice, remove: removeBulkDevice } = useFieldArray({
    control: bulkForm.control,
    name: 'devices',
  });

  const watchedBulkPresetSeq = bulkForm.watch('presetSeq');

  const handleBulkPresetChange = (presetSeq: number) => {
    bulkForm.setValue('presetSeq', presetSeq);
  };

  const handleAddBulkRow = () => {
    const preset = presetsData?.items.find((p) => p.presetSeq === watchedBulkPresetSeq);
    appendBulkDevice({
      spaceSeq: manageSpaceSeq || 0,
      deviceName: '',
      deviceIp: preset?.commIp || '',
      devicePort: preset?.commPort || 0,
    });
  };

  // ---- Mutations ----

  const createDeviceMutation = useMutation({
    mutationFn: (dto: CreateDeviceDto) => createDevice(dto),
    onSuccess: () => {
      showToast.success('장비가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['spaceDevices', manageSpaceSeq] });
      queryClient.invalidateQueries({ queryKey: ['controlSpaces'] });
      setDeviceDialogOpen(false);
      deviceForm.reset();
    },
    onError: (error: any) => showToast.apiError(error, '장비 등록에 실패했습니다.'),
  });

  const updateDeviceMutation = useMutation({
    mutationFn: ({ spaceDeviceSeq, data }: { spaceDeviceSeq: number; data: UpdateDeviceDto }) =>
      updateDevice(spaceDeviceSeq, data),
    onSuccess: () => {
      showToast.success('장비가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['spaceDevices'] });
      queryClient.invalidateQueries({ queryKey: ['controlSpaces'] });
      setDeviceDialogOpen(false);
      setEditingDevice(null);
      deviceForm.reset();
    },
    onError: (error: any) => showToast.apiError(error, '장비 수정에 실패했습니다.'),
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      showToast.delete('장비가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['spaceDevices'] });
      queryClient.invalidateQueries({ queryKey: ['controlSpaces'] });
      setDeleteDeviceDialogOpen(false);
      setDeviceToDelete(null);
    },
    onError: (error: any) => {
      showToast.apiError(error, '장비 삭제에 실패했습니다.');
      setDeleteDeviceDialogOpen(false);
      setDeviceToDelete(null);
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (dto: BulkCreateDeviceDto) => createDevicesBulk(dto),
    onSuccess: (result) => {
      showToast.success(`${result.successCount}/${result.totalRequested}개 장비가 등록되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['spaceDevices'] });
      queryClient.invalidateQueries({ queryKey: ['controlSpaces'] });
      setBulkDialogOpen(false);
      bulkForm.reset();
    },
    onError: (error: any) => showToast.apiError(error, '일괄 등록에 실패했습니다.'),
  });

  // Execute single command
  const executeCommandMutation = useMutation({
    mutationFn: executeCommand,
    onSuccess: (result, variables) => {
      setDeviceResults((prev) => ({ ...prev, [variables.spaceDeviceSeq]: result }));
      if (result.resultStatus === 'SUCCESS') {
        showToast.success('제어 완료', result.resultMessage);
      } else {
        showToast.error('제어 실패', result.resultMessage);
      }
      queryClient.invalidateQueries({ queryKey: ['controlLogs'] });
    },
    onError: (error: any, variables) => {
      showToast.apiError(error, '제어 실행에 실패했습니다.');
      const key = `${variables.spaceDeviceSeq}-${variables.commandSeq}`;
      setCommandLoading((prev) => ({ ...prev, [key]: false }));
    },
  });

  // Execute batch
  const executeBatchMutation = useMutation({
    mutationFn: executeBatch,
    onSuccess: (result) => {
      const message = `${result.totalDevices}장비 중 ${result.successCount}성공, ${result.failCount}실패`;
      if (result.failCount === 0) {
        showToast.success('일괄 제어 완료', message);
      } else {
        showToast.error('일괄 제어 완료 (일부 실패)', message);
      }
      queryClient.invalidateQueries({ queryKey: ['spaceDevices', controlSpaceSeq] });
      queryClient.invalidateQueries({ queryKey: ['controlLogs'] });
    },
    onError: (error: any) => {
      showToast.apiError(error, '일괄 제어에 실패했습니다.');
    },
  });

  // Clear logs
  const clearLogsMutation = useMutation({
    mutationFn: deleteControlLogs,
    onSuccess: (result) => {
      showToast.success('로그 초기화', `${result.deletedCount}건의 로그가 삭제되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['controlLogs'] });
    },
    onError: (error: any) => {
      showToast.apiError(error, '로그 초기화에 실패했습니다.');
    },
  });

  // ---- Handlers ----

  const handleExecuteCommand = async (spaceDeviceSeq: number, commandSeq: number) => {
    const key = `${spaceDeviceSeq}-${commandSeq}`;
    setCommandLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await executeCommandMutation.mutateAsync({ spaceDeviceSeq, commandSeq });
    } finally {
      setCommandLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleBatchControl = async (spaceSeq: number, commandType: 'POWER_ON' | 'POWER_OFF') => {
    setBatchLoading((prev) => ({ ...prev, [spaceSeq]: true }));
    try {
      await executeBatchMutation.mutateAsync({ spaceSeq, commandType });
    } finally {
      setBatchLoading((prev) => ({ ...prev, [spaceSeq]: false }));
    }
  };

  const handleOpenManageSheet = (space: ControlSpaceItem) => {
    setManageSpaceSeq(space.spaceSeq);
    setManageSpaceName(space.spaceName);
  };

  const handleOpenControlPanel = (space: ControlSpaceItem) => {
    setControlSpaceSeq(space.spaceSeq);
    setControlSpaceName(space.spaceName);
    setDeviceResults({});
  };

  const handleOpenAddDevice = () => {
    setEditingDevice(null);
    deviceForm.reset({
      presetSeq: 0,
      deviceName: '',
      deviceIp: '',
      devicePort: 0,
      deviceStatus: 'ACTIVE',
    });
    setDeviceDialogOpen(true);
  };

  const handleOpenEditDevice = (device: ControlDevice) => {
    setEditingDevice(device);
    deviceForm.reset({
      presetSeq: device.presetSeq,
      deviceName: device.deviceName,
      deviceIp: device.deviceIp,
      devicePort: device.devicePort,
      deviceStatus: device.deviceStatus,
    });
    setDeviceDialogOpen(true);
  };

  const handleOpenDeleteDevice = (device: ControlDevice) => {
    setDeviceToDelete(device);
    setDeleteDeviceDialogOpen(true);
  };

  const handleDeviceSubmit = (data: DeviceFormData) => {
    if (editingDevice) {
      updateDeviceMutation.mutate({
        spaceDeviceSeq: editingDevice.spaceDeviceSeq,
        data: {
          presetSeq: data.presetSeq,
          deviceName: data.deviceName,
          deviceIp: data.deviceIp,
          devicePort: data.devicePort,
          deviceStatus: data.deviceStatus,
        },
      });
    } else {
      createDeviceMutation.mutate({
        spaceSeq: manageSpaceSeq!,
        presetSeq: data.presetSeq,
        deviceName: data.deviceName,
        deviceIp: data.deviceIp,
        devicePort: data.devicePort,
      });
    }
  };

  const handleOpenBulkDialog = () => {
    bulkForm.reset({ presetSeq: 0, devices: [] });
    setBulkDialogOpen(true);
  };

  const handleBulkSubmit = (data: BulkFormData) => {
    bulkCreateMutation.mutate({
      presetSeq: data.presetSeq,
      devices: data.devices.map((d) => ({
        spaceSeq: manageSpaceSeq!,
        deviceName: d.deviceName,
        deviceIp: d.deviceIp,
        devicePort: d.devicePort,
      })),
    });
  };

  // ---- Render ----

  const manageDevices = manageDevicesData?.devices || [];
  const controlDevices = controlDevicesData?.devices || [];
  const spaces = spacesData?.spaces || [];

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex items-center gap-2">
        <Gamepad2 className="h-7 w-7" />
        <h1 className="text-2xl font-bold">제어관리</h1>
      </div>

      {/* ===== Section 2 & 3: Left-Right Split Layout ===== */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel: Building Selector + Space Card List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="space-y-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                건물 · 공간
              </CardTitle>
              <Select
                value={selectedBuildingSeq?.toString() || ''}
                onValueChange={(value) => {
                  const seq = Number(value);
                  setSelectedBuildingSeq(seq);
                  setControlSpaceSeq(null);
                  setControlSpaceName('');
                  setDeviceResults({});
                  setLogsFilter((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="건물을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {buildingsData?.items.map((building) => (
                    <SelectItem key={building.buildingSeq} value={building.buildingSeq.toString()}>
                      {building.buildingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {!selectedBuildingSeq ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Building2 className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">건물을 선택해주세요</p>
                </div>
              ) : spacesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : spaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Zap className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">등록된 공간이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-380px)]">
                  {spaces.map((space: ControlSpaceItem) => (
                    <Card
                      key={space.spaceSeq}
                      className={cn(
                        'cursor-pointer transition-all duration-200',
                        controlSpaceSeq === space.spaceSeq
                          ? 'border-primary bg-primary/5 shadow-sm border-l-4'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      )}
                      onClick={() => handleOpenControlPanel(space)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="font-semibold text-sm">
                              {space.spaceName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {space.spaceType || '-'} · {space.spaceFloor ? `${space.spaceFloor}층` : '-'}
                            </div>
                            <div className="text-xs">
                              {space.deviceCount > 0 ? (
                                <span className="text-primary font-medium">장비 {space.deviceCount}대</span>
                              ) : (
                                <span className="text-muted-foreground">장비 없음</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenManageSheet(space);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Device Control */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  장비제어
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!controlSpaceSeq ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Zap className="h-12 w-12 mb-3 opacity-40" />
                    <p>좌측에서 공간을 선택하세요</p>
                  </div>
                ) : controlDevicesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : controlDevices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Zap className="h-12 w-12 mb-3 opacity-40" />
                    <p>등록된 장비가 없습니다</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[calc(100vh-280px)] space-y-6">
                    {/* Batch Control Banner - Sticky */}
                    <div className="sticky top-0 z-10 bg-muted rounded-lg p-5 border border-border/50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-primary/10 p-2.5 rounded-lg">
                            <Zap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">{controlSpaceName} 전체 제어</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              총 {controlDevices.length}대의 장비를 한 번에 제어합니다
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="default"
                            className="bg-green-600 hover:bg-green-700 min-w-[100px]"
                            onClick={() => handleBatchControl(controlSpaceSeq, 'POWER_ON')}
                            disabled={batchLoading[controlSpaceSeq]}
                          >
                            {batchLoading[controlSpaceSeq] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Power className="h-4 w-4 mr-2" />
                            )}
                            전체 ON
                          </Button>
                          <Button
                            size="default"
                            variant="destructive"
                            className="min-w-[100px]"
                            onClick={() => handleBatchControl(controlSpaceSeq, 'POWER_OFF')}
                            disabled={batchLoading[controlSpaceSeq]}
                          >
                            {batchLoading[controlSpaceSeq] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <PowerOff className="h-4 w-4 mr-2" />
                            )}
                            전체 OFF
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Individual Device Cards Grid */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">개별 장비 제어</h3>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                        {controlDevices.map((device: ControlDevice) => (
                          <Card key={device.spaceDeviceSeq} className="shadow-sm">
                            <CardHeader className="pb-3">
                              <div className="space-y-2">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                  {device.deviceName}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className="text-xs">
                                    {device.presetName}
                                  </Badge>
                                  <Badge className={`text-xs ${getProtocolBadgeColor(device.protocolType)}`}>
                                    {device.protocolType}
                                  </Badge>
                                  <Badge className={`text-xs ${getStatusBadgeColor(device.deviceStatus)}`}>
                                    {device.deviceStatus === 'ACTIVE' ? '활성' : '비활성'}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Command Buttons */}
                              <div className="flex flex-wrap gap-2">
                                {device.commands.map((command: ControlCommand) => {
                                  const key = `${device.spaceDeviceSeq}-${command.commandSeq}`;
                                  const isLoading = commandLoading[key];
                                  return (
                                    <Button
                                      key={command.commandSeq}
                                      size="sm"
                                      variant={getCommandVariant(command.commandType)}
                                      onClick={() =>
                                        handleExecuteCommand(device.spaceDeviceSeq, command.commandSeq)
                                      }
                                      disabled={device.deviceStatus === 'INACTIVE' || isLoading || batchLoading[controlSpaceSeq]}
                                      className={
                                        command.commandType === 'POWER_ON'
                                          ? 'bg-green-600 hover:bg-green-700'
                                          : ''
                                      }
                                    >
                                      {isLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : null}
                                      {command.commandName}
                                    </Button>
                                  );
                                })}
                              </div>

                              {/* Last Execution Result */}
                              {deviceResults[device.spaceDeviceSeq] && (
                                <div className="text-xs text-muted-foreground flex items-start gap-2 pt-3 border-t">
                                  {deviceResults[device.spaceDeviceSeq]!.resultStatus === 'SUCCESS' ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 space-y-1">
                                    <div>{deviceResults[device.spaceDeviceSeq]!.resultMessage}</div>
                                    <div className="text-muted-foreground/70">
                                      {new Date(deviceResults[device.spaceDeviceSeq]!.executedAt).toLocaleString('ko-KR')}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      {/* ===== Section 4: Control Logs ===== */}
      {selectedBuildingSeq && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>제어 로그</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => clearLogsMutation.mutate()}
              disabled={clearLogsMutation.isPending}
            >
              {clearLogsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              로그초기화
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select
                value={logsFilter.resultStatus}
                onValueChange={(value) =>
                  setLogsFilter((prev) => ({ ...prev, resultStatus: value, page: 1 }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="전체 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체</SelectItem>
                  <SelectItem value="SUCCESS">성공</SelectItem>
                  <SelectItem value="FAIL">실패</SelectItem>
                  <SelectItem value="TIMEOUT">시간초과</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={logsFilter.startDate}
                onChange={(e) =>
                  setLogsFilter((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))
                }
                className="w-[160px]"
                placeholder="시작일"
              />

              <Input
                type="date"
                value={logsFilter.endDate}
                onChange={(e) =>
                  setLogsFilter((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))
                }
                className="w-[160px]"
                placeholder="종료일"
              />
            </div>

            {/* Logs Table */}
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !logsData?.items.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mb-3 opacity-40" />
                <p>제어 로그가 없습니다</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">No.</TableHead>
                        <TableHead>공간명</TableHead>
                        <TableHead>장비명</TableHead>
                        <TableHead>명령어</TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>실행자</TableHead>
                        <TableHead>결과</TableHead>
                        <TableHead>실행시각</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData.items.map((log: ControlLogItem) => (
                        <TableRow key={log.logSeq}>
                          <TableCell className="font-medium">{log.no}</TableCell>
                          <TableCell>{log.spaceName}</TableCell>
                          <TableCell>{log.deviceName}</TableCell>
                          <TableCell>{log.commandName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {log.commandType}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.executedBy}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getLogStatusBadge(log.resultStatus)}`}>
                              {log.resultStatus}
                            </Badge>
                            {log.resultMessage && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {log.resultMessage}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(log.executedAt).toLocaleString('ko-KR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    전체 {logsData.total}개 중 {logsData.items.length}개 표시
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLogsFilter((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                      }
                      disabled={logsFilter.page === 1}
                    >
                      이전
                    </Button>
                    <div className="flex items-center px-3 text-sm">
                      {logsFilter.page} / {logsData.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLogsFilter((prev) => ({
                          ...prev,
                          page: Math.min(logsData.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={logsFilter.page >= logsData.totalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== Device Management Sheet ===== */}
      <Sheet
        open={!!manageSpaceSeq}
        onOpenChange={(open) => {
          if (!open) {
            setManageSpaceSeq(null);
            setManageSpaceName('');
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>장비 관리 - {manageSpaceName}</SheetTitle>
            <SheetDescription>공간에 등록된 장비를 관리합니다.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                총 {manageDevices.length}개
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleOpenAddDevice}>
                  <Plus className="h-4 w-4 mr-1" />
                  장비 추가
                </Button>
                <Button size="sm" variant="outline" onClick={handleOpenBulkDialog}>
                  <Upload className="h-4 w-4 mr-1" />
                  일괄 등록
                </Button>
              </div>
            </div>

            {/* Device list table */}
            {manageDevicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : manageDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mb-3 opacity-40" />
                <p>등록된 장비가 없습니다</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">No.</TableHead>
                      <TableHead>장비명</TableHead>
                      <TableHead className="w-36">프리셋</TableHead>
                      <TableHead className="w-40">IP:포트</TableHead>
                      <TableHead className="w-24 text-center">상태</TableHead>
                      <TableHead className="w-24 text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manageDevices.map((device: ControlDevice, index: number) => (
                      <TableRow key={device.spaceDeviceSeq}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{device.deviceName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{device.presetName}</span>
                            <Badge className={`text-xs ${getProtocolBadgeColor(device.protocolType)}`}>
                              {device.protocolType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {device.deviceIp}:{device.devicePort}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs ${getStatusBadgeColor(device.deviceStatus)}`}>
                            {device.deviceStatus === 'ACTIVE' ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditDevice(device)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteDevice(device)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== Device Form Dialog (Add/Edit) ===== */}
      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDevice ? '장비 수정' : '장비 추가'}</DialogTitle>
            <DialogDescription>
              {editingDevice ? '장비 정보를 수정합니다.' : '새 장비를 등록합니다.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={deviceForm.handleSubmit(handleDeviceSubmit)} className="space-y-4">
            <div>
              <Label>
                프리셋 <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="presetSeq"
                control={deviceForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => handlePresetChangeForDevice(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="프리셋을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {presetsData?.items.map((preset) => (
                        <SelectItem key={preset.presetSeq} value={String(preset.presetSeq)}>
                          {preset.presetName} ({preset.protocolType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {deviceForm.formState.errors.presetSeq && (
                <p className="mt-1 text-sm text-destructive">
                  {deviceForm.formState.errors.presetSeq.message}
                </p>
              )}
            </div>

            <div>
              <Label>
                장비명 <span className="text-destructive">*</span>
              </Label>
              <Input
                {...deviceForm.register('deviceName')}
                placeholder="장비명을 입력하세요"
              />
              {deviceForm.formState.errors.deviceName && (
                <p className="mt-1 text-sm text-destructive">
                  {deviceForm.formState.errors.deviceName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  IP <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...deviceForm.register('deviceIp')}
                  placeholder="192.168.1.100"
                />
                {deviceForm.formState.errors.deviceIp && (
                  <p className="mt-1 text-sm text-destructive">
                    {deviceForm.formState.errors.deviceIp.message}
                  </p>
                )}
              </div>
              <div>
                <Label>
                  포트 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  {...deviceForm.register('devicePort')}
                  placeholder="8080"
                />
                {deviceForm.formState.errors.devicePort && (
                  <p className="mt-1 text-sm text-destructive">
                    {deviceForm.formState.errors.devicePort.message}
                  </p>
                )}
              </div>
            </div>

            {editingDevice && (
              <div>
                <Label>상태</Label>
                <Controller
                  name="deviceStatus"
                  control={deviceForm.control}
                  render={({ field }) => (
                    <Select value={field.value || 'ACTIVE'} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">활성</SelectItem>
                        <SelectItem value="INACTIVE">비활성</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeviceDialogOpen(false);
                  setEditingDevice(null);
                  deviceForm.reset();
                }}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createDeviceMutation.isPending || updateDeviceMutation.isPending}
              >
                {(createDeviceMutation.isPending || updateDeviceMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : editingDevice ? (
                  '수정'
                ) : (
                  '추가'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Bulk Device Form Dialog ===== */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>장비 일괄 등록</DialogTitle>
            <DialogDescription>여러 장비를 한 번에 등록합니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={bulkForm.handleSubmit(handleBulkSubmit)} className="space-y-4">
            <div>
              <Label>
                프리셋 <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="presetSeq"
                control={bulkForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => handleBulkPresetChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="프리셋을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {presetsData?.items.map((preset) => (
                        <SelectItem key={preset.presetSeq} value={String(preset.presetSeq)}>
                          {preset.presetName} ({preset.protocolType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {bulkForm.formState.errors.presetSeq && (
                <p className="mt-1 text-sm text-destructive">
                  {bulkForm.formState.errors.presetSeq.message}
                </p>
              )}
            </div>

            {/* Device rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">장비 목록</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBulkRow}
                  disabled={!watchedBulkPresetSeq}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  행 추가
                </Button>
              </div>

              {bulkFields.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  프리셋을 선택한 후 행을 추가하세요.
                </div>
              ) : (
                bulkFields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">장비 #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBulkDevice(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>
                          장비명 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          {...bulkForm.register(`devices.${index}.deviceName`)}
                          placeholder="장비명"
                        />
                        {bulkForm.formState.errors.devices?.[index]?.deviceName && (
                          <p className="mt-1 text-sm text-destructive">
                            {bulkForm.formState.errors.devices[index]?.deviceName?.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>
                          IP <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          {...bulkForm.register(`devices.${index}.deviceIp`)}
                          placeholder="192.168.1.100"
                        />
                        {bulkForm.formState.errors.devices?.[index]?.deviceIp && (
                          <p className="mt-1 text-sm text-destructive">
                            {bulkForm.formState.errors.devices[index]?.deviceIp?.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>
                          포트 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          {...bulkForm.register(`devices.${index}.devicePort`)}
                          placeholder="8080"
                        />
                        {bulkForm.formState.errors.devices?.[index]?.devicePort && (
                          <p className="mt-1 text-sm text-destructive">
                            {bulkForm.formState.errors.devices[index]?.devicePort?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {bulkForm.formState.errors.devices?.message && (
                <p className="text-sm text-destructive">
                  {bulkForm.formState.errors.devices.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBulkDialogOpen(false);
                  bulkForm.reset();
                }}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={bulkCreateMutation.isPending || bulkFields.length === 0}
              >
                {bulkCreateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  `${bulkFields.length}개 일괄 등록`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Device Dialog ===== */}
      <Dialog open={deleteDeviceDialogOpen} onOpenChange={setDeleteDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>장비 삭제</DialogTitle>
            <DialogDescription>
              정말로 <strong>{deviceToDelete?.deviceName}</strong> 장비를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDeviceDialogOpen(false);
                setDeviceToDelete(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deviceToDelete) {
                  deleteDeviceMutation.mutate(deviceToDelete.spaceDeviceSeq);
                }
              }}
              disabled={deleteDeviceMutation.isPending}
            >
              {deleteDeviceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
