'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Hash,
  Terminal,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSpeechSessionDetailQuery } from '@/hooks/use-ai-system';
import type { CommandLogItem, SpeechLogItem } from '@ku/types';

const statusColorMap: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  ENDED: 'bg-gray-100 text-gray-800',
};

const statusLabelMap: Record<string, string> = {
  ACTIVE: '진행 중',
  PAUSED: '일시정지',
  ENDED: '종료',
};

const execStatusColor: Record<string, string> = {
  MATCHED: 'bg-blue-100 text-blue-800',
  EXECUTED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  NO_MATCH: 'bg-gray-100 text-gray-800',
};

const execStatusLabel: Record<string, string> = {
  MATCHED: '매칭됨',
  EXECUTED: '실행됨',
  FAILED: '실패',
  NO_MATCH: '미매칭',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

function formatTimestamp(sec: number | null): string {
  if (sec == null) return '-';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SpeechSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const sessionSeq = Number(id);
  const router = useRouter();

  const { data: detail, isLoading, error } = useSpeechSessionDetailQuery(sessionSeq);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <p className="text-destructive">세션 정보를 불러올 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Mic className="h-8 w-8 text-primary" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">세션 상세</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {detail.buildingName} {detail.spaceName}
          </p>
        </div>
        <Badge className={statusColorMap[detail.sessionStatus]}>
          {statusLabelMap[detail.sessionStatus] || detail.sessionStatus}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">위치</p>
              <p className="text-sm font-medium">
                {detail.buildingName} {detail.spaceName}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">강의자</p>
              <p className="text-sm font-medium">{detail.userName || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">소요 시간</p>
              <p className="text-sm font-medium">
                {formatDuration(detail.totalDurationSec)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">세그먼트 / 명령</p>
              <p className="text-sm font-medium">
                {detail.totalSegments}건 / {detail.totalCommands}건
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Meta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">세션 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">시작 시간</p>
              <p className="font-medium">
                {new Date(detail.startedAt).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">종료 시간</p>
              <p className="font-medium">
                {detail.endedAt
                  ? new Date(detail.endedAt).toLocaleString('ko-KR')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">STT 엔진</p>
              <p className="font-mono text-xs">
                {detail.sttEngine} / {detail.sttModel}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">녹음 파일</p>
              <p className="font-medium truncate">
                {detail.recordingFilename || '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Command Logs */}
      {detail.commandLogs && detail.commandLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              음성 명령 실행 로그 ({detail.commandLogs.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>인식 텍스트</TableHead>
                    <TableHead>매칭 키워드</TableHead>
                    <TableHead>신뢰도</TableHead>
                    <TableHead>검증소스</TableHead>
                    <TableHead>실행 결과</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.commandLogs.map((log: CommandLogItem) => (
                    <TableRow key={log.commandLogSeq}>
                      <TableCell className="text-xs">
                        {new Date(log.createdAt).toLocaleTimeString('ko-KR')}
                      </TableCell>
                      <TableCell className="font-medium">{log.recognizedText}</TableCell>
                      <TableCell>{log.matchedKeyword || '-'}</TableCell>
                      <TableCell>
                        {log.matchScore != null
                          ? `${(log.matchScore * 100).toFixed(0)}%`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.verifySource || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={execStatusColor[log.executionStatus]}>
                          {execStatusLabel[log.executionStatus] || log.executionStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STT Logs */}
      {detail.logs && detail.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="h-5 w-5" />
              STT 로그 ({detail.logs.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">구간</TableHead>
                    <TableHead>텍스트</TableHead>
                    <TableHead className="w-[80px]">신뢰도</TableHead>
                    <TableHead className="w-[60px]">명령</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.logs.map((log: SpeechLogItem) => (
                    <TableRow key={log.speechLogSeq}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {formatTimestamp(log.segmentStartSec)}-
                        {formatTimestamp(log.segmentEndSec)}
                      </TableCell>
                      <TableCell className="text-sm">{log.segmentText}</TableCell>
                      <TableCell className="text-xs">
                        {log.confidence != null
                          ? `${(log.confidence * 100).toFixed(0)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {log.isCommand === 'Y' && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            CMD
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Separator />
      <div className="flex gap-6 text-xs text-muted-foreground">
        <span>시작: {new Date(detail.startedAt).toLocaleString('ko-KR')}</span>
        {detail.endedAt && (
          <span>종료: {new Date(detail.endedAt).toLocaleString('ko-KR')}</span>
        )}
      </div>
    </div>
  );
}
