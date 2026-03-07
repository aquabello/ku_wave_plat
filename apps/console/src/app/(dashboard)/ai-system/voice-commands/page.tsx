'use client';

import { useState } from 'react';
import { Volume2, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VoiceCommandTable } from './components/voice-command-table';
import { VoiceCommandRegisterDialog } from './components/voice-command-register-dialog';
import { VoiceCommandEditDialog } from './components/voice-command-edit-dialog';
import { VoiceCommandDeleteDialog } from './components/voice-command-delete-dialog';
import { useVoiceCommandsQuery } from '@/hooks/use-ai-system';
import type { GetVoiceCommandsParams } from '@/lib/api/ai-system';
import type { VoiceCommandListItem } from '@ku/types';

export default function VoiceCommandsPage() {
  const [filters, setFilters] = useState<GetVoiceCommandsParams>({});

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<VoiceCommandListItem | null>(null);

  const { data, isLoading, error } = useVoiceCommandsQuery(filters);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const openEdit = (item: VoiceCommandListItem) => {
    setSelected(item);
    setEditOpen(true);
  };

  const openDelete = (item: VoiceCommandListItem) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">음성 명령어 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Volume2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">음성 명령어 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            공간별 음성 명령어와 장비 제어 매핑을 관리합니다.
          </p>
        </div>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="키워드 검색"
            className="pl-10"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          명령어 등록
        </Button>
      </div>

      {/* Total count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {data?.items.length ?? 0}개
        </p>
      </div>

      {/* Table */}
      <VoiceCommandTable
        data={data?.items || []}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      {/* Dialogs */}
      <VoiceCommandRegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
      <VoiceCommandEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        command={selected}
      />
      <VoiceCommandDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        command={selected}
      />
    </div>
  );
}
