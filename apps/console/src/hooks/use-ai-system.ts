import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLectureSummaries,
  getLectureSummaryDetail,
  getSpeechSessions,
  getSpeechSessionDetail,
  getVoiceCommands,
  createVoiceCommand,
  updateVoiceCommand,
  deleteVoiceCommand,
  getWorkerServers,
  getWorkerServerDetail,
  createWorkerServer,
  updateWorkerServer,
  deleteWorkerServer,
  getWorkerHealth,
  type GetLectureSummariesParams,
  type GetSpeechSessionsParams,
  type GetVoiceCommandsParams,
} from '@/lib/api/ai-system';
import type {
  CreateVoiceCommandDto,
  UpdateVoiceCommandDto,
  CreateWorkerServerDto,
  UpdateWorkerServerDto,
} from '@ku/types';
import { toast } from 'sonner';

// ─── Query Keys ───

export const aiSystemKeys = {
  all: ['ai-system'] as const,
  // Lecture Summary
  lectureSummaries: () => [...aiSystemKeys.all, 'lecture-summaries'] as const,
  lectureSummaryList: (params?: GetLectureSummariesParams) =>
    [...aiSystemKeys.lectureSummaries(), params] as const,
  lectureSummaryDetail: (seq: number) =>
    [...aiSystemKeys.lectureSummaries(), 'detail', seq] as const,
  // Speech Session
  speechSessions: () => [...aiSystemKeys.all, 'speech-sessions'] as const,
  speechSessionList: (params?: GetSpeechSessionsParams) =>
    [...aiSystemKeys.speechSessions(), params] as const,
  speechSessionDetail: (seq: number) =>
    [...aiSystemKeys.speechSessions(), 'detail', seq] as const,
  // Voice Command
  voiceCommands: () => [...aiSystemKeys.all, 'voice-commands'] as const,
  voiceCommandList: (params?: GetVoiceCommandsParams) =>
    [...aiSystemKeys.voiceCommands(), params] as const,
  // Worker Server
  workerServers: () => [...aiSystemKeys.all, 'worker-servers'] as const,
  workerServerDetail: (seq: number) =>
    [...aiSystemKeys.workerServers(), 'detail', seq] as const,
  workerHealth: (seq: number) =>
    [...aiSystemKeys.workerServers(), 'health', seq] as const,
};

// ─── 1. Lecture Summary Hooks ───

export function useLectureSummariesQuery(params?: GetLectureSummariesParams) {
  return useQuery({
    queryKey: aiSystemKeys.lectureSummaryList(params),
    queryFn: () => getLectureSummaries(params),
  });
}

export function useLectureSummaryDetailQuery(summarySeq: number, enabled = true) {
  return useQuery({
    queryKey: aiSystemKeys.lectureSummaryDetail(summarySeq),
    queryFn: () => getLectureSummaryDetail(summarySeq),
    enabled,
  });
}

// ─── 2. Speech Session Hooks ───

export function useSpeechSessionsQuery(params?: GetSpeechSessionsParams) {
  return useQuery({
    queryKey: aiSystemKeys.speechSessionList(params),
    queryFn: () => getSpeechSessions(params),
  });
}

export function useSpeechSessionDetailQuery(sessionSeq: number, enabled = true) {
  return useQuery({
    queryKey: aiSystemKeys.speechSessionDetail(sessionSeq),
    queryFn: () => getSpeechSessionDetail(sessionSeq),
    enabled,
  });
}

// ─── 3. Voice Command Hooks ───

export function useVoiceCommandsQuery(params?: GetVoiceCommandsParams) {
  return useQuery({
    queryKey: aiSystemKeys.voiceCommandList(params),
    queryFn: () => getVoiceCommands(params),
  });
}

export function useCreateVoiceCommandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoiceCommandDto) => createVoiceCommand(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.voiceCommands() });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error('음성 명령어 등록 실패', { description: error.message });
    },
  });
}

export function useUpdateVoiceCommandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seq, data }: { seq: number; data: UpdateVoiceCommandDto }) =>
      updateVoiceCommand(seq, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.voiceCommands() });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error('음성 명령어 수정 실패', { description: error.message });
    },
  });
}

export function useDeleteVoiceCommandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seq: number) => deleteVoiceCommand(seq),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.voiceCommands() });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error('음성 명령어 삭제 실패', { description: error.message });
    },
  });
}

// ─── 4. Worker Server Hooks ───

export function useWorkerServersQuery() {
  return useQuery({
    queryKey: aiSystemKeys.workerServers(),
    queryFn: () => getWorkerServers(),
  });
}

export function useWorkerServerDetailQuery(seq: number, enabled = true) {
  return useQuery({
    queryKey: aiSystemKeys.workerServerDetail(seq),
    queryFn: () => getWorkerServerDetail(seq),
    enabled,
  });
}

export function useWorkerHealthQuery(seq: number, enabled = true) {
  return useQuery({
    queryKey: aiSystemKeys.workerHealth(seq),
    queryFn: () => getWorkerHealth(seq),
    enabled,
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
}

export function useCreateWorkerServerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkerServerDto) => createWorkerServer(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.workerServers() });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error('Worker 서버 등록 실패', { description: error.message });
    },
  });
}

export function useUpdateWorkerServerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seq, data }: { seq: number; data: UpdateWorkerServerDto }) =>
      updateWorkerServer(seq, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.workerServers() });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error('Worker 서버 수정 실패', { description: error.message });
    },
  });
}

export function useDeleteWorkerServerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seq: number) => deleteWorkerServer(seq),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.workerServers() });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error('Worker 서버 삭제 실패', { description: error.message });
    },
  });
}
