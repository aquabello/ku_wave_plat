'use client';

import { useState } from 'react';
import { Eye, Loader2, FileVideo, Clock, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { previewFile, getPreviewUrl, type FilePreviewInfo } from '@/lib/api/recordings';
import { useToast } from '@/hooks/use-toast';

interface FilePreviewDialogProps {
  recFileSeq: number;
  fileName: string;
  sessionTitle?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  fileDurationSec?: number;
  fileFormat?: string;
  filePath?: string;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}시간 ${mins}분 ${secs}초`;
  return `${mins}분 ${secs}초`;
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
}

export function FilePreviewDialog({ recFileSeq, fileName, sessionTitle, fileSize, fileSizeFormatted, fileDurationSec, fileFormat, filePath }: FilePreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<FilePreviewInfo | null>(null);
  const { toast } = useToast();

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const info = await previewFile(recFileSeq, {
        fileName,
        fileFormat: fileFormat ?? 'mp4',
        fileDurationSec: fileDurationSec ?? 0,
        fileSize: String(fileSize ?? 0),
        fileSizeFormatted: fileSizeFormatted || formatFileSize(fileSize),
      });
      setPreviewInfo(info);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '미리보기 실패',
        description: error instanceof Error ? error.message : '파일 정보를 불러올 수 없습니다.',
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        title="미리보기"
      >
        <Eye className="h-4 w-4 text-blue-600" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5 text-primary" />
              {sessionTitle || fileName}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : previewInfo ? (
            <div className="space-y-4">
              {/* Video player */}
              <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
                <video
                  src={getPreviewUrl(recFileSeq)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  브라우저가 비디오 재생을 지원하지 않습니다.
                </video>
              </div>

              {/* File info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileVideo className="h-4 w-4" />
                  <span>강의명</span>
                </div>
                <div className="truncate" title={sessionTitle || previewInfo.fileName}>
                  {sessionTitle || previewInfo.fileName}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>녹화시간</span>
                </div>
                <div>{formatDuration(previewInfo.fileDurationSec)}</div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="h-4 w-4" />
                  <span>파일크기</span>
                </div>
                <div>{fileSizeFormatted || previewInfo.fileSizeFormatted}</div>

              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
