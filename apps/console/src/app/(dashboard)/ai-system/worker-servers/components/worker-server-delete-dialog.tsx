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
import { useDeleteWorkerServerMutation } from '@/hooks/use-ai-system';
import type { WorkerServerListItem } from '@ku/types';

interface WorkerServerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: WorkerServerListItem | null;
}

export function WorkerServerDeleteDialog({
  open,
  onOpenChange,
  server,
}: WorkerServerDeleteDialogProps) {
  const { mutate: deleteServer, isPending } = useDeleteWorkerServerMutation();

  if (!server) return null;

  const handleDelete = () => {
    deleteServer(server.workerServerSeq, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Worker 서버 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{server.serverName}&quot; 서버를 삭제하시겠습니까?
            <br />
            삭제된 서버는 복구할 수 없습니다.
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
