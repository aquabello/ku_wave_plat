'use client';

import { useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFtpConfigsQuery } from '@/hooks/use-ftp-configs';
import { FtpConfigCard } from './components/ftp-config-card';
import { FtpConfigFormDialog } from './components/ftp-config-form-dialog';
import { FtpDeleteDialog } from './components/ftp-delete-dialog';
import type { FtpConfigListItem } from '@ku/types';

export default function FtpConfigPage() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<FtpConfigListItem | null>(null);

  const { data, isLoading, error } = useFtpConfigsQuery();

  const openCreateDialog = () => {
    setSelectedConfig(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (config: FtpConfigListItem) => {
    setSelectedConfig(config);
    setFormDialogOpen(true);
  };

  const openDeleteDialog = (config: FtpConfigListItem) => {
    setSelectedConfig(config);
    setDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">FTP 설정 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">FTP 설정</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          총 {data?.items.length ?? 0}개
        </p>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          FTP 설정 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((config) => (
            <FtpConfigCard
              key={config.ftpConfigSeq}
              config={config}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
          ))}
          {data?.items.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-[200px] rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">등록된 FTP 설정이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      <FtpConfigFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        config={selectedConfig}
      />

      <FtpDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        config={selectedConfig}
      />
    </div>
  );
}
