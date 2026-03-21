import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecorders,
  getRecorder,
  createRecorder,
  updateRecorder,
  deleteRecorder,
  getPresets,
  createPreset,
  updatePreset,
  deletePreset,
  sendPtzCommand,
  startRecording,
  stopRecording,
  applyPreset,
  getRecorderStatus,
  getRecorderLogs,
  type GetRecordersParams,
  type GetRecorderLogsParams,
} from '@/lib/api/recorders';
import type {
  CreateRecorderDto,
  UpdateRecorderDto,
  CreateRecorderPresetDto,
  UpdateRecorderPresetDto,
  PtzCommand,
  RecordStartDto,
} from '@ku/types';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const recorderKeys = {
  all: ['recorders'] as const,
  lists: () => [...recorderKeys.all, 'list'] as const,
  list: (params?: GetRecordersParams) => [...recorderKeys.lists(), params] as const,
  details: () => [...recorderKeys.all, 'detail'] as const,
  detail: (id: number) => [...recorderKeys.details(), id] as const,
  presets: (id: number) => [...recorderKeys.detail(id), 'presets'] as const,
  status: (id: number) => [...recorderKeys.detail(id), 'status'] as const,
  logs: (id: number, params?: GetRecorderLogsParams) => [...recorderKeys.detail(id), 'logs', params] as const,
};

// --- Queries ---

export function useRecordersQuery(params?: GetRecordersParams, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: recorderKeys.list(params),
    queryFn: () => getRecorders(params),
    ...options,
  });
}

export function useRecorderQuery(recorderSeq: number, enabled = true) {
  return useQuery({
    queryKey: recorderKeys.detail(recorderSeq),
    queryFn: () => getRecorder(recorderSeq),
    enabled,
  });
}

export function usePresetsQuery(recorderSeq: number, enabled = true) {
  return useQuery({
    queryKey: recorderKeys.presets(recorderSeq),
    queryFn: () => getPresets(recorderSeq),
    enabled,
  });
}

export function useRecorderStatusQuery(recorderSeq: number, enabled = true) {
  return useQuery({
    queryKey: recorderKeys.status(recorderSeq),
    queryFn: () => getRecorderStatus(recorderSeq),
    enabled,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useRecorderLogsQuery(recorderSeq: number, params?: GetRecorderLogsParams, enabled = true) {
  return useQuery({
    queryKey: recorderKeys.logs(recorderSeq, params),
    queryFn: () => getRecorderLogs(recorderSeq, params),
    enabled,
  });
}

// --- Recorder Mutations ---

export function useCreateRecorderMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateRecorderDto) => createRecorder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recorderKeys.lists() });
      toast({ title: '녹화기 등록 완료', description: '녹화기가 성공적으로 등록되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '녹화기 등록 실패', description: error.message });
    },
  });
}

export function useUpdateRecorderMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recorderSeq, data }: { recorderSeq: number; data: UpdateRecorderDto }) =>
      updateRecorder(recorderSeq, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recorderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recorderKeys.detail(variables.recorderSeq) });
      toast({ title: '녹화기 수정 완료', description: '녹화기 정보가 수정되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '녹화기 수정 실패', description: error.message });
    },
  });
}

export function useDeleteRecorderMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (recorderSeq: number) => deleteRecorder(recorderSeq),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recorderKeys.lists() });
      toast({ title: '녹화기 삭제 완료', description: '녹화기가 삭제되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '녹화기 삭제 실패', description: error.message });
    },
  });
}

// --- Preset Mutations ---

export function useCreatePresetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recorderSeq, data }: { recorderSeq: number; data: CreateRecorderPresetDto }) =>
      createPreset(recorderSeq, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recorderKeys.presets(variables.recorderSeq) });
      queryClient.invalidateQueries({ queryKey: recorderKeys.detail(variables.recorderSeq) });
      toast({ title: '프리셋 등록 완료', description: '프리셋이 성공적으로 등록되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '프리셋 등록 실패', description: error.message });
    },
  });
}

export function useUpdatePresetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recorderSeq, recPresetSeq, data }: { recorderSeq: number; recPresetSeq: number; data: UpdateRecorderPresetDto }) =>
      updatePreset(recorderSeq, recPresetSeq, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recorderKeys.presets(variables.recorderSeq) });
      queryClient.invalidateQueries({ queryKey: recorderKeys.detail(variables.recorderSeq) });
      toast({ title: '프리셋 수정 완료', description: '프리셋이 수정되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '프리셋 수정 실패', description: error.message });
    },
  });
}

export function useDeletePresetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recorderSeq, recPresetSeq }: { recorderSeq: number; recPresetSeq: number }) =>
      deletePreset(recorderSeq, recPresetSeq),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recorderKeys.presets(variables.recorderSeq) });
      queryClient.invalidateQueries({ queryKey: recorderKeys.detail(variables.recorderSeq) });
      toast({ title: '프리셋 삭제 완료', description: '프리셋이 삭제되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '프리셋 삭제 실패', description: error.message });
    },
  });
}

// --- Control Mutations ---

export function usePtzCommandMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recorderSeq, data }: { recorderSeq: number; data: PtzCommand }) =>
      sendPtzCommand(recorderSeq, data),
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'PTZ 명령 실패', description: error.message });
    },
  });
}

export function useStartRecordingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recorderSeq, data }: { recorderSeq: number; data: RecordStartDto }) =>
      startRecording(recorderSeq, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recorderKeys.status(variables.recorderSeq) });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '녹화 시작 실패', description: error.message });
    },
  });
}

export function useStopRecordingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (recorderSeq: number) => stopRecording(recorderSeq),
    onSuccess: (_, recorderSeq) => {
      queryClient.invalidateQueries({ queryKey: recorderKeys.status(recorderSeq) });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '녹화 종료 실패', description: error.message });
    },
  });
}

export function useApplyPresetMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ recorderSeq, recPresetSeq }: { recorderSeq: number; recPresetSeq: number }) =>
      applyPreset(recorderSeq, recPresetSeq),
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: '프리셋 적용 실패', description: error.message });
    },
  });
}
