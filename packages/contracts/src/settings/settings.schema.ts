import { z } from 'zod';

// =============================================
// Settings Response
// =============================================

export const SettingResponseSchema = z.object({
  seq: z.number(),
  apiTime: z.string().nullable(),
  playerTime: z.string().nullable(),
  screenStart: z.string().nullable(),
  screenEnd: z.string().nullable(),
  playerVer: z.string().nullable(),
  playerLink: z.string().nullable(),
  watcherVer: z.string().nullable(),
  watcherLink: z.string().nullable(),
  noticeLink: z.string().nullable(),
  introLink: z.string().nullable(),
  defaultImage: z.string().nullable(),
  regDate: z.string(),
});

// =============================================
// Settings Update Request
// =============================================

export const UpdateSettingRequestSchema = z.object({
  apiTime: z.string(),
  playerTime: z.string(),
  screenStart: z.string(),
  screenEnd: z.string(),
  playerVer: z.string().optional(),
  playerLink: z.string().optional(),
  watcherVer: z.string().optional(),
  watcherLink: z.string().optional(),
  noticeLink: z.string().optional(),
  introLink: z.string().optional(),
  defaultImage: z.string().optional(),
});

// =============================================
// Type Exports
// =============================================

export type SettingResponse = z.infer<typeof SettingResponseSchema>;
export type UpdateSettingRequest = z.infer<typeof UpdateSettingRequestSchema>;
