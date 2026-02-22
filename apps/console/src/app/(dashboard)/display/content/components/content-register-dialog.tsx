'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload, X } from 'lucide-react';
import { useCreateContentMutation } from '@/hooks/use-contents';
import {
  usePlaylistDetailQuery,
  useUpdatePlaylistMutation,
  playlistKeys,
} from '@/hooks/use-playlists';
import type { CreateContentDto, ContentType } from '@ku/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const contentTypes: { value: ContentType; label: string }[] = [
  { value: 'IMAGE', label: '이미지' },
  { value: 'VIDEO', label: '영상' },
  { value: 'HTML', label: 'HTML' },
  { value: 'STREAM', label: '스트림' },
];

const createContentSchema = z
  .object({
    content_name: z
      .string()
      .min(1, '콘텐츠명을 입력하세요')
      .max(100, '콘텐츠명은 최대 100자입니다'),
    content_type: z.enum(['VIDEO', 'IMAGE', 'HTML', 'STREAM'], {
      required_error: '콘텐츠 유형을 선택하세요',
    }),
    content_url: z.string().optional().or(z.literal('')),
    content_duration: z.coerce.number().positive('0보다 큰 값을 입력하세요').optional().or(z.literal('')),
    content_description: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.content_type === 'STREAM' && !data.content_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'STREAM 타입은 URL이 필수입니다',
        path: ['content_url'],
      });
    }
  });

type CreateContentFormData = z.infer<typeof createContentSchema>;

interface ContentRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistSeq?: number | null;
  onContentCreated?: () => void;
}

export function ContentRegisterDialog({
  open,
  onOpenChange,
  playlistSeq,
  onContentCreated,
}: ContentRegisterDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { mutate: createContent, isPending } = useCreateContentMutation();
  const { mutate: updatePlaylist } = useUpdatePlaylistMutation();
  const { data: playlistDetail } = usePlaylistDetailQuery(playlistSeq ?? null);

  const form = useForm<CreateContentFormData>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      content_name: '',
      content_type: undefined,
      content_url: '',
      content_duration: '',
      content_description: '',
    },
  });

  const contentType = form.watch('content_type');
  const isFileRequired = contentType && contentType !== 'STREAM';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // 100MB 제한
    if (file.size > 100 * 1024 * 1024) {
      setFileError('파일 크기는 100MB를 초과할 수 없습니다.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setFileError('');

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // 100MB 제한
    if (file.size > 100 * 1024 * 1024) {
      setFileError('파일 크기는 100MB를 초과할 수 없습니다.');
      return;
    }

    setSelectedFile(file);
  };

  const onSubmit = (data: CreateContentFormData) => {
    // 파일 필수 체크 (VIDEO/IMAGE/HTML)
    if (isFileRequired && !selectedFile) {
      setFileError('파일을 선택하세요.');
      return;
    }

    const payload: CreateContentDto = {
      content_name: data.content_name,
      content_type: data.content_type as ContentType,
      content_url: data.content_url || undefined,
      content_duration: data.content_duration ? Number(data.content_duration) : undefined,
      content_description: data.content_description || undefined,
    };

    createContent(
      { data: payload, file: selectedFile || undefined },
      {
        onSuccess: (response) => {
          form.reset();
          setSelectedFile(null);
          setFileError('');
          onOpenChange(false);

          // 플레이리스트에 콘텐츠 자동 추가
          if (playlistSeq != null && response?.content_seq) {
            const existingContents = playlistDetail?.contents ?? [];
            const maxOrder = existingContents.reduce(
              (max, c) => Math.max(max, c.play_order),
              0
            );
            const newContentsArray = [
              ...existingContents.map((c) => ({
                content_seq: c.content_seq,
                play_order: c.play_order,
              })),
              {
                content_seq: response.content_seq,
                play_order: maxOrder + 1,
              },
            ];

            updatePlaylist(
              { playlistSeq, data: { contents: newContentsArray } },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: playlistKeys.all });
                  onContentCreated?.();
                },
              }
            );
          }
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setSelectedFile(null);
      setFileError('');
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>콘텐츠 등록</SheetTitle>
          <SheetDescription>
            새 콘텐츠를 등록합니다. 파일 크기는 최대 100MB입니다.
            {playlistSeq != null && ' 등록 후 플레이리스트에 자동으로 추가됩니다.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">기본 정보</h3>

              <FormField
                control={form.control}
                name="content_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>콘텐츠명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="환영 메시지" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>콘텐츠 유형 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="유형을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" sideOffset={4}>
                        {contentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 파일 업로드 (VIDEO/IMAGE/HTML) */}
            {contentType && contentType !== 'STREAM' && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">파일 업로드 *</h3>
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className={`text-sm ${isDragging ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {isDragging ? '여기에 파일을 놓으세요' : '클릭하거나 파일을 드래그하세요'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      최대 100MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={
                    contentType === 'IMAGE'
                      ? 'image/*'
                      : contentType === 'VIDEO'
                        ? 'video/*'
                        : contentType === 'HTML'
                          ? '.html,.htm'
                          : undefined
                  }
                  onChange={handleFileChange}
                />
                {fileError && (
                  <p className="text-sm text-destructive">{fileError}</p>
                )}
              </div>
            )}

            {/* 스트리밍 URL (STREAM) */}
            {contentType === 'STREAM' && (
              <FormField
                control={form.control}
                name="content_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>스트리밍 URL *</FormLabel>
                    <FormControl>
                      <Input placeholder="https://stream.example.com/live" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 추가 정보 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">추가 정보</h3>

              <FormField
                control={form.control}
                name="content_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>재생 시간 (초)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="30" min={1} {...field} />
                    </FormControl>
                    <FormDescription>콘텐츠 재생 시간을 초 단위로 입력</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="콘텐츠에 대한 설명을 입력하세요"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                등록
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
