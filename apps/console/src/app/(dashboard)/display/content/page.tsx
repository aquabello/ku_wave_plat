'use client';

import { useState } from 'react';
import { ListVideo, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaylistCard } from './components/playlist-card';
import { EmptyState } from './components/empty-state';
import { ContentList } from './components/content-list';

// Mock data - will be replaced with API calls
const mockPlaylists = [
  {
    id: 1,
    name: '법학관-콘텐츠-리스트',
    orientation: 'LANDSCAPE' as const,
    layout: '1x1',
    playMode: 'RANDOM' as const,
    approvedCount: 0,
    totalCount: 0,
  },
  {
    id: 2,
    name: '공학관-리스트',
    orientation: 'PORTRAIT' as const,
    layout: '1x1',
    playMode: 'SEQUENTIAL' as const,
    approvedCount: 0,
    totalCount: 0,
  },
  {
    id: 3,
    name: '상허도서관',
    orientation: 'PORTRAIT' as const,
    layout: '1x1',
    playMode: 'SEQUENTIAL' as const,
    approvedCount: 0,
    totalCount: 0,
  },
  {
    id: 4,
    name: '학생회관-메인-디스플레이',
    orientation: 'LANDSCAPE' as const,
    layout: '2x2',
    playMode: 'RANDOM' as const,
    approvedCount: 3,
    totalCount: 12,
  },
  {
    id: 5,
    name: '본관-입구-세로형',
    orientation: 'PORTRAIT' as const,
    layout: '1x2',
    playMode: 'SEQUENTIAL' as const,
    approvedCount: 8,
    totalCount: 15,
  },
];

export default function ContentPage() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPlaylist = mockPlaylists.find((p) => p.id === selectedPlaylistId);

  // Filter playlists based on search
  const filteredPlaylists = mockPlaylists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <ListVideo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">콘텐츠 관리</h1>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-12rem)]">
        {/* LEFT PANEL: Playlist Master List */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Playlist Header */}
          <div className="flex items-center gap-3 mb-4">
            <ListVideo className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">플레이리스트</h2>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="리스트명 검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Playlist Cards */}
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-3 pr-4">
              {filteredPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  isSelected={selectedPlaylistId === playlist.id}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                />
              ))}

              {filteredPlaylists.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT PANEL: Content Detail */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="rounded-lg border bg-card h-full min-h-[500px] p-6">
            {selectedPlaylist ? (
              <ContentList playlistName={selectedPlaylist.name} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
