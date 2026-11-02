'use client';

import { Button } from '@trackecom/ui';

interface PagedList {
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: () => Promise<unknown>;
}

export function MoreButton({ list, label }: { readonly list: PagedList; readonly label: string }) {
  if (!list.hasNextPage) return null;
  return (
    <Button
      variant="secondary"
      className="self-start"
      loading={list.isFetchingNextPage}
      onClick={() => void list.fetchNextPage()}
    >
      {label}
    </Button>
  );
}
