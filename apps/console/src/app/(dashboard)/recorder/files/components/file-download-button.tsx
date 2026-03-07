'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/api/recordings';
import { useToast } from '@/hooks/use-toast';

interface FileDownloadButtonProps {
  recFileSeq: number;
  fileName: string;
}

export function FileDownloadButton({ recFileSeq, fileName }: FileDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blobUrl = await downloadFile(recFileSeq);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '다운로드 실패',
        description:
          error instanceof Error ? error.message : '파일 다운로드 중 오류가 발생했습니다.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      title="다운로드"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
