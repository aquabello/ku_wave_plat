import { z } from 'zod';

// =============================================
// Building List Item
// =============================================

export const BuildingListItemSchema = z.object({
  buildingSeq: z.number(),
  buildingName: z.string(),
  buildingCode: z.string().nullable(),
  buildingLocation: z.string().nullable(),
  buildingFloorCount: z.number().nullable(),
  playerCount: z.number(),
  assignedUserCount: z.number(),
  spaceCount: z.number(),
});

// =============================================
// Building List Response (Paginated)
// =============================================

export const BuildingListResponseSchema = z.object({
  items: z.array(BuildingListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// =============================================
// Create / Update DTOs
// =============================================

export const CreateBuildingDtoSchema = z.object({
  buildingName: z.string(),
  buildingLocation: z.string().optional(),
  buildingFloorCount: z.number().optional(),
  buildingOrder: z.number().optional(),
  buildingManagerName: z.string().optional(),
  buildingManagerPhone: z.string().optional(),
});

export const UpdateBuildingDtoSchema = z.object({
  buildingName: z.string().optional(),
  buildingCode: z.string().optional(),
  buildingLocation: z.string().optional(),
  buildingFloorCount: z.number().optional(),
  buildingOrder: z.number().optional(),
  buildingManagerName: z.string().optional(),
  buildingManagerPhone: z.string().optional(),
});

// =============================================
// Type Exports
// =============================================

export type BuildingListItem = z.infer<typeof BuildingListItemSchema>;
export type BuildingListResponse = z.infer<typeof BuildingListResponseSchema>;
export type CreateBuildingDto = z.infer<typeof CreateBuildingDtoSchema>;
export type UpdateBuildingDto = z.infer<typeof UpdateBuildingDtoSchema>;
