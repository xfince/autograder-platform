import { useQuery } from '@tanstack/react-query';
import { rubricsService, type Rubric } from '@/services';

/**
 * Hook to fetch all rubrics
 */
export function useRubrics() {
  return useQuery({
    queryKey: ['rubrics'],
    queryFn: () => rubricsService.getAll(),
  });
}

/**
 * Hook to fetch available rubrics (not linked to any assignment)
 */
export function useAvailableRubrics() {
  return useQuery({
    queryKey: ['rubrics', 'available'],
    queryFn: async () => {
      const allRubrics = await rubricsService.getAll();
      // Filter out rubrics that are already linked to an assignment
      return allRubrics.filter((rubric) => !rubric.assignment);
    },
  });
}

/**
 * Hook to fetch a single rubric by ID
 */
export function useRubric(id: string) {
  return useQuery({
    queryKey: ['rubrics', id],
    queryFn: () => rubricsService.getById(id),
    enabled: !!id,
  });
}
