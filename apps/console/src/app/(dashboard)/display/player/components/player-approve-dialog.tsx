'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useApprovePlayerMutation,
  useRejectPlayerMutation,
} from '@/hooks/use-players';
import type { PlayerListItem } from '@ku/types';

interface PlayerApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: PlayerListItem | null;
  type: 'approve' | 'reject';
}

export function PlayerApproveDialog({
  open,
  onOpenChange,
  player,
  type,
}: PlayerApproveDialogProps) {
  const [rejectReason, setRejectReason] = useState('');
  const approvePlayerMutation = useApprovePlayerMutation();
  const rejectPlayerMutation = useRejectPlayerMutation();

  const handleApprove = () => {
    if (!player) return;
    approvePlayerMutation.mutate(player.player_seq, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleReject = () => {
    if (!player || !rejectReason.trim()) return;
    rejectPlayerMutation.mutate(
      { playerSeq: player.player_seq, rejectReason: rejectReason.trim() },
      {
        onSuccess: () => {
          setRejectReason('');
          onOpenChange(false);
        },
      }
    );
  };

  if (!player) return null;

  const isApprove = type === 'approve';
  const isPending = isApprove
    ? approvePlayerMutation.isPending
    : rejectPlayerMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                플레이어 승인
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-orange-600" />
                플레이어 반려
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? '이 플레이어를 승인하시겠습니까?'
              : '이 플레이어를 반려하시겠습니까?'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>플레이어명</Label>
            <div className="text-sm font-medium">{player.player_name}</div>
          </div>
          <div className="grid gap-2">
            <Label>플레이어 코드</Label>
            <div className="text-sm font-mono">{player.player_code}</div>
          </div>
          <div className="grid gap-2">
            <Label>IP 주소</Label>
            <div className="text-sm font-mono">{player.player_ip}</div>
          </div>

          {!isApprove && (
            <div className="grid gap-2">
              <Label htmlFor="reject-reason">
                반려 사유 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="반려 사유를 입력하세요"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              {rejectReason.trim().length === 0 && (
                <p className="text-sm text-muted-foreground">
                  반려 사유는 필수입니다
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            type="button"
            variant={isApprove ? 'default' : 'destructive'}
            onClick={isApprove ? handleApprove : handleReject}
            disabled={isPending || (!isApprove && !rejectReason.trim())}
          >
            {isPending
              ? isApprove
                ? '승인 중...'
                : '반려 중...'
              : isApprove
              ? '승인'
              : '반려'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
