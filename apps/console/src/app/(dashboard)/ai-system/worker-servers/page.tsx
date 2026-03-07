'use client';

import { useState } from 'react';
import { Server, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkerServerTable } from './components/worker-server-table';
import { WorkerServerRegisterDialog } from './components/worker-server-register-dialog';
import { WorkerServerEditDialog } from './components/worker-server-edit-dialog';
import { WorkerServerDeleteDialog } from './components/worker-server-delete-dialog';
import { WorkerHealthDialog } from './components/worker-health-dialog';
import { useWorkerServersQuery } from '@/hooks/use-ai-system';
import type { WorkerServerListItem } from '@ku/types';

export default function WorkerServersPage() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [selected, setSelected] = useState<WorkerServerListItem | null>(null);

  const { data, isLoading, error } = useWorkerServersQuery();

  const openEdit = (item: WorkerServerListItem) => {
    setSelected(item);
    setEditOpen(true);
  };

  const openDelete = (item: WorkerServerListItem) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  const openHealth = (item: WorkerServerListItem) => {
    setSelected(item);
    setHealthOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">Worker 서버 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Server className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Worker 서버 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI 처리용 GPU Worker 서버를 관리합니다.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {data?.items.length ?? 0}개
        </p>
        <Button onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          서버 등록
        </Button>
      </div>

      {/* Table */}
      <WorkerServerTable
        data={data?.items || []}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={openDelete}
        onHealth={openHealth}
      />

      {/* Dialogs */}
      <WorkerServerRegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
      <WorkerServerEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        server={selected}
      />
      <WorkerServerDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        server={selected}
      />
      <WorkerHealthDialog
        open={healthOpen}
        onOpenChange={setHealthOpen}
        server={selected}
      />
    </div>
  );
}
