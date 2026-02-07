'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getSystemSettings,
  updateSystemSettings,
  getImageUrl,
} from '@/lib/api/settings';
import {
  systemSettingsSchema,
  validateImageFile,
  type SystemSettingsFormValues,
} from '@/lib/validations/settings';
import { showToast } from '@/lib/toast';
import type { SystemSettings } from '@/types/settings';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/**
 * System Settings Page
 * 시스템 설정 관리 페이지
 * - API 통신주기 (5분 단위, 5~60분)
 * - 실행주기 (1분 단위, 1~60분)
 * - 블랙 시간설정 (07:00~12:00)
 * - DID 플레이어 기본 이미지 업로드
 */
export default function SettingsPage() {
  const {
    data: settings,
    isLoading,
  } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: getSystemSettings,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">설정을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">설정 데이터를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return <SettingsForm key={settings.regDate} settings={settings} />;
}

/**
 * Settings Form Component
 * 데이터 로드 완료 후에만 렌더링되어 defaultValues가 정확한 값을 갖습니다.
 */
function SettingsForm({ settings }: { settings: SystemSettings }) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<SystemSettingsFormValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      apiInterval: settings.apiInterval,
      executionInterval: settings.executionInterval,
      blackoutStartTime: settings.blackoutStartTime,
      blackoutEndTime: settings.blackoutEndTime,
      defaultImagePath: settings.defaultImagePath,
    },
  });

  // Update settings mutation (atomic: settings + image in one request)
  const updateMutation = useMutation({
    mutationFn: (params: { data: SystemSettingsFormValues; file?: File | null }) =>
      updateSystemSettings(params.data, params.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setSelectedFile(null);
      setImagePreview(null);
      showToast.success('저장 완료', '설정이 저장되었습니다.');
    },
    onError: (error: Error) => {
      showToast.error('저장 실패', error.message || '알 수 없는 오류가 발생했습니다');
    },
  });

  // Handle form submission
  const onSubmit = async (data: SystemSettingsFormValues) => {
    await updateMutation.mutateAsync({ data, file: selectedFile });
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      showToast.error('파일 오류', validationError);
      event.target.value = '';
      return;
    }

    // Set file and create preview
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  // Generate options for select dropdowns
  const apiIntervalOptions = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
  const executionIntervalOptions = Array.from({ length: 60 }, (_, i) => i + 1);

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">시스템 설정</h1>
        <p className="text-muted-foreground mt-2">
          시스템 운영에 필요한 기본 설정을 관리합니다.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 설정</CardTitle>
              <CardDescription>
                API 통신 및 실행 주기를 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* API 통신주기 */}
                <FormField
                  control={form.control}
                  name="apiInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API 통신주기</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="통신주기를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {apiIntervalOptions.map((value) => (
                            <SelectItem key={value} value={value.toString()}>
                              {value}분
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        API 서버와의 통신 주기를 5분 단위로 설정합니다 (최소 5분,
                        최대 60분)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 실행주기 */}
                <FormField
                  control={form.control}
                  name="executionInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>실행주기</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="실행주기를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {executionIntervalOptions.map((value) => (
                            <SelectItem key={value} value={value.toString()}>
                              {value}분
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        작업 실행 주기를 1분 단위로 설정합니다 (최소 1분, 최대
                        60분)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>블랙 시간 설정</CardTitle>
              <CardDescription>
                시스템 작업이 제한되는 시간대를 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 블랙 시간설정(시작) */}
                <FormField
                  control={form.control}
                  name="blackoutStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>블랙 시간설정(시작)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        스크린 세이버 시작 시간 (HH:mm)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 블랙 시간설정(종료) */}
                <FormField
                  control={form.control}
                  name="blackoutEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>블랙 시간설정(종료)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        스크린 세이버 종료 시간 (HH:mm)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>플레이어 기본 로고 설정</CardTitle>
              <CardDescription>
                플레이어에 표시될 기본 로고를 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image-upload">이미지 파일</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    권장 해상도: 128x128 | 최대 파일 크기: 5MB | JPEG/PNG
                    형식만 지원
                  </p>
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      선택 취소
                    </Button>
                  )}
                </div>

                {/* Right: Image Preview */}
                <div className="space-y-2">
                  <Label>미리보기</Label>
                  <div className="relative w-full aspect-video border rounded-lg overflow-hidden bg-muted">
                    {(imagePreview ||
                      (settings?.defaultImagePath &&
                        getImageUrl(settings.defaultImagePath))) ? (
                      <img // eslint-disable-line @next/next/no-img-element
                        src={
                          imagePreview ||
                          getImageUrl(settings!.defaultImagePath!) ||
                          ''
                        }
                        alt="기본 로고 미리보기"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
