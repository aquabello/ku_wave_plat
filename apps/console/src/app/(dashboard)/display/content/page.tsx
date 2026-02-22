'use client';

import { useState } from 'react';
import { FileVideo } from 'lucide-react';
import { PlaylistSidebar } from './components/playlist-sidebar';
import { PlaylistContentPanel } from './components/playlist-content-panel';

export default function ContentPage() {
  const [selectedPlaylistSeq, setSelectedPlaylistSeq] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileVideo className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">콘텐츠 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            플레이리스트를 선택하여 콘텐츠를 관리합니다.
          </p>
        </div>
      </div>

      {/* 2-Panel Layout */}
      <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
        {/* Left: Playlist Sidebar */}
        <PlaylistSidebar
          selectedPlaylistSeq={selectedPlaylistSeq}
          onSelect={setSelectedPlaylistSeq}
        />

        {/* Right: Content Panel */}
        <div className="flex-1 min-w-0">
          <PlaylistContentPanel playlistSeq={selectedPlaylistSeq} />
        </div>
      </div>
    </div>
  );
}
