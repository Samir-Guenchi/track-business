import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateClaimRequest, UpdateClaimRequest } from '@trackecom/contracts';
import { claimsApi } from '../api/claims-api';

const ROOT = ['claims'] as const;

export const useClaimCandidates = () =>
  useQuery({ queryKey: [...ROOT, 'candidates'], queryFn: claimsApi.candidates });

export const useClaims = () =>
  useQuery({ queryKey: [...ROOT, 'list'], queryFn: () => claimsApi.list() });

export const useClaimLetter = (id: string, lang: 'fr' | 'ar') =>
  useQuery({
    queryKey: [...ROOT, 'letter', id, lang],
    queryFn: () => claimsApi.letter(id, { lang }),
  });

export const useScorecard = (days: number) =>
  useQuery({ queryKey: ['carrier-scorecard', days], queryFn: () => claimsApi.scorecard(days) });

/** Opening or moving a claim refreshes the candidates, the claims and the scorecard. */
function useClaimMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROOT });
      await queryClient.invalidateQueries({ queryKey: ['carrier-scorecard'] });
    },
  });
}

export const useOpenClaim = () =>
  useClaimMutation((body: CreateClaimRequest) => claimsApi.open(body));

export const useUpdateClaim = () =>
  useClaimMutation(({ id, body }: { id: string; body: UpdateClaimRequest }) =>
    claimsApi.update(id, body),
  );
