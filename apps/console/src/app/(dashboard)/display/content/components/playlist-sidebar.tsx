'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaylistsListQuery } from '@/hooks/use-playlists';
import type { PlaylistListItem, PlaylistType } from '@ku/types';
import { cn } from '@/lib/utils';

interface PlaylistSidebarProps {
  selectedPlaylistSeq: number | null;
  onSelect: (playlistSeq: number) => void;
}

const typeLabel: Record<PlaylistType, string> = {
  NORMAL: '기본',
  EMERGENCY: '긴급',
  ANNOUNCEMENT: '공지',
};

const typeBadgeVariant: Record<PlaylistType, 'default' | 'destructive' | 'secondary'> = {
  NORMAL: 'default',
  EMERGENCY: 'destructive',
  ANNOUNCEMENT: 'secondary',
};

function getPlayMode(item: PlaylistListItem): string {
  if (item.playlist_loop === 'Y') return '반복';
  if (item.playlist_random === 'Y') return '랜덤';
  return '순차';
}

function PlaylistItemSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-5 w-12 rounded bg-muted" />
      </div>
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="h-3 w-16 rounded bg-muted" />
    </div>
  );
}

export function PlaylistSidebar({ selectedPlaylistSeq, onSelect }: PlaylistSidebarProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePlaylistsListQuery({ limit: 100 });

  const playlists = data?.items ?? [];
  const filtered = search.trim()
    ? playlists.filter((p) =>
        p.playlist_name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : playlists;

  return (
    <div className="flex w-72 shrink-0 flex-col border-r bg-background">
      <div className="border-b p-3">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">플레이리스트</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <PlaylistItemSkeleton key={i} />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {search ? '검색 결과가 없습니다.' : '플레이리스트가 없습니다.'}
              </p>
            </div>
          ) : (
            filtered.map((playlist) => (
              <button
                key={playlist.playlist_seq}
                type="button"
                onClick={() => onSelect(playlist.playlist_seq)}
                className={cn(
                  'flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                  selectedPlaylistSeq === playlist.playlist_seq && 'bg-accent',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium leading-tight">
                    {playlist.playlist_name}
                  </span>
                  <Badge
                    variant={typeBadgeVariant[playlist.playlist_type]}
                    className="shrink-0 text-xs"
                  >
                    {typeLabel[playlist.playlist_type]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{playlist.playlist_screen_layout}</span>
                  <span>·</span>
                  <span>{getPlayMode(playlist)}</span>
                  <span>·</span>
                  <span>콘텐츠 {playlist.content_count}개</span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
