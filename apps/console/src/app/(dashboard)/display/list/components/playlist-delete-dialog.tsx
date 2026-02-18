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
import type { MockPlaylist } from '../mock-data';

interface PlaylistDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: MockPlaylist | null;
  onConfirm: () => void;
}

export function PlaylistDeleteDialog({
  open,
  onOpenChange,
  playlist,
  onConfirm,
}: PlaylistDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>플레이리스트 삭제</DialogTitle>
          <DialogDescription>
            {playlist?.name}을(를) 삭제하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
