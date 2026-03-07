'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useBuildingsQuery } from '@/hooks/use-buildings';
import type { GetSessionsParams } from '@/lib/api/recordings';

interface SessionFiltersProps {
  onFilterChange: (filters: Partial<GetSessionsParams>) => void;
}

export function SessionFilters({ onFilterChange }: SessionFiltersProps) {
  const { data: buildingsData } = useBuildingsQuery();

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
      <Select onValueChange={(v) => onFilterChange({ buildingSeq: v === 'all' ? undefined : Number(v) })} defaultValue="all">
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

      <Select onValueChange={(v) => onFilterChange({ status: v === 'all' ? undefined : v })} defaultValue="all">
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="상태 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="RECORDING">녹화 중</SelectItem>
          <SelectItem value="COMPLETED">완료</SelectItem>
          <SelectItem value="FAILED">실패</SelectItem>
          <SelectItem value="CANCELLED">취소</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-full md:w-[160px]"
        onChange={(e) => onFilterChange({ startDate: e.target.value || undefined })}
      />
      <span className="text-sm text-muted-foreground hidden md:block">~</span>
      <Input
        type="date"
        className="w-full md:w-[160px]"
        onChange={(e) => onFilterChange({ endDate: e.target.value || undefined })}
      />
    </div>
  );
}
