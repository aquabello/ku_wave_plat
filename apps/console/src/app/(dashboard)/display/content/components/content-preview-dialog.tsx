'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';
import { getImageUrl } from '@/lib/api/settings';
import type { ContentListItem } from '@ku/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ContentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ContentListItem | null;
}

/** 파일 크기 포맷 */
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const contentTypeLabels: Record<string, string> = {
  VIDEO: '영상',
  IMAGE: '이미지',
  HTML: 'HTML',
  STREAM: '스트림',
};

export function ContentPreviewDialog({ open, onOpenChange, content }: ContentPreviewDialogProps) {
  if (!content) return null;

  const fileUrl = getImageUrl(content.content_file_path);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content.content_name}</DialogTitle>
          <DialogDescription className="font-mono">{content.content_code}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 미리보기 영역 */}
          <div className="rounded-lg border bg-black/5 overflow-hidden">
            {content.content_type === 'IMAGE' && fileUrl && (
              <img
                src={fileUrl}
                alt={content.content_name}
                className="w-full max-h-[360px] object-contain"
              />
            )}

            {content.content_type === 'VIDEO' && fileUrl && (
              <video
                src={fileUrl}
                controls
                className="w-full max-h-[360px]"
                preload="metadata"
              >
                브라우저가 비디오를 지원하지 않습니다.
              </video>
            )}

            {content.content_type === 'HTML' && fileUrl && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">HTML 콘텐츠</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline inline-flex items-center gap-1"
                >
                  새 탭에서 열기
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {content.content_type === 'STREAM' && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">스트리밍 URL</p>
                <a
                  href={content.content_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline break-all inline-flex items-center gap-1"
                >
                  {content.content_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {!fileUrl && content.content_type !== 'STREAM' && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                미리보기를 사용할 수 없습니다.
              </div>
            )}
          </div>

          {/* 상세 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="유형">
              <Badge variant="outline">{contentTypeLabels[content.content_type]}</Badge>
            </InfoItem>
            <InfoItem label="파일 크기">{formatFileSize(content.content_size)}</InfoItem>
            <InfoItem label="MIME 타입">
              <span className="font-mono text-xs">{content.content_mime_type ?? '-'}</span>
            </InfoItem>
            <InfoItem label="사용 횟수">{content.usage_count}곳</InfoItem>
            {content.content_duration && (
              <InfoItem label="재생 시간">{content.content_duration}초</InfoItem>
            )}
            {content.content_width && content.content_height && (
              <InfoItem label="해상도">
                {content.content_width} x {content.content_height}
              </InfoItem>
            )}
            <InfoItem label="등록일">
              {content.reg_date
                ? format(new Date(content.reg_date), 'yyyy.MM.dd HH:mm', { locale: ko })
                : '-'}
            </InfoItem>
            <InfoItem label="수정일">
              {content.upd_date
                ? format(new Date(content.upd_date), 'yyyy.MM.dd HH:mm', { locale: ko })
                : '-'}
            </InfoItem>
          </div>

          {/* 설명 */}
          {content.content_description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">설명</p>
              <p className="text-sm whitespace-pre-wrap">{content.content_description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-2 rounded border bg-muted/20">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5">{children}</div>
    </div>
  );
}
