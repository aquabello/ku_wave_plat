import { z } from 'zod';
import { LNBMenuItemSchema, GNBMenuItemSchema } from '../menu/menu.schema';

// =============================================
// Login
// =============================================

export const LoginDtoSchema = z.object({
  id: z.string(),
  password: z.string(),
});

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    seq: z.number(),
    id: z.string(),
    name: z.string(),
    email: z.string(),
    type: z.string(),
    step: z.string(),
  }),
  menus: z.array(GNBMenuItemSchema),
});

// =============================================
// Refresh Token
// =============================================

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

// =============================================
// JWT Payload
// =============================================

export const JwtPayloadSchema = z.object({
  sub: z.number(),
  id: z.string(),
  type: z.string(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

// =============================================
// Current User
// =============================================

export const CurrentUserSchema = z.object({
  seq: z.number(),
  id: z.string(),
  name: z.string(),
  email: z.string(),
  type: z.string(),
  step: z.string(),
});

// =============================================
// Type Exports
// =============================================

export type LoginDto = z.infer<typeof LoginDtoSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
export type CurrentUser = z.infer<typeof CurrentUserSchema>;
