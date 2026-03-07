'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LectureSummaryTable } from './components/lecture-summary-table';
import { useLectureSummariesQuery } from '@/hooks/use-ai-system';
import { useBuildingsQuery } from '@/hooks/use-buildings';
import type { GetLectureSummariesParams } from '@/lib/api/ai-system';
import type { LectureSummaryListItem } from '@ku/types';

export default function LectureSummaryPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<GetLectureSummariesParams>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useLectureSummariesQuery(filters);
  const { data: buildingsData } = useBuildingsQuery();

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined, page: 1 }));
  };

  const handleBuildingFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      buildingSeq: value === 'all' ? undefined : Number(value),
      page: 1,
    }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      processStatus: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDetail = (item: LectureSummaryListItem) => {
    router.push(`/ai-system/lecture-summary/${item.summarySeq}`);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">강의요약 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">강의요약</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            강의 녹음 STT 변환 및 AI 요약 결과를 관리합니다.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="강의 제목, 파일명, 키워드 검색"
            className="pl-10"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <Select onValueChange={handleBuildingFilter} defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="건물 선택" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="all">전체 건물</SelectItem>
            {buildingsData?.items.map((b) => (
              <SelectItem key={b.buildingSeq} value={String(b.buildingSeq)}>
                {b.buildingName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={handleStatusFilter} defaultValue="all">
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="UPLOADING">업로드 중</SelectItem>
            <SelectItem value="PROCESSING">처리 중</SelectItem>
            <SelectItem value="COMPLETED">완료</SelectItem>
            <SelectItem value="FAILED">실패</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Total count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {data?.total ?? 0}개
        </p>
      </div>

      {/* Table */}
      <LectureSummaryTable
        data={data?.items || []}
        pagination={
          data
            ? { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages }
            : undefined
        }
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onDetail={handleDetail}
      />
    </div>
  );
}
