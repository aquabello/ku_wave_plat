'use client';

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
import { useDeleteRecorderMutation } from '@/hooks/use-recorders';
import type { RecorderListItem } from '@ku/types';

interface RecorderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recorder: RecorderListItem | null;
}

export function RecorderDeleteDialog({
  open,
  onOpenChange,
  recorder,
}: RecorderDeleteDialogProps) {
  const { mutate: deleteRecorder, isPending } = useDeleteRecorderMutation();

  if (!recorder) return null;

  const handleDelete = () => {
    deleteRecorder(recorder.recorderSeq, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>녹화기 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{recorder.recorderName}&quot; 녹화기를 삭제하시겠습니까? 이
            작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
