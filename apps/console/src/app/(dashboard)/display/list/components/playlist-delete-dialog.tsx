'use client';

import { Loader2 } from 'lucide-react';
import { useDeletePlaylistMutation } from '@/hooks/use-playlists';
import type { PlaylistListItem } from '@ku/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PlaylistDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: PlaylistListItem | null;
}

export function PlaylistDeleteDialog({
  open,
  onOpenChange,
  playlist,
}: PlaylistDeleteDialogProps) {
  const { mutate: deletePlaylist, isPending } = useDeletePlaylistMutation();

  const handleConfirm = () => {
    if (!playlist) return;

    deletePlaylist(playlist.playlist_seq, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>플레이리스트 삭제</DialogTitle>
          <DialogDescription>
            <strong>{playlist?.playlist_name}</strong>을(를) 삭제하시겠습니까?
            <br />
            <span className="text-xs text-muted-foreground">
              삭제된 플레이리스트는 복구할 수 없습니다.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
