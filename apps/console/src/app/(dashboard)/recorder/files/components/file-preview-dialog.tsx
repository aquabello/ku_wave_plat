'use client';

import { useState } from 'react';
import { Eye, Loader2, FileVideo, Clock, HardDrive, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { previewFile, type FilePreviewInfo } from '@/lib/api/recordings';
import { useToast } from '@/hooks/use-toast';

interface FilePreviewDialogProps {
  recFileSeq: number;
  fileName: string;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}시간 ${mins}분 ${secs}초`;
  return `${mins}분 ${secs}초`;
}

export function FilePreviewDialog({ recFileSeq, fileName }: FilePreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<FilePreviewInfo | null>(null);
  const { toast } = useToast();

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const info = await previewFile(recFileSeq);
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
              {fileName}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : previewInfo ? (
            <div className="space-y-4">
              {/* Video placeholder */}
              <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center text-white/60">
                  <FileVideo className="h-16 w-16 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">녹화기 파일 스트리밍 미리보기</p>
                  <p className="text-xs mt-1 text-white/40">{previewInfo.fileFormat}</p>
                </div>
              </div>

              {/* File info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileVideo className="h-4 w-4" />
                  <span>파일명</span>
                </div>
                <div className="font-mono text-xs truncate" title={previewInfo.fileName}>
                  {previewInfo.fileName}
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
                <div>{previewInfo.fileSizeFormatted}</div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Folder className="h-4 w-4" />
                  <span>저장경로</span>
                </div>
                <div className="font-mono text-xs truncate" title={previewInfo.previewPath}>
                  {previewInfo.previewPath}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
