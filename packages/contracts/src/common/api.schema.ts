import { z } from 'zod';

// =============================================
// Pagination
// =============================================

export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

// =============================================
// API Error
// =============================================

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  timestamp: z.string(),
  path: z.string().optional(),
  details: z.any().optional(),
});

// =============================================
// API Response Wrappers
// =============================================

/** 성공 응답 래퍼 (data 필수) */
export function ApiSuccessSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: PaginationMetaSchema.optional(),
  });
}

/** 에러 응답 래퍼 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

/** 성공 응답 (data 없이 message만) */
export const ApiMessageResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

// =============================================
// Paginated Data (inside data field)
// =============================================

/** 페이지네이션 응답 내부 구조 { items, total, page, limit, totalPages } */
export function PaginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
}

/** 페이지네이션 + pagination 메타 분리 구조 { items, pagination } */
export function PaginatedWithMetaSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  });
}

// =============================================
// Type Exports
// =============================================

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
