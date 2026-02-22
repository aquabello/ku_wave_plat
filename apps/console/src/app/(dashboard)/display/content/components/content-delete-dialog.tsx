'use client';

import { Loader2, AlertTriangle } from 'lucide-react';
import { useDeleteContentMutation } from '@/hooks/use-contents';
import type { ContentListItem } from '@ku/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ContentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ContentListItem | null;
}

export function ContentDeleteDialog({ open, onOpenChange, content }: ContentDeleteDialogProps) {
  const { mutate: deleteContent, isPending } = useDeleteContentMutation();

  if (!content) return null;

  const handleDelete = () => {
    deleteContent(content.content_seq, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            콘텐츠 삭제
          </DialogTitle>
          <DialogDescription>
            이 작업은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">콘텐츠명</p>
            <p className="text-sm font-medium">{content.content_name}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">콘텐츠 코드</p>
            <p className="text-sm font-mono">{content.content_code}</p>
          </div>
          {content.usage_count > 0 && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
              <p className="text-xs text-amber-700 font-medium">
                이 콘텐츠는 현재 {content.usage_count}곳에서 사용 중입니다.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
