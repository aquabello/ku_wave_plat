import { z } from 'zod';

// =============================================
// Menu Items
// =============================================

export const LNBMenuItemSchema = z.object({
  menuSeq: z.number(),
  menuName: z.string(),
  menuCode: z.string(),
  menuPath: z.string().nullable(),
  menuOrder: z.number().nullable(),
});

export const GNBMenuItemSchema = z.object({
  menuSeq: z.number(),
  menuName: z.string(),
  menuCode: z.string(),
  menuOrder: z.number().nullable(),
  children: z.array(LNBMenuItemSchema),
});

// =============================================
// User Menu
// =============================================

export const UserMenuResponseSchema = z.object({
  userSeq: z.number(),
  menuSeqs: z.array(z.number()),
  menuTree: z.array(GNBMenuItemSchema),
});

export const UpdateUserMenusRequestSchema = z.object({
  menuSeqs: z.array(z.number()),
});

// =============================================
// Type Exports
// =============================================

export type LNBMenuItem = z.infer<typeof LNBMenuItemSchema>;
export type GNBMenuItem = z.infer<typeof GNBMenuItemSchema>;
export type UserMenuResponse = z.infer<typeof UserMenuResponseSchema>;
