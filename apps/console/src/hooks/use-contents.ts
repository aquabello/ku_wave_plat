import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  type GetContentsParams,
} from '@/lib/api/contents';
import type { CreateContentDto, UpdateContentDto } from '@ku/types';

/**
 * Query Keys
 */
export const contentKeys = {
  all: ['contents'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (params?: GetContentsParams) => [...contentKeys.lists(), params] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (contentSeq: number) => [...contentKeys.details(), contentSeq] as const,
};

/**
 * 콘텐츠 목록 조회
 */
export function useContentsQuery(params?: GetContentsParams) {
  return useQuery({
    queryKey: contentKeys.list(params),
    queryFn: () => getContents(params),
  });
}

/**
 * 콘텐츠 상세 조회
 */
export function useContentQuery(contentSeq: number | null) {
  return useQuery({
    queryKey: contentSeq !== null ? contentKeys.detail(contentSeq) : ['contents', 'detail', null],
    queryFn: () => getContent(contentSeq!),
    enabled: contentSeq !== null,
  });
}

/**
 * 콘텐츠 등록
 */
export function useCreateContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, file }: { data: CreateContentDto; file?: File }) =>
      createContent(data, file),
    onSuccess: () => {
      toast.success('콘텐츠가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: contentKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '콘텐츠 등록에 실패했습니다.');
    },
  });
}

/**
 * 콘텐츠 수정
 */
export function useUpdateContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contentSeq,
      data,
      file,
    }: {
      contentSeq: number;
      data: UpdateContentDto;
      file?: File;
    }) => updateContent(contentSeq, data, file),
    onSuccess: () => {
      toast.success('콘텐츠가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: contentKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '콘텐츠 수정에 실패했습니다.');
    },
  });
}

/**
 * 콘텐츠 삭제
 */
export function useDeleteContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contentSeq: number) => deleteContent(contentSeq),
    onSuccess: () => {
      toast.success('콘텐츠가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: contentKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '콘텐츠 삭제에 실패했습니다.');
    },
  });
}
