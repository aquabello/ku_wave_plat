'use client';

import { useState } from 'react';
import { Monitor, Search, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlayerTable } from './components/player-table';
import { PlayerRegisterDialog } from './components/player-register-dialog';
import { PlayerEditDialog } from './components/player-edit-dialog';
import { PlayerDeleteDialog } from './components/player-delete-dialog';
import { PlayerApproveDialog } from './components/player-approve-dialog';
import { usePlayersQuery } from '@/hooks/use-players';
import { useBuildingsQuery } from '@/hooks/use-buildings';
import type { GetPlayersParams } from '@/lib/api/players';
import type { PlayerListItem } from '@ku/types';
import { toast } from 'sonner';

export default function PlayerPage() {
  const [filters, setFilters] = useState<GetPlayersParams>({
    page: 1,
    limit: 20,
  });

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveType, setApproveType] = useState<'approve' | 'reject'>('approve');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerListItem | null>(null);

  // 플레이어 목록 조회
  const { data, isLoading, error } = usePlayersQuery(filters);

  // 건물 목록 조회 (드롭다운용)
  const { data: buildingsData } = useBuildingsQuery();

  // 검색어 입력
  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  // 건물 필터
  const handleBuildingFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      building_seq: value === 'all' ? undefined : Number(value),
      page: 1,
    }));
  };

  // 상태 필터
  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      approval: value === 'all' ? undefined : (value as 'PENDING' | 'APPROVED' | 'REJECTED'),
      page: 1,
    }));
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExportExcel = () => {
    toast.info('엑셀 다운로드 기능은 준비 중입니다.');
  };

  const openEditDialog = (player: PlayerListItem) => {
    setSelectedPlayer(player);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (player: PlayerListItem) => {
    setSelectedPlayer(player);
    setDeleteDialogOpen(true);
  };

  const openApproveDialog = (player: PlayerListItem) => {
    setSelectedPlayer(player);
    setApproveType('approve');
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (player: PlayerListItem) => {
    setSelectedPlayer(player);
    setApproveType('reject');
    setApproveDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">플레이어 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">플레이어 관리</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
        {/* Left: Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="플레이어명 또는 IP로 검색"
            className="pl-10"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Right: Filters */}
        <Select onValueChange={handleBuildingFilter} defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="건물 선택" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="all">전체 건물</SelectItem>
            {buildingsData?.items.map((building) => (
              <SelectItem key={building.buildingSeq} value={String(building.buildingSeq)}>
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
            <SelectItem value="PENDING">승인 대기</SelectItem>
            <SelectItem value="APPROVED">승인 완료</SelectItem>
            <SelectItem value="REJECTED">반려</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Total count + Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          총 {data?.pagination.total ?? 0}개
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button onClick={() => setRegisterDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            플레이어 등록
          </Button>
        </div>
      </div>

      {/* Table */}
      <PlayerTable
        data={data?.items || []}
        pagination={data?.pagination}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onApprove={openApproveDialog}
        onReject={openRejectDialog}
      />

      {/* Dialogs */}
      <PlayerRegisterDialog
        open={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
      />

      <PlayerEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        player={selectedPlayer}
      />

      <PlayerDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        player={selectedPlayer}
      />

      <PlayerApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        player={selectedPlayer}
        type={approveType}
      />
    </div>
  );
}
