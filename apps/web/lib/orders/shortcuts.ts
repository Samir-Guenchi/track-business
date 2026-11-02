import { canTransition, type OrderStatus } from '@trackecom/contracts';

export type ShortcutAction = 'next' | 'previous' | 'open' | 'confirm' | 'cancel';

const KEY_ACTIONS: Readonly<Record<string, ShortcutAction>> = {
  j: 'next',
  ArrowDown: 'next',
  k: 'previous',
  ArrowUp: 'previous',
  Enter: 'open',
  c: 'confirm',
  x: 'cancel',
};

const TYPING_TAGS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

/** The list shortcut for a key press, unless the agent is typing or using a modifier. */
export function shortcutFor(event: {
  key: string;
  target: { tagName?: string; isContentEditable?: boolean } | null;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): ShortcutAction | undefined {
  if (event.ctrlKey || event.metaKey || event.altKey) return undefined;
  const target = event.target;
  if (target?.isContentEditable || TYPING_TAGS.has(target?.tagName ?? '')) return undefined;
  return KEY_ACTIONS[event.key];
}

/** Moves the highlight, staying inside the list. */
export function moveIndex(current: number, action: 'next' | 'previous', length: number): number {
  if (length === 0) return -1;
  const next = action === 'next' ? current + 1 : current - 1;
  return Math.min(Math.max(next, 0), length - 1);
}

/** The status a shortcut moves to, if the order may make that move. */
export function targetStatus(
  action: 'confirm' | 'cancel',
  status: OrderStatus,
): OrderStatus | undefined {
  const target: OrderStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
  return canTransition(status, target) ? target : undefined;
}
