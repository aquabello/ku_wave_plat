'use client';

import { Badge } from '@/components/ui/badge';
import {
  useRecorderStatusQuery,
  usePresetsQuery,
} from '@/hooks/use-recorders';
import { PtzController } from './ptz-controller';
import { RecordingControls } from './recording-controls';

interface ControlPanelProps {
  recorderSeq: number;
}

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

  const formatElapsed = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
            <span className="text-sm font-medium text-red-600">녹화 중</span>
            {status.currentSession && (
              <span className="text-sm text-muted-foreground">
                {status.currentSession.sessionTitle} |{' '}
                {formatElapsed(status.currentSession.elapsedSec)}
              </span>
            )}
          </div>
        )}
        {status.currentUser && (
          <span className="text-sm text-muted-foreground ml-auto">
            사용자: {status.currentUser.tuName}
          </span>
        )}
      </div>

      {/* Controls Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* PTZ Controller */}
        <div className="p-4 rounded-lg border bg-card">
          <h3 className="text-sm font-medium mb-4">PTZ 제어</h3>
          <PtzController
            recorderSeq={recorderSeq}
            disabled={status.recorderStatus !== 'ONLINE'}
          />
        </div>

        {/* Recording Controls */}
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
    </div>
  );
}
