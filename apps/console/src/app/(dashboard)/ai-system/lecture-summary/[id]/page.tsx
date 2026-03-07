'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  FileText,
  Tag,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLectureSummaryDetailQuery } from '@/hooks/use-ai-system';

const statusColorMap: Record<string, string> = {
  UPLOADING: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const statusLabelMap: Record<string, string> = {
  UPLOADING: '업로드 중',
  PROCESSING: '처리 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

export default function LectureSummaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const summarySeq = Number(id);
  const router = useRouter();

  const { data: detail, isLoading, error } = useLectureSummaryDetailQuery(summarySeq);

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
        <p className="text-destructive">강의요약 정보를 불러올 수 없습니다.</p>
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
        <BookOpen className="h-8 w-8 text-primary" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {detail.recordingTitle || '강의요약 상세'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {detail.buildingName} {detail.spaceName} ({detail.spaceFloor}층)
          </p>
        </div>
        <Badge className={statusColorMap[detail.processStatus]}>
          {statusLabelMap[detail.processStatus] || detail.processStatus}
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
              <p className="text-xs text-muted-foreground">녹음 시간</p>
              <p className="text-sm font-medium">{detail.durationFormatted || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">파일명</p>
              <p className="text-sm font-medium truncate">{detail.recordingFilename}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">녹음 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">녹음일시</p>
              <p className="font-medium">
                {detail.recordedAt
                  ? new Date(detail.recordedAt).toLocaleString('ko-KR')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">디바이스</p>
              <p className="font-medium">{detail.deviceCode}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Job ID</p>
              <p className="font-mono text-xs truncate">{detail.jobId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">STT 신뢰도</p>
              <p className="font-medium">
                {detail.sttConfidence != null
                  ? `${(detail.sttConfidence * 100).toFixed(1)}%`
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      {detail.summaryKeywords && detail.summaryKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              키워드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {detail.summaryKeywords.map((kw: string) => (
                <Badge key={kw} variant="secondary" className="text-sm">
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {detail.summaryText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap leading-relaxed">{detail.summaryText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STT Full Text */}
      {detail.sttText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">STT 전문</CardTitle>
            {detail.sttLanguage && (
              <p className="text-xs text-muted-foreground">
                감지 언어: {detail.sttLanguage.toUpperCase()}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{detail.sttText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing pending message */}
      {detail.processStatus !== 'COMPLETED' && detail.processStatus !== 'FAILED' && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm text-blue-800">
              AI 처리가 진행 중입니다. 완료 시 STT 전문과 요약이 표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Separator />
      <div className="flex gap-6 text-xs text-muted-foreground">
        <span>등록: {new Date(detail.regDate).toLocaleString('ko-KR')}</span>
        <span>수정: {new Date(detail.updDate).toLocaleString('ko-KR')}</span>
        {detail.completedAt && (
          <span>완료: {new Date(detail.completedAt).toLocaleString('ko-KR')}</span>
        )}
      </div>
    </div>
  );
}
