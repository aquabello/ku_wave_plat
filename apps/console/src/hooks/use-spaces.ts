import { useQuery } from '@tanstack/react-query';
import { getSpaces } from '@/lib/api/spaces';

/**
 * Query Keys
 */
export const spaceKeys = {
  all: ['spaces'] as const,
  lists: () => [...spaceKeys.all, 'list'] as const,
  list: (buildingSeq: number, params?: { limit?: number }) =>
    [...spaceKeys.lists(), buildingSeq, params] as const,
};

/**
 * 공간 목록 조회 (드롭다운용 - 건물별)
 */
export function useSpacesQuery(buildingSeq: number | null) {
  return useQuery({
    queryKey: spaceKeys.list(buildingSeq!, { limit: 100 }),
    queryFn: () => getSpaces(buildingSeq!, { limit: 100 }),
    enabled: !!buildingSeq,
  });
}
