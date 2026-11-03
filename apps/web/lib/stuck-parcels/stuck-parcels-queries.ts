import { useQuery } from '@tanstack/react-query';
import { stuckParcelsApi } from '../api/stuck-parcels-api';

export const useStuckParcels = (carrier: string) =>
  useQuery({
    queryKey: ['stuck-parcels', carrier],
    queryFn: () => stuckParcelsApi.list(carrier || undefined),
  });
