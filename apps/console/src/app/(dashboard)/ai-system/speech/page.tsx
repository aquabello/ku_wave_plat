'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpeechSessionTable } from './components/speech-session-table';
import { useSpeechSessionsQuery } from '@/hooks/use-ai-system';
import type { GetSpeechSessionsParams } from '@/lib/api/ai-system';
import type { SpeechSessionListItem } from '@ku/types';

export default function SpeechSessionPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<GetSpeechSessionsParams>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useSpeechSessionsQuery(filters);

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      sessionStatus: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDetail = (item: SpeechSessionListItem) => {
    router.push(`/ai-system/speech/${item.sessionSeq}`);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">음성인식 세션 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Mic className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">실시간 음성인식</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            음성인식 세션 및 STT 로그, 명령 실행 이력을 관리합니다.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex-1" />
        <Select onValueChange={handleStatusFilter} defaultValue="all">
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="ACTIVE">진행 중</SelectItem>
            <SelectItem value="PAUSED">일시정지</SelectItem>
            <SelectItem value="ENDED">종료</SelectItem>
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
      <SpeechSessionTable
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
