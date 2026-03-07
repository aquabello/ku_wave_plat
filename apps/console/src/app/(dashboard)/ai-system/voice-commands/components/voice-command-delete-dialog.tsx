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
import { useDeleteVoiceCommandMutation } from '@/hooks/use-ai-system';
import type { VoiceCommandListItem } from '@ku/types';

interface VoiceCommandDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  command: VoiceCommandListItem | null;
}

export function VoiceCommandDeleteDialog({
  open,
  onOpenChange,
  command,
}: VoiceCommandDeleteDialogProps) {
  const { mutate: deleteCommand, isPending } = useDeleteVoiceCommandMutation();

  if (!command) return null;

  const handleDelete = () => {
    deleteCommand(command.voiceCommandSeq, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>음성 명령어 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{command.keyword}&quot; 명령어를 삭제하시겠습니까?
            <br />
            삭제된 명령어는 복구할 수 없습니다.
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
