'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useSessionDetailQuery } from '@/hooks/use-recordings';
import type { RecordingSessionListItem } from '@ku/types';

interface SessionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: RecordingSessionListItem | null;
}

export function SessionDetailDialog({ open, onOpenChange, session }: SessionDetailDialogProps) {
  if (!session) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>녹화 세션 상세</SheetTitle>
          <SheetDescription>
            {session.sessionTitle || '제목 없음'}
          </SheetDescription>
        </SheetHeader>
        <SessionDetailContent
          key={session.recSessionSeq}
          recSessionSeq={session.recSessionSeq}
        />
      </SheetContent>
    </Sheet>
  );
}

function SessionDetailContent({ recSessionSeq }: { recSessionSeq: number }) {
  const { data, isLoading } = useSessionDetailQuery(recSessionSeq);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) return null;

  const statusColorMap: Record<string, string> = {
    RECORDING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  const ftpStatusColorMap: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    UPLOADING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    RETRY: 'bg-orange-100 text-orange-800',
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분 ${s}초`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">세션 정보</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">녹화기</p>
            <p className="font-medium">{data.recorderName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">건물/공간</p>
            <p className="font-medium">{data.buildingName} {data.spaceName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">강의명</p>
            <p className="font-medium">{data.sessionTitle || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">교수</p>
            <p className="font-medium">{data.userName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">상태</p>
            <Badge className={statusColorMap[data.sessionStatus] || ''}>{data.sessionStatus}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground">프리셋</p>
            <p className="font-medium">{data.presetName || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">시작</p>
            <p className="font-medium">{new Date(data.startedAt).toLocaleString('ko-KR')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">종료</p>
            <p className="font-medium">{data.endedAt ? new Date(data.endedAt).toLocaleString('ko-KR') : '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">녹화시간</p>
            <p className="font-medium">{formatDuration(data.durationSec)}</p>
          </div>
        </div>
      </div>

      {/* Files */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">녹화 파일 ({data.files.length}개)</h3>
        {data.files.length === 0 ? (
          <p className="text-sm text-muted-foreground">파일이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {data.files.map((file) => (
              <div key={file.recFileSeq} className="p-3 rounded-lg border text-sm space-y-1">
                <p className="font-mono font-medium">{file.fileName}</p>
                <div className="flex flex-wrap gap-3 text-muted-foreground">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>{file.fileFormat.toUpperCase()}</span>
                  <span>{formatDuration(file.fileDurationSec)}</span>
                  <Badge className={ftpStatusColorMap[file.ftpStatus] || ''} variant="outline">
                    FTP: {file.ftpStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
