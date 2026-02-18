'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MockPlaylist, Orientation, ScreenLayout, PlayOrder } from '../mock-data';

const playlistSchema = z.object({
  name: z
    .string()
    .min(2, '플레이리스트명은 2자 이상이어야 합니다')
    .max(50, '플레이리스트명은 50자 이하여야 합니다'),
  description: z
    .string()
    .max(200, '설명은 200자 이하로 입력해주세요')
    .optional(),
});

type PlaylistFormData = z.infer<typeof playlistSchema>;

interface PlaylistEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: MockPlaylist | null;
  onSubmit: (
    id: string,
    data: {
      name: string;
      orientation: Orientation;
      screenLayout: ScreenLayout;
      playOrder: PlayOrder;
      isActive: boolean;
      description?: string;
    }
  ) => void;
}

export function PlaylistEditDialog({
  open,
  onOpenChange,
  playlist,
  onSubmit,
}: PlaylistEditDialogProps) {
  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [screenLayout, setScreenLayout] = useState<ScreenLayout>('1x1');
  const [playOrder, setPlayOrder] = useState<PlayOrder>('sequential');
  const [isActive, setIsActive] = useState<boolean>(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
  });

  useEffect(() => {
    if (playlist) {
      reset({
        name: playlist.name,
        description: playlist.description || '',
      });
      setOrientation(playlist.orientation);
      setScreenLayout(playlist.screenLayout);
      setPlayOrder(playlist.playOrder);
      setIsActive(playlist.isActive);
    }
  }, [playlist, reset]);

  const handleFormSubmit = (data: PlaylistFormData) => {
    if (playlist) {
      onSubmit(playlist.id, {
        name: data.name,
        description: data.description,
        orientation,
        screenLayout,
        playOrder,
        isActive,
      });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>플레이리스트 수정</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                플레이리스트명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="플레이리스트명 입력 (2-50자)"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-orientation">
                화면유형 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={orientation}
                onValueChange={(value) => setOrientation(value as Orientation)}
              >
                <SelectTrigger id="edit-orientation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">세로</SelectItem>
                  <SelectItem value="horizontal">가로</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-screenLayout">
                스크린구성 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={screenLayout}
                onValueChange={(value) => setScreenLayout(value as ScreenLayout)}
              >
                <SelectTrigger id="edit-screenLayout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x1">1x1</SelectItem>
                  <SelectItem value="2x2">2x2</SelectItem>
                  <SelectItem value="3x3">3x3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-playOrder">
                랜덤여부 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={playOrder}
                onValueChange={(value) => setPlayOrder(value as PlayOrder)}
              >
                <SelectTrigger id="edit-playOrder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">순차</SelectItem>
                  <SelectItem value="random">랜덤</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-isActive">사용여부</Label>
              <Select
                value={isActive ? 'true' : 'false'}
                onValueChange={(value) => setIsActive(value === 'true')}
              >
                <SelectTrigger id="edit-isActive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">활성</SelectItem>
                  <SelectItem value="false">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                placeholder="설명 입력 (최대 200자)"
                rows={3}
                maxLength={200}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button type="submit">수정</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
