'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { SessionTable } from './components/session-table';
import { SessionFilters } from './components/session-filters';
import { SessionDetailDialog } from './components/session-detail-dialog';
import { useSessionsQuery } from '@/hooks/use-recordings';
import type { GetSessionsParams } from '@/lib/api/recordings';
import type { RecordingSessionListItem } from '@ku/types';

export default function RecorderHistoryPage() {
  const [filters, setFilters] = useState<GetSessionsParams>({
    page: 1,
    limit: 20,
  });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RecordingSessionListItem | null>(null);

  const { data, isLoading, error } = useSessionsQuery(filters);

  const handleFilterChange = (newFilters: Partial<GetSessionsParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const openDetailDialog = (session: RecordingSessionListItem) => {
    setSelectedSession(session);
    setDetailDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">녹화 이력을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">녹화 이력</h1>
      </div>

      <SessionFilters onFilterChange={handleFilterChange} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          총 {data?.total ?? 0}개
        </p>
      </div>

      <SessionTable
        data={data?.items || []}
        pagination={data ? { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages } : undefined}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onDetail={openDetailDialog}
      />

      <SessionDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        session={selectedSession}
      />
    </div>
  );
}
