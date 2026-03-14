'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { ServerStatus } from '@/lib/api/controller-socket';
import { apiClient } from '@/lib/api/client';

interface ConnectionPanelProps {
  serverStatus: ServerStatus;
  ip: string;
  port: string;
  onIpChange: (ip: string) => void;
  onPortChange: (port: string) => void;
}

interface BuildingItem {
  buildingSeq: number;
  buildingName: string;
}

interface SpaceItem {
  spaceSeq: number;
  spaceName: string;
}

interface DeviceInfo {
  deviceIp: string;
  devicePort: number;
}

export function ConnectionPanel({
  serverStatus, ip, port, onIpChange, onPortChange,
}: ConnectionPanelProps) {
  const [selectedBuilding, setSelectedBuilding] = useState('');

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-select'],
    queryFn: async () => {
      const res = await apiClient<{ items: BuildingItem[] }>('/buildings?limit=100');
      return res.items;
    },
  });

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces-select', selectedBuilding],
    queryFn: async () => {
      const res = await apiClient<{ items: SpaceItem[] }>(
        `/buildings/${selectedBuilding}/spaces?limit=100`,
      );
      return res.items;
    },
    enabled: !!selectedBuilding,
  });

  const handleBuildingChange = (buildingSeq: string) => {
    setSelectedBuilding(buildingSeq);
  };

  const handleSpaceChange = async (spaceSeq: string) => {
    try {
      const res = await apiClient<{ devices: DeviceInfo[] }>(
        `/controller/control/spaces/${spaceSeq}/devices`,
      );
      if (res.devices?.length > 0) {
        onIpChange(res.devices[0].deviceIp);
        onPortChange(String(res.devices[0].devicePort || '9090'));
      }
    } catch {
      // 디바이스 없으면 무시
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>연결 설정</span>
          <div className="flex gap-2">
            <Badge variant={serverStatus.listening ? 'default' : 'destructive'}>
              TCP Server {serverStatus.listening ? `ON :${serverStatus.port}` : 'OFF'}
            </Badge>
            {serverStatus.connectedClients > 0 && (
              <Badge variant="outline">
                수신 {serverStatus.connectedClients}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>건물</Label>
            <Select onValueChange={handleBuildingChange}>
              <SelectTrigger><SelectValue placeholder="건물 선택" /></SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.buildingSeq} value={String(b.buildingSeq)}>
                    {b.buildingName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>호실</Label>
            <Select onValueChange={handleSpaceChange}>
              <SelectTrigger><SelectValue placeholder="호실 선택" /></SelectTrigger>
              <SelectContent>
                {spaces.map((s) => (
                  <SelectItem key={s.spaceSeq} value={String(s.spaceSeq)}>
                    {s.spaceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-2">
            <Label>컨트롤러 IP</Label>
            <Input
              value={ip}
              onChange={(e) => onIpChange(e.target.value)}
              placeholder="호실 선택 시 자동 입력"
            />
          </div>
          <div className="space-y-2">
            <Label>포트</Label>
            <Input
              type="number"
              value={port}
              onChange={(e) => onPortChange(e.target.value)}
              placeholder="9090"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
