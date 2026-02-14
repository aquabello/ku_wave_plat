import { useQuery } from '@tanstack/react-query';
import { getBuildings } from '@/lib/api/buildings';

/**
 * Query Keys
 */
export const buildingKeys = {
  all: ['buildings'] as const,
  lists: () => [...buildingKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    [...buildingKeys.lists(), params] as const,
};

/**
 * 건물 목록 조회 (드롭다운용 - 전체 목록)
 */
export function useBuildingsQuery() {
  return useQuery({
    queryKey: buildingKeys.list({ limit: 100 }), // API 최대값 100
    queryFn: () => getBuildings({ limit: 100 }),
  });
}
