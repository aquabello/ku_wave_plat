'use client';

import { Activity, Cpu, HardDrive, Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkerHealthQuery } from '@/hooks/use-ai-system';
import type { WorkerServerListItem } from '@ku/types';

const statusColorMap: Record<string, string> = {
  ONLINE: 'bg-green-100 text-green-800',
  OFFLINE: 'bg-gray-100 text-gray-800',
  ERROR: 'bg-red-100 text-red-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
};

interface WorkerHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: WorkerServerListItem | null;
}

export function WorkerHealthDialog({
  open,
  onOpenChange,
  server,
}: WorkerHealthDialogProps) {
  const { data, isLoading, refetch } = useWorkerHealthQuery(
    server?.workerServerSeq ?? 0,
    open && !!server,
  );

  if (!server) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {server.serverName} 헬스체크
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={statusColorMap[data.serverStatus]}>
                {data.serverStatus}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                새로고침
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <Cpu className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">GPU</p>
                    <p className="text-lg font-bold">
                      {(data as Record<string, unknown>).gpu_available ? '사용 가능' : '없음'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <HardDrive className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">버전</p>
                    <p className="text-lg font-bold">
                      {(data as Record<string, unknown>).version ?? '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <Activity className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">활성 / 대기 Job</p>
                    <p className="text-lg font-bold">
                      {(data as Record<string, unknown>).active_jobs ?? 0} / {(data as Record<string, unknown>).pending_jobs ?? 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <RefreshCw className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">상태</p>
                    <p className="text-lg font-bold">
                      {(data as Record<string, unknown>).status === 'ok' ? '정상' : '오류'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-destructive">헬스체크에 실패했습니다.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
