'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { List, FilePlus2 } from 'lucide-react';
import {
  usePlaylistDetailQuery,
  useUpdatePlaylistMutation,
  playlistKeys,
} from '@/hooks/use-playlists';
import type { PlaylistContent, ContentListItem } from '@ku/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaylistContentCard } from './playlist-content-card';
import { ContentRegisterDialog } from './content-register-dialog';
import { ContentEditDialog } from './content-edit-dialog';

interface PlaylistContentPanelProps {
  playlistSeq: number | null;
}

const playlistTypeLabel: Record<string, string> = {
  NORMAL: '일반',
  EMERGENCY: '긴급',
  ANNOUNCEMENT: '공지',
};

const playlistTypeVariant: Record<string, 'default' | 'destructive' | 'secondary'> = {
  NORMAL: 'secondary',
  EMERGENCY: 'destructive',
  ANNOUNCEMENT: 'default',
};

const statusVariant: Record<string, 'default' | 'secondary'> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
};

export function PlaylistContentPanel({ playlistSeq }: PlaylistContentPanelProps) {
  const queryClient = useQueryClient();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentListItem | null>(null);

  const { data: playlist, isLoading } = usePlaylistDetailQuery(playlistSeq);
  const { mutate: updatePlaylist } = useUpdatePlaylistMutation();

  if (playlistSeq === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border border-dashed text-muted-foreground gap-3">
        <List className="h-12 w-12 opacity-30" />
        <p className="text-sm">좌측에서 플레이리스트를 선택하세요</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] rounded-lg border text-muted-foreground">
        <p className="text-sm">플레이리스트를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const sortedContents = [...playlist.contents].sort(
    (a, b) => a.play_order - b.play_order
  );

  const handleRemove = (content: PlaylistContent) => {
    const remaining = sortedContents
      .filter((c) => c.plc_seq !== content.plc_seq)
      .map((c, index) => ({
        content_seq: c.content_seq,
        play_order: index + 1,
      }));

    updatePlaylist(
      { playlistSeq, data: { contents: remaining } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: playlistKeys.all });
        },
      }
    );
  };

  const handleEdit = (content: PlaylistContent) => {
    const asListItem: ContentListItem = {
      content_seq: content.content_seq,
      content_name: content.content_name,
      content_code: content.content_code,
      content_type: content.content_type,
      content_file_path: content.content_file_path,
      content_url: content.content_url,
      content_duration: content.content_duration,
      content_width: null,
      content_height: null,
      content_size: null,
      content_mime_type: null,
      content_thumbnail: null,
      content_description: null,
      usage_count: 0,
      reg_date: '',
      upd_date: '',
    };
    setEditingContent(asListItem);
    setEditDialogOpen(true);
  };

  const handleContentCreated = () => {
    queryClient.invalidateQueries({ queryKey: playlistKeys.all });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-semibold leading-tight">{playlist.playlist_name}</h2>
          <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">
            {playlist.playlist_code}
          </code>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={playlistTypeVariant[playlist.playlist_type] ?? 'secondary'}>
            {playlistTypeLabel[playlist.playlist_type] ?? playlist.playlist_type}
          </Badge>
          <Badge variant="outline">{playlist.playlist_screen_layout}</Badge>
          <Badge variant="outline">
            반복 {playlist.playlist_loop === 'Y' ? 'Y' : 'N'}
          </Badge>
          <Badge variant="outline">
            랜덤 {playlist.playlist_random === 'Y' ? 'Y' : 'N'}
          </Badge>
          <Badge variant={statusVariant[playlist.playlist_status] ?? 'secondary'}>
            {playlist.playlist_status === 'ACTIVE' ? '활성' : '비활성'}
          </Badge>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          콘텐츠 {sortedContents.length}개
        </p>
        <Button
          size="sm"
          onClick={() => setRegisterDialogOpen(true)}
        >
          <FilePlus2 className="h-4 w-4 mr-1.5" />
          콘텐츠 등록
        </Button>
      </div>

      {/* Content List */}
      {sortedContents.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[200px] rounded-lg border border-dashed text-muted-foreground gap-3">
          <List className="h-10 w-10 opacity-30" />
          <p className="text-sm">등록된 콘텐츠가 없습니다</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRegisterDialogOpen(true)}
          >
            <FilePlus2 className="h-4 w-4 mr-1.5" />
            콘텐츠 등록
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedContents.map((content) => (
            <PlaylistContentCard
              key={content.plc_seq}
              content={content}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ContentRegisterDialog
        open={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
        playlistSeq={playlistSeq}
        onContentCreated={handleContentCreated}
      />
      <ContentEditDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: playlistKeys.all });
          }
        }}
        content={editingContent}
      />
    </div>
  );
}
