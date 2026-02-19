'use client';

import { useState } from 'react';
import { List, Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlaylistTable } from './components/playlist-table';
import { PlaylistRegisterDialog } from './components/playlist-register-dialog';
import { PlaylistEditDialog } from './components/playlist-edit-dialog';
import { PlaylistDeleteDialog } from './components/playlist-delete-dialog';
import { usePlaylistsListQuery } from '@/hooks/use-playlists';
import type { PlaylistListItem, PlaylistType } from '@ku/types';

type TypeFilter = 'all' | PlaylistType;

export default function PlaylistPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistListItem | null>(null);

  // 실제 API 호출
  const { data, isLoading } = usePlaylistsListQuery({
    limit: 100,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    search: searchQuery.trim() || undefined,
  });

  const playlists = data?.items ?? [];

  const openEditDialog = (playlist: PlaylistListItem) => {
    setSelectedPlaylist(playlist);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (playlist: PlaylistListItem) => {
    setSelectedPlaylist(playlist);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <List className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">플레이리스트 관리</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
        {/* Left: Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="플레이리스트명으로 검색"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right: Filters */}
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TypeFilter)}
        >
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="NORMAL">일반</SelectItem>
            <SelectItem value="EMERGENCY">긴급</SelectItem>
            <SelectItem value="ANNOUNCEMENT">공지</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Total count + Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              로딩 중...
            </span>
          ) : (
            `총 ${playlists.length}개`
          )}
        </p>
        <Button onClick={() => setRegisterDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          리스트 추가
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PlaylistTable
          playlists={playlists}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      {/* Dialogs */}
      <PlaylistRegisterDialog
        open={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
      />

      <PlaylistEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        playlist={selectedPlaylist}
      />

      <PlaylistDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        playlist={selectedPlaylist}
      />
    </div>
  );
}
