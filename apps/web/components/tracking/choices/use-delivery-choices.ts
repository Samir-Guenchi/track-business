'use client';

import type {
  CreateDeliveryRequest,
  DeliveryChoices,
  DeliveryRequestKind,
} from '@trackecom/contracts';
import { useEffect, useState } from 'react';
import {
  type ChoiceErrorKey,
  fetchChoices,
  sendChoice,
} from '../../../lib/tracking/delivery-choices-api';

/** The parcel's choices, the one the customer has open, and what the last send gave. */
export function useDeliveryChoices(code: string) {
  const [choices, setChoices] = useState<DeliveryChoices | null>(null);
  const [open, setOpen] = useState<DeliveryRequestKind | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChoiceErrorKey | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchChoices(code)
      .then(setChoices)
      .catch(() => setChoices(null));
  }, [code]);

  const pick = (kind: DeliveryRequestKind | null) => {
    setOpen(kind);
    setError(null);
    setSent(false);
  };

  const send = async (request: CreateDeliveryRequest) => {
    setSending(true);
    setError(null);
    try {
      const result = await sendChoice(code, request);
      if (!result.ok) return setError(result.error);
      setChoices(result.choices);
      setOpen(null);
      setSent(true);
    } catch {
      setError('generic');
    } finally {
      setSending(false);
    }
  };

  return { choices, open, pick, send, sending, error, sent };
}

export type DeliveryChoicesState = ReturnType<typeof useDeliveryChoices>;
