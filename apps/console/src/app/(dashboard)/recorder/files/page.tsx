'use client';

import { useState } from 'react';
import { FileVideo } from 'lucide-react';
import { FileTable } from './components/file-table';
import { FileFilters } from './components/file-filters';
import { useFilesQuery } from '@/hooks/use-recordings';
import type { GetFilesParams } from '@/lib/api/recordings';

export default function RecorderFilesPage() {
  const [filters, setFilters] = useState<GetFilesParams>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useFilesQuery(filters);

  const handleFilterChange = (newFilters: Partial<GetFilesParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">녹화 파일 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileVideo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">녹화파일 관리</h1>
      </div>

      <FileFilters onFilterChange={handleFilterChange} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          총 {data?.total ?? 0}개
        </p>
      </div>

      <FileTable
        data={data?.items || []}
        pagination={
          data
            ? {
                total: data.total,
                page: data.page,
                limit: data.limit,
                totalPages: data.totalPages,
              }
            : undefined
        }
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
