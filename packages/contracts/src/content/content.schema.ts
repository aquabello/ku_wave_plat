import { z } from 'zod';

// =============================================
// Enums
// =============================================

export const ContentTypeSchema = z.enum(['VIDEO', 'IMAGE', 'HTML', 'STREAM']);

// =============================================
// Content List Item
// =============================================

export const ContentListItemSchema = z.object({
  content_seq: z.number(),
  content_name: z.string(),
  content_code: z.string(),
  content_type: ContentTypeSchema,
  content_file_path: z.string().nullable(),
  content_url: z.string().nullable(),
  content_duration: z.number().nullable(),
  content_width: z.number().nullable(),
  content_height: z.number().nullable(),
  content_size: z.number().nullable(),
  content_mime_type: z.string().nullable(),
  content_thumbnail: z.string().nullable(),
  content_description: z.string().nullable(),
  usage_count: z.number(),
  reg_date: z.string(),
  upd_date: z.string(),
});

// =============================================
// Content Detail
// =============================================

export const ContentSchema = z.object({
  content_seq: z.number(),
  content_name: z.string(),
  content_code: z.string(),
  content_type: ContentTypeSchema,
  content_file_path: z.string().nullable(),
  content_url: z.string().nullable(),
  content_duration: z.number().nullable(),
  content_width: z.number().nullable(),
  content_height: z.number().nullable(),
  content_size: z.number().nullable(),
  content_mime_type: z.string().nullable(),
  content_thumbnail: z.string().nullable(),
  content_description: z.string().nullable(),
  content_order: z.number(),
  content_isdel: z.enum(['Y', 'N']),
  reg_date: z.string(),
  upd_date: z.string(),
});

// =============================================
// Type Exports
// =============================================

export type ContentType = z.infer<typeof ContentTypeSchema>;
export type ContentListItem = z.infer<typeof ContentListItemSchema>;
export type Content = z.infer<typeof ContentSchema>;
