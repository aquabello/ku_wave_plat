'use client';

import { useState, useMemo } from 'react';
import { List, Search, Plus } from 'lucide-react';
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
import {
  mockPlaylists,
  type MockPlaylist,
  type Orientation,
  type PlayOrder,
} from './mock-data';
import { toast } from 'sonner';

type OrientationFilter = 'all' | Orientation;
type PlayOrderFilter = 'all' | PlayOrder;

export default function PlaylistPage() {
  const [playlists, setPlaylists] = useState<MockPlaylist[]>(mockPlaylists);
  const [orientationFilter, setOrientationFilter] =
    useState<OrientationFilter>('all');
  const [playOrderFilter, setPlayOrderFilter] = useState<PlayOrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<MockPlaylist | null>(
    null
  );

  // Filtered playlists
  const filteredPlaylists = useMemo(() => {
    return playlists.filter((playlist) => {
      // Orientation filter
      if (
        orientationFilter !== 'all' &&
        playlist.orientation !== orientationFilter
      ) {
        return false;
      }

      // Play order filter
      if (playOrderFilter !== 'all' && playlist.playOrder !== playOrderFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return playlist.name.toLowerCase().includes(query);
      }

      return true;
    });
  }, [playlists, orientationFilter, playOrderFilter, searchQuery]);

  // Handlers
  const handleRegister = (data: {
    name: string;
    orientation: Orientation;
    screenLayout: string;
    playOrder: PlayOrder;
    isActive: boolean;
    description?: string;
  }) => {
    const newPlaylist: MockPlaylist = {
      id: String(
        Math.max(...playlists.map((p) => parseInt(p.id))) + 1
      ),
      name: data.name,
      orientation: data.orientation,
      screenLayout: data.screenLayout as MockPlaylist['screenLayout'],
      playOrder: data.playOrder,
      isActive: data.isActive,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPlaylists([...playlists, newPlaylist]);
    toast.success('플레이리스트가 등록되었습니다.');
  };

  const handleEdit = (
    id: string,
    data: {
      name: string;
      orientation: Orientation;
      screenLayout: string;
      playOrder: PlayOrder;
      isActive: boolean;
      description?: string;
    }
  ) => {
    setPlaylists(
      playlists.map((playlist) =>
        playlist.id === id
          ? {
              ...playlist,
              name: data.name,
              orientation: data.orientation,
              screenLayout: data.screenLayout as MockPlaylist['screenLayout'],
              playOrder: data.playOrder,
              isActive: data.isActive,
              description: data.description,
              updatedAt: new Date(),
            }
          : playlist
      )
    );
    toast.success('플레이리스트가 수정되었습니다.');
  };

  const handleDelete = () => {
    if (selectedPlaylist) {
      setPlaylists(playlists.filter((p) => p.id !== selectedPlaylist.id));
      toast.success('플레이리스트가 삭제되었습니다.');
    }
  };

  const openEditDialog = (playlist: MockPlaylist) => {
    setSelectedPlaylist(playlist);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (playlist: MockPlaylist) => {
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
          value={orientationFilter}
          onValueChange={(v) => setOrientationFilter(v as OrientationFilter)}
        >
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="화면유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="vertical">세로</SelectItem>
            <SelectItem value="horizontal">가로</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={playOrderFilter}
          onValueChange={(v) => setPlayOrderFilter(v as PlayOrderFilter)}
        >
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="재생 순서" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="sequential">순차</SelectItem>
            <SelectItem value="random">랜덤</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Total count + Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">총 {filteredPlaylists.length}개</p>
        <Button onClick={() => setRegisterDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          리스트 추가
        </Button>
      </div>

      {/* Table */}
      <PlaylistTable
        playlists={filteredPlaylists}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      {/* Dialogs */}
      <PlaylistRegisterDialog
        open={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
        onSubmit={handleRegister}
      />

      <PlaylistEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        playlist={selectedPlaylist}
        onSubmit={handleEdit}
      />

      <PlaylistDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        playlist={selectedPlaylist}
        onConfirm={handleDelete}
      />
    </div>
  );
}
