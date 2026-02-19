'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  isPending?: boolean;
}

export function RejectDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: RejectDialogProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason.trim());
    setReason('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setReason('');
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>콘텐츠 반려</DialogTitle>
          <DialogDescription>
            반려 사유를 입력해 주세요. 요청자에게 해당 사유가 전달됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="reason" className="mb-2 block">
            반려 사유 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="반려 사유를 입력하세요..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            className="resize-none"
          />
          {reason.trim() === '' && (
            <p className="text-xs text-muted-foreground mt-1">반려 사유는 필수입니다.</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending}
          >
            {isPending ? '처리 중...' : '반려'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
