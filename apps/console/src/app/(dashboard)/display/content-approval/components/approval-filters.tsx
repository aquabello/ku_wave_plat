'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContentApprovalFilter, ApprovalStatus } from '@ku/types';

interface ApprovalFiltersProps {
  filter: ContentApprovalFilter;
  onFilterChange: (filter: ContentApprovalFilter) => void;
  onSearch: () => void;
}

export function ApprovalFilters({
  filter,
  onFilterChange,
  onSearch,
}: ApprovalFiltersProps) {
  const handleBuildingChange = (value: string) => {
    onFilterChange({
      ...filter,
      building_seq: value === 'all' ? undefined : Number(value),
    });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filter,
      status: value === 'all' ? undefined : (value as ApprovalStatus),
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, search: e.target.value || undefined });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, start_date: e.target.value || undefined });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, end_date: e.target.value || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border">
      <div className="flex flex-wrap gap-3 items-center">
        {/* 건물 Select */}
        <Select
          value={filter.building_seq !== undefined ? String(filter.building_seq) : 'all'}
          onValueChange={handleBuildingChange}
        >
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="건물 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 건물</SelectItem>
            <SelectItem value="1">법학관</SelectItem>
            <SelectItem value="2">공학관</SelectItem>
            <SelectItem value="3">상허연구도서관</SelectItem>
          </SelectContent>
        </Select>

        {/* 상태 Select */}
        <Select
          value={filter.status ?? 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="승인 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="PENDING">대기중</SelectItem>
            <SelectItem value="APPROVED">승인됨</SelectItem>
            <SelectItem value="REJECTED">반려됨</SelectItem>
          </SelectContent>
        </Select>

        {/* 검색 Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="콘텐츠명 또는 요청자로 검색"
            className="pl-10 bg-white"
            value={filter.search ?? ''}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 시작일 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">시작일</label>
          <Input
            type="date"
            className="w-[150px] bg-white"
            value={filter.start_date ?? ''}
            onChange={handleStartDateChange}
          />
        </div>

        {/* 종료일 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">종료일</label>
          <Input
            type="date"
            className="w-[150px] bg-white"
            value={filter.end_date ?? ''}
            onChange={handleEndDateChange}
          />
        </div>

        {/* 검색 Button */}
        <Button onClick={onSearch} className="shrink-0">
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>
    </div>
  );
}
