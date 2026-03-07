'use client';

import { useState } from 'react';
import { Camera, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RecorderTable } from './components/recorder-table';
import { RecorderRegisterDialog } from './components/recorder-register-dialog';
import { RecorderEditDialog } from './components/recorder-edit-dialog';
import { RecorderDeleteDialog } from './components/recorder-delete-dialog';
import { RecorderDetailDialog } from './components/recorder-detail-dialog';
import { useRecordersQuery } from '@/hooks/use-recorders';
import { useBuildingsQuery } from '@/hooks/use-buildings';
import type { GetRecordersParams } from '@/lib/api/recorders';
import type { RecorderListItem } from '@ku/types';

export default function RecorderListPage() {
  const [filters, setFilters] = useState<GetRecordersParams>({
    page: 1,
    limit: 20,
  });

  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRecorder, setSelectedRecorder] =
    useState<RecorderListItem | null>(null);

  const { data, isLoading, error } = useRecordersQuery(filters);
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
      status:
        value === 'all'
          ? undefined
          : (value as 'ONLINE' | 'OFFLINE' | 'ERROR'),
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const openDetailDialog = (recorder: RecorderListItem) => {
    setSelectedRecorder(recorder);
    setDetailDialogOpen(true);
  };

  const openEditDialog = (recorder: RecorderListItem) => {
    setSelectedRecorder(recorder);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (recorder: RecorderListItem) => {
    setSelectedRecorder(recorder);
    setDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">
          녹화기 목록을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Camera className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">녹화기 관리</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="녹화기명 또는 IP로 검색"
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
            {buildingsData?.items.map((building) => (
              <SelectItem
                key={building.buildingSeq}
                value={String(building.buildingSeq)}
              >
                {building.buildingName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={handleStatusFilter} defaultValue="all">
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="ONLINE">온라인</SelectItem>
            <SelectItem value="OFFLINE">오프라인</SelectItem>
            <SelectItem value="ERROR">에러</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Total count + Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          총 {data?.total ?? 0}개
        </p>
        <Button onClick={() => setRegisterDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          녹화기 등록
        </Button>
      </div>

      {/* Table */}
      <RecorderTable
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
        onDetail={openDetailDialog}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      {/* Dialogs */}
      <RecorderRegisterDialog
        open={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
      />

      <RecorderEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        recorder={selectedRecorder}
      />

      <RecorderDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        recorder={selectedRecorder}
      />

      <RecorderDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        recorder={selectedRecorder}
      />
    </div>
  );
}
