import { z } from 'zod';

// =============================================
// Enums
// =============================================

export const PlaylistTypeSchema = z.enum(['NORMAL', 'EMERGENCY', 'ANNOUNCEMENT']);
export const PlaylistScreenLayoutSchema = z.enum(['1x1', '1x2', '1x4', '1x8']);
export const PlaylistStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

// =============================================
// Playlist Content (mapping)
// =============================================

export const PlaylistContentSchema = z.object({
  plc_seq: z.number(),
  content_seq: z.number(),
  content_name: z.string(),
  content_code: z.string(),
  content_type: z.enum(['VIDEO', 'IMAGE', 'HTML', 'STREAM']),
  content_file_path: z.string().nullable(),
  content_url: z.string().nullable(),
  content_duration: z.number().nullable(),
  play_order: z.number(),
  play_duration: z.number().nullable(),
  transition_effect: z.string().nullable(),
  transition_duration: z.number().nullable(),
  zone_number: z.number(),
  zone_width: z.number(),
  zone_height: z.number(),
  zone_x_position: z.number(),
  zone_y_position: z.number(),
});

// =============================================
// Playlist List Item
// =============================================

export const PlaylistListItemSchema = z.object({
  playlist_seq: z.number(),
  playlist_name: z.string(),
  playlist_code: z.string(),
  playlist_type: PlaylistTypeSchema,
  playlist_priority: z.number(),
  playlist_duration: z.number().nullable(),
  playlist_loop: z.enum(['Y', 'N']),
  playlist_random: z.enum(['Y', 'N']),
  playlist_screen_layout: PlaylistScreenLayoutSchema,
  playlist_status: PlaylistStatusSchema,
  playlist_description: z.string().nullable(),
  content_count: z.number(),
  player_count: z.number(),
  reg_date: z.string(),
  upd_date: z.string(),
});

// =============================================
// Playlist Detail
// =============================================

export const PlaylistSchema = z.object({
  playlist_seq: z.number(),
  playlist_name: z.string(),
  playlist_code: z.string(),
  playlist_type: PlaylistTypeSchema,
  playlist_priority: z.number(),
  playlist_duration: z.number().nullable(),
  playlist_loop: z.enum(['Y', 'N']),
  playlist_random: z.enum(['Y', 'N']),
  playlist_screen_layout: PlaylistScreenLayoutSchema,
  playlist_status: PlaylistStatusSchema,
  playlist_description: z.string().nullable(),
  playlist_order: z.number(),
  playlist_isdel: z.enum(['Y', 'N']),
  reg_date: z.string(),
  upd_date: z.string(),
  contents: z.array(PlaylistContentSchema),
});

// =============================================
// Type Exports
// =============================================

export type PlaylistType = z.infer<typeof PlaylistTypeSchema>;
export type PlaylistScreenLayout = z.infer<typeof PlaylistScreenLayoutSchema>;
export type PlaylistStatus = z.infer<typeof PlaylistStatusSchema>;
export type PlaylistListItem = z.infer<typeof PlaylistListItemSchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
export type PlaylistContent = z.infer<typeof PlaylistContentSchema>;
