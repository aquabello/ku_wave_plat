'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  useRecorderStatusQuery,
  usePresetsQuery,
} from '@/hooks/use-recorders';
import { PtzController } from './ptz-controller';
import { RecordingControls } from './recording-controls';
import type { RecorderLiveStatus, RecorderRecentFile, FtpUploadStatus } from '@ku/types';

interface ControlPanelProps {
  recorderSeq: number;
}

const ftpBadgeConfig: Record<FtpUploadStatus, { label: string; className: string }> = {
  PENDING: { label: '대기', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  UPLOADING: { label: '업로드 중', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  COMPLETED: { label: '완료', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  FAILED: { label: '실패', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  RETRY: { label: '재시도', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
};

export function ControlPanel({ recorderSeq }: ControlPanelProps) {
  const { data: status, isLoading } = useRecorderStatusQuery(recorderSeq);
  const { data: presetsData } = usePresetsQuery(recorderSeq);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!status) return null;

  const statusColorMap: Record<string, string> = {
    ONLINE: 'bg-green-100 text-green-800',
    OFFLINE: 'bg-gray-100 text-gray-800',
    ERROR: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{status.recorderName}</span>
          <Badge className={statusColorMap[status.recorderStatus] || ''}>
            {status.recorderStatus}
          </Badge>
        </div>
        {status.isRecording && (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-600">REC</span>
            {status.liveStatus && (
              <span className="font-mono text-sm text-red-600">
                {status.liveStatus.elapsedFormatted}
              </span>
            )}
            {status.currentSession && (
              <span className="text-sm text-muted-foreground">
                {status.currentSession.sessionTitle}
              </span>
            )}
          </div>
        )}
        {!status.isRecording && status.liveStatus && (
          <span className="text-sm text-green-600 font-medium">READY</span>
        )}
        {status.currentUser && (
          <span className="text-sm text-muted-foreground ml-auto">
            사용자: {status.currentUser.tuName}
          </span>
        )}
      </div>

      {/* Live Status — Storage */}
      {status.liveStatus && (
        <LiveStatusPanel liveStatus={status.liveStatus} />
      )}

      {/* Controls Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="text-sm font-medium mb-4">PTZ 제어</h3>
          <PtzController
            recorderSeq={recorderSeq}
            disabled={status.recorderStatus !== 'ONLINE'}
          />
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <h3 className="text-sm font-medium mb-4">녹화 제어</h3>
          <RecordingControls
            recorderSeq={recorderSeq}
            isRecording={status.isRecording}
            currentSession={status.currentSession}
            presets={presetsData?.presets || []}
            disabled={status.recorderStatus !== 'ONLINE'}
          />
        </div>
      </div>

      {/* Recent Files */}
      {status.recentFiles && status.recentFiles.length > 0 && (
        <RecentFilesPanel files={status.recentFiles} />
      )}
    </div>
  );
}

function LiveStatusPanel({ liveStatus }: { liveStatus: RecorderLiveStatus }) {
  const { storage } = liveStatus;

  return (
    <div className="p-4 rounded-lg border bg-card">
      <h3 className="text-sm font-medium mb-3">스토리지</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">사용률</span>
          <span className={storage.isWarning ? 'text-orange-600 font-medium' : ''}>
            {storage.usedPercent}%
            {storage.isWarning && ' ⚠ 경고'}
          </span>
        </div>
        <Progress
          value={storage.usedPercent}
          className={`h-2 ${storage.isWarning ? '[&>div]:bg-orange-500' : ''}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            가용: {formatBytes(storage.availableBytes)}
          </span>
          <span>
            전체: {formatBytes(storage.totalBytes)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecentFilesPanel({ files }: { files: RecorderRecentFile[] }) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <h3 className="text-sm font-medium mb-3">최근 녹화 파일</h3>
      <div className="space-y-2">
        {files.map((file) => {
          const config = ftpBadgeConfig[file.ftpStatus];
          return (
            <div key={file.recFileSeq} className="flex items-center justify-between text-sm">
              <span className="truncate max-w-[200px] font-mono text-xs" title={file.fileName}>
                {file.fileName}
              </span>
              <div className="flex items-center gap-2">
                <Badge className={config.className}>
                  {file.ftpStatus === 'UPLOADING' && (
                    <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                  {config.label}
                  {(file.ftpStatus === 'FAILED' || file.ftpStatus === 'RETRY') &&
                    ` (${file.ftpRetryCount}/3)`}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr);
  if (!bytes || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}
