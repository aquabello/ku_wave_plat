import { z } from 'zod';

// =============================================
// Enums
// =============================================

export const PlayerStatusSchema = z.enum(['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE']);
export const PlayerApprovalSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export const PlayerOrientationSchema = z.enum(['LANDSCAPE', 'PORTRAIT']);

// =============================================
// Player List Item
// =============================================

export const PlayerListItemSchema = z.object({
  player_seq: z.number(),
  player_name: z.string(),
  player_code: z.string(),
  player_did: z.string().nullable(),
  player_mac: z.string().nullable(),
  player_ip: z.string(),
  player_port: z.number(),
  player_status: PlayerStatusSchema,
  player_approval: PlayerApprovalSchema,
  last_heartbeat_at: z.string().nullable(),
  building: z.object({
    building_seq: z.number(),
    building_name: z.string(),
    building_code: z.string(),
  }),
  space: z.object({
    space_seq: z.number(),
    space_name: z.string(),
  }).nullable(),
  player_orientation: PlayerOrientationSchema,
  player_description: z.string().nullable(),
  playlist: z.object({
    playlist_seq: z.number(),
    playlist_name: z.string(),
  }).nullable(),
  reg_date: z.string(),
  upd_date: z.string(),
});

// =============================================
// Player Detail
// =============================================

export const PlayerSchema = z.object({
  player_seq: z.number(),
  player_name: z.string(),
  player_code: z.string(),
  player_did: z.string().nullable(),
  player_mac: z.string().nullable(),
  building_seq: z.number(),
  space_seq: z.number().nullable(),
  playlist_seq: z.number().nullable(),
  player_ip: z.string(),
  player_port: z.number(),
  player_api_key: z.string(),
  player_approval: PlayerApprovalSchema,
  approved_by: z.number().nullable(),
  approved_at: z.string().nullable(),
  reject_reason: z.string().nullable(),
  player_status: PlayerStatusSchema,
  last_heartbeat_at: z.string().nullable(),
  last_content_played: z.string().nullable(),
  player_version: z.string().nullable(),
  player_resolution: z.string().nullable(),
  player_orientation: PlayerOrientationSchema,
  player_description: z.string().nullable(),
  player_order: z.number(),
  player_isdel: z.enum(['Y', 'N']),
  reg_date: z.string(),
  upd_date: z.string(),
  building: z.object({
    building_seq: z.number(),
    building_name: z.string(),
    building_code: z.string(),
    building_location: z.string().nullable(),
  }),
  space: z.object({
    space_seq: z.number(),
    space_name: z.string(),
  }).nullable(),
  playlist: z.object({
    playlist_seq: z.number(),
    playlist_name: z.string(),
    playlist_code: z.string(),
  }).nullable(),
  approver: z.object({
    tu_seq: z.number(),
    tu_name: z.string(),
    tu_email: z.string(),
  }).nullable(),
});

// =============================================
// Create / Update DTOs
// =============================================

export const CreatePlayerDtoSchema = z.object({
  player_name: z.string(),
  player_code: z.string().optional(),
  player_did: z.string().optional(),
  player_mac: z.string().optional(),
  building_seq: z.number(),
  space_seq: z.number().optional(),
  player_ip: z.string(),
  player_port: z.number().optional(),
  player_resolution: z.string().optional(),
  player_orientation: PlayerOrientationSchema.optional(),
  player_description: z.string().optional(),
});

export const UpdatePlayerDtoSchema = z.object({
  player_name: z.string().optional(),
  player_did: z.string().optional(),
  player_mac: z.string().optional(),
  building_seq: z.number().optional(),
  space_seq: z.number().optional(),
  playlist_seq: z.number().optional(),
  player_ip: z.string().optional(),
  player_port: z.number().optional(),
  player_resolution: z.string().optional(),
  player_orientation: PlayerOrientationSchema.optional(),
  player_description: z.string().optional(),
  player_order: z.number().optional(),
});

// =============================================
// Heartbeat
// =============================================

export const HeartbeatDtoSchema = z.object({
  player_seq: z.number(),
  player_version: z.string().optional(),
  cpu_usage: z.number().optional(),
  memory_usage: z.number().optional(),
  disk_usage: z.number().optional(),
  current_playlist: z.number().optional(),
  current_content: z.string().optional(),
  error_message: z.string().optional(),
});

export const HeartbeatResponseSchema = z.object({
  player_seq: z.number(),
  player_status: PlayerStatusSchema,
  last_heartbeat_at: z.string(),
  should_update_playlist: z.boolean(),
  new_playlist_seq: z.number().optional(),
});

export const HeartbeatLogSchema = z.object({
  heartbeat_seq: z.number(),
  player_seq: z.number(),
  heartbeat_at: z.string(),
  player_ip: z.string().nullable(),
  player_version: z.string().nullable(),
  cpu_usage: z.number().nullable(),
  memory_usage: z.number().nullable(),
  disk_usage: z.number().nullable(),
  current_playlist: z.number().nullable(),
  current_content: z.string().nullable(),
  error_message: z.string().nullable(),
});

// =============================================
// Type Exports
// =============================================

export type PlayerStatus = z.infer<typeof PlayerStatusSchema>;
export type PlayerApproval = z.infer<typeof PlayerApprovalSchema>;
export type PlayerOrientation = z.infer<typeof PlayerOrientationSchema>;
export type PlayerListItem = z.infer<typeof PlayerListItemSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type CreatePlayerDto = z.infer<typeof CreatePlayerDtoSchema>;
export type UpdatePlayerDto = z.infer<typeof UpdatePlayerDtoSchema>;
export type HeartbeatDto = z.infer<typeof HeartbeatDtoSchema>;
export type HeartbeatResponse = z.infer<typeof HeartbeatResponseSchema>;
export type HeartbeatLog = z.infer<typeof HeartbeatLogSchema>;
