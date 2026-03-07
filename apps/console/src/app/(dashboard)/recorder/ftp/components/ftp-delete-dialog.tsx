'use client';

import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteFtpConfigMutation } from '@/hooks/use-ftp-configs';
import type { FtpConfigListItem } from '@ku/types';

interface FtpDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FtpConfigListItem | null;
}

export function FtpDeleteDialog({ open, onOpenChange, config }: FtpDeleteDialogProps) {
  const { mutate: deleteConfig, isPending } = useDeleteFtpConfigMutation();

  if (!config) return null;

  const handleDelete = () => {
    deleteConfig(config.ftpConfigSeq, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>FTP 설정 삭제</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              <strong>{config.ftpName}</strong> FTP 설정을 삭제하시겠습니까?
            </span>
            <span className="block text-destructive text-sm">
              이 설정에 연결된 녹화기나 스케줄이 있는 경우 삭제가 불가능합니다(409 오류).
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
