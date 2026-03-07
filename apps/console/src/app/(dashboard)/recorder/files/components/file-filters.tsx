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
import type { GetFilesParams } from '@/lib/api/recordings';

interface FileFiltersProps {
  onFilterChange: (filters: Partial<GetFilesParams>) => void;
}

export function FileFilters({ onFilterChange }: FileFiltersProps) {
  const { data: buildingsData } = useBuildingsQuery();

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
      <Select
        onValueChange={(v) =>
          onFilterChange({ buildingSeq: v === 'all' ? undefined : Number(v) })
        }
        defaultValue="all"
      >
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

      <Select
        onValueChange={(v) =>
          onFilterChange({ ftpStatus: v === 'all' ? undefined : v })
        }
        defaultValue="all"
      >
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="FTP 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="PENDING">대기</SelectItem>
          <SelectItem value="UPLOADING">업로드 중</SelectItem>
          <SelectItem value="COMPLETED">완료</SelectItem>
          <SelectItem value="FAILED">실패</SelectItem>
          <SelectItem value="RETRY">재시도</SelectItem>
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
