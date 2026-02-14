'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import type { Orientation, ScreenLayout, PlayOrder } from '../mock-data';

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

interface PlaylistRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    orientation: Orientation;
    screenLayout: ScreenLayout;
    playOrder: PlayOrder;
    isActive: boolean;
    description?: string;
  }) => void;
}

export function PlaylistRegisterDialog({
  open,
  onOpenChange,
  onSubmit,
}: PlaylistRegisterDialogProps) {
  const [orientation, setOrientation] = useState<Orientation | ''>('');
  const [screenLayout, setScreenLayout] = useState<ScreenLayout | ''>('');
  const [playOrder, setPlayOrder] = useState<PlayOrder | ''>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
  });

  const handleFormSubmit = (data: PlaylistFormData) => {
    if (!orientation || !screenLayout || !playOrder) {
      return;
    }
    onSubmit({
      name: data.name,
      description: data.description,
      orientation: orientation as Orientation,
      screenLayout: screenLayout as ScreenLayout,
      playOrder: playOrder as PlayOrder,
      isActive,
    });
    handleReset();
  };

  const handleReset = () => {
    reset();
    setOrientation('');
    setScreenLayout('');
    setPlayOrder('');
    setIsActive(true);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>플레이리스트 등록</SheetTitle>
          <SheetDescription>
            새로운 플레이리스트를 등록합니다.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                플레이리스트명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="플레이리스트명 입력 (2-50자)"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="orientation">
                화면유형 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={orientation}
                onValueChange={(value) => setOrientation(value as Orientation)}
              >
                <SelectTrigger id="orientation">
                  <SelectValue placeholder="화면유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">세로</SelectItem>
                  <SelectItem value="horizontal">가로</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="screenLayout">
                스크린구성 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={screenLayout}
                onValueChange={(value) => setScreenLayout(value as ScreenLayout)}
              >
                <SelectTrigger id="screenLayout">
                  <SelectValue placeholder="스크린구성 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x1">1x1</SelectItem>
                  <SelectItem value="2x2">2x2</SelectItem>
                  <SelectItem value="3x3">3x3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="playOrder">
                랜덤여부 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={playOrder}
                onValueChange={(value) => setPlayOrder(value as PlayOrder)}
              >
                <SelectTrigger id="playOrder">
                  <SelectValue placeholder="재생 순서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">순차</SelectItem>
                  <SelectItem value="random">랜덤</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="isActive">사용여부</Label>
              <Select
                value={isActive ? 'true' : 'false'}
                onValueChange={(value) => setIsActive(value === 'true')}
              >
                <SelectTrigger id="isActive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">활성</SelectItem>
                  <SelectItem value="false">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
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
            <Button type="button" variant="outline" onClick={handleReset}>
              취소
            </Button>
            <Button type="submit">등록</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
