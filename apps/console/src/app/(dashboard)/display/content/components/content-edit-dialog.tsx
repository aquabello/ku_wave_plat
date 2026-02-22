'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload, X } from 'lucide-react';
import { useUpdateContentMutation } from '@/hooks/use-contents';
import { getImageUrl } from '@/lib/api/settings';
import type { ContentListItem, ContentType, UpdateContentDto } from '@ku/types';
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

const updateContentSchema = z.object({
  content_name: z
    .string()
    .min(1, '콘텐츠명을 입력하세요')
    .max(100, '콘텐츠명은 최대 100자입니다'),
  content_type: z.enum(['VIDEO', 'IMAGE', 'HTML', 'STREAM']),
  content_url: z.string().optional().or(z.literal('')),
  content_duration: z.coerce.number().positive('0보다 큰 값을 입력하세요').optional().or(z.literal('')),
  content_description: z.string().optional().or(z.literal('')),
  content_order: z.coerce.number().min(0).optional().or(z.literal('')),
});

type UpdateContentFormData = z.infer<typeof updateContentSchema>;

interface ContentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ContentListItem | null;
}

export function ContentEditDialog({ open, onOpenChange, content }: ContentEditDialogProps) {
  if (!content) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>콘텐츠 수정</SheetTitle>
          <SheetDescription>
            콘텐츠 정보를 수정합니다. 파일을 선택하면 기존 파일이 교체됩니다.
          </SheetDescription>
        </SheetHeader>
        <ContentEditForm
          key={content.content_seq}
          content={content}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function ContentEditForm({
  content,
  onClose,
}: {
  content: ContentListItem;
  onClose: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateContent, isPending } = useUpdateContentMutation();

  const form = useForm<UpdateContentFormData>({
    resolver: zodResolver(updateContentSchema),
    defaultValues: {
      content_name: content.content_name,
      content_type: content.content_type,
      content_url: content.content_url ?? '',
      content_duration: content.content_duration ?? '',
      content_description: content.content_description ?? '',
      content_order: '',
    },
  });

  const contentType = form.watch('content_type');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

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

  const onSubmit = (data: UpdateContentFormData) => {
    const payload: UpdateContentDto = {
      content_name: data.content_name,
      content_type: data.content_type as ContentType,
      content_url: data.content_url || undefined,
      content_duration: data.content_duration ? Number(data.content_duration) : undefined,
      content_description: data.content_description || undefined,
      content_order: data.content_order ? Number(data.content_order) : undefined,
    };

    updateContent(
      { contentSeq: content.content_seq, data: payload, file: selectedFile || undefined },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const currentFileUrl = getImageUrl(content.content_file_path);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">기본 정보</h3>

          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">콘텐츠 코드</p>
            <p className="text-sm font-mono font-medium">{content.content_code}</p>
          </div>

          <FormField
            control={form.control}
            name="content_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>콘텐츠명 *</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>콘텐츠 유형</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
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

        {/* 현재 파일 + 파일 교체 */}
        {contentType !== 'STREAM' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">파일</h3>

            {/* 현재 파일 */}
            {content.content_file_path && !selectedFile && (
              <div className="p-3 rounded-lg border bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">현재 파일</p>
                {content.content_type === 'IMAGE' && currentFileUrl ? (
                  <img
                    src={currentFileUrl}
                    alt={content.content_name}
                    className="max-h-32 rounded object-contain"
                  />
                ) : (
                  <p className="text-sm font-mono truncate">{content.content_file_path}</p>
                )}
              </div>
            )}

            {/* 새 파일 선택 */}
            {selectedFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB (교체 예정)
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  클릭하여 파일을 교체하세요 (선택사항)
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
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
          </div>
        )}

        {/* 스트리밍 URL */}
        {contentType === 'STREAM' && (
          <FormField
            control={form.control}
            name="content_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>스트리밍 URL</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>정렬 순서</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" min={0} {...field} />
                </FormControl>
                <FormDescription>숫자가 작을수록 앞에 표시됩니다</FormDescription>
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
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            수정
          </Button>
        </div>
      </form>
    </Form>
  );
}
