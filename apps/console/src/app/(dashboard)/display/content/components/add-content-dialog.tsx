'use client';

import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContentsQuery } from '@/hooks/use-contents';
import { usePlaylistDetailQuery, useUpdatePlaylistMutation } from '@/hooks/use-playlists';
import type { ContentType } from '@ku/types';

interface AddContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistSeq: number;
  existingContentSeqs: number[];
  onAdded: () => void;
}

const contentTypeLabel: Record<ContentType, string> = {
  IMAGE: '이미지',
  VIDEO: '비디오',
  HTML: 'HTML',
  STREAM: '스트림',
};

const contentTypeBadgeVariant: Record<
  ContentType,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  IMAGE: 'default',
  VIDEO: 'secondary',
  HTML: 'outline',
  STREAM: 'destructive',
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-';
  return `${seconds}초`;
}

export function AddContentDialog({
  open,
  onOpenChange,
  playlistSeq,
  existingContentSeqs,
  onAdded,
}: AddContentDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedSeqs, setSelectedSeqs] = useState<number[]>([]);

  const { data: contentsData, isLoading: contentsLoading } = useContentsQuery({ limit: 100 });
  const { data: playlistDetail } = usePlaylistDetailQuery(open ? playlistSeq : null);
  const updateMutation = useUpdatePlaylistMutation();

  const contents = contentsData?.items ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return contents;
    return contents.filter((c) =>
      c.content_name.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [contents, search]);

  const existingSet = useMemo(() => new Set(existingContentSeqs), [existingContentSeqs]);

  function toggleSelect(seq: number) {
    if (existingSet.has(seq)) return; // already in playlist, cannot toggle
    setSelectedSeqs((prev) =>
      prev.includes(seq) ? prev.filter((s) => s !== seq) : [...prev, seq],
    );
  }

  async function handleAdd() {
    if (selectedSeqs.length === 0) return;

    const currentContents = playlistDetail?.contents ?? [];
    const maxOrder = currentContents.reduce((max, c) => Math.max(max, c.play_order), 0);

    const existingMapped = currentContents.map((c) => ({
      content_seq: c.content_seq,
      play_order: c.play_order,
      play_duration: c.play_duration ?? undefined,
      transition_effect: c.transition_effect ?? undefined,
      transition_duration: c.transition_duration ?? undefined,
      zone_number: c.zone_number,
      zone_width: c.zone_width,
      zone_height: c.zone_height,
      zone_x_position: c.zone_x_position,
      zone_y_position: c.zone_y_position,
    }));

    const newItems = selectedSeqs.map((seq, idx) => ({
      content_seq: seq,
      play_order: maxOrder + idx + 1,
    }));

    await updateMutation.mutateAsync({
      playlistSeq,
      data: { contents: [...existingMapped, ...newItems] },
    });

    setSelectedSeqs([]);
    setSearch('');
    onAdded();
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedSeqs([]);
      setSearch('');
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>콘텐츠 추가</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="콘텐츠 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          {contentsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">콘텐츠가 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 py-1 pr-2">
              {filtered.map((content) => {
                const isExisting = existingSet.has(content.content_seq);
                const isSelected = selectedSeqs.includes(content.content_seq);

                return (
                  <label
                    key={content.content_seq}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isExisting
                        ? 'cursor-default bg-muted opacity-60'
                        : isSelected
                          ? 'border-primary bg-accent'
                          : 'hover:bg-accent'
                    }`}
                  >
                    <Checkbox
                      checked={isExisting || isSelected}
                      disabled={isExisting}
                      onCheckedChange={() => toggleSelect(content.content_seq)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={contentTypeBadgeVariant[content.content_type]}
                          className="text-xs"
                        >
                          {contentTypeLabel[content.content_type]}
                        </Badge>
                        {isExisting && (
                          <span className="text-xs text-muted-foreground">이미 추가됨</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium">{content.content_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(content.content_duration)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedSeqs.length === 0 || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                추가 중...
              </>
            ) : (
              `추가 (${selectedSeqs.length}개)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
