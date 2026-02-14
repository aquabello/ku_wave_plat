'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeletePlayerMutation } from '@/hooks/use-players';
import type { PlayerListItem } from '@ku/types';

interface PlayerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: PlayerListItem | null;
}

export function PlayerDeleteDialog({
  open,
  onOpenChange,
  player,
}: PlayerDeleteDialogProps) {
  const deletePlayerMutation = useDeletePlayerMutation();

  const handleConfirm = () => {
    if (!player) return;

    deletePlayerMutation.mutate(player.player_seq, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>플레이어 삭제</DialogTitle>
          <DialogDescription>
            {player?.player_name}을(를) 삭제하시겠습니까?
            <br />
            <span className="text-red-500 text-sm">이 작업은 되돌릴 수 없습니다.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deletePlayerMutation.isPending}
          >
            {deletePlayerMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
