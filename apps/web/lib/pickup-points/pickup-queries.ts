import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PickupPointInput, ReleaseParcel } from '@trackecom/contracts';
import { pickupPointsApi } from '../api/pickup-points-api';

const ROOT = ['pickup-points'] as const;

export const usePickupPoints = () => useQuery({ queryKey: ROOT, queryFn: pickupPointsApi.list });

export const useHeldParcels = (pointId: string) =>
  useQuery({
    queryKey: [...ROOT, pointId, 'held'],
    queryFn: () => pickupPointsApi.parcels(pointId, 'held'),
  });

export const usePickupStatement = (pointId: string, month: string) =>
  useQuery({
    queryKey: [...ROOT, pointId, 'statement', month],
    queryFn: () => pickupPointsApi.statement(pointId, month),
  });

/** Every write changes what a point holds or owes, so it refreshes all point queries. */
function usePointMutation<TInput, TResult>(write: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOT }),
  });
}

export const useSavePoint = (pointId?: string) =>
  usePointMutation((body: PickupPointInput) =>
    pointId ? pickupPointsApi.update(pointId, body) : pickupPointsApi.create(body),
  );

export const useDropParcel = (pointId: string) =>
  usePointMutation((trackingNumber: string) => pickupPointsApi.drop(pointId, trackingNumber));

export const useReleaseParcel = (pointId: string) =>
  usePointMutation(({ shipmentId, body }: { shipmentId: string; body: ReleaseParcel }) =>
    pickupPointsApi.release(pointId, shipmentId, body),
  );

export const useHandover = (pointId: string) =>
  usePointMutation(() => pickupPointsApi.handover(pointId));
