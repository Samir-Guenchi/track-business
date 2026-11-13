import {
  type LiveCommentReading,
  looksLikeReservation,
  readLiveComment,
  splitComments,
} from './live-comment.js';

export interface ReadComments {
  /** One per phone and code, first comment wins. */
  readonly readings: readonly (LiveCommentReading & { readonly comment: string })[];
  /** Comments repeating a phone and code already read in this batch. */
  readonly repeated: number;
  readonly unread: readonly string[];
}

const MAX_UNREAD = 50;

/** Reads a batch of pasted comments against the codes shown in the session. */
export function readComments(text: string, codes: ReadonlySet<string>): ReadComments {
  const byKey = new Map<string, LiveCommentReading & { comment: string }>();
  const unread: string[] = [];
  let repeated = 0;
  for (const comment of splitComments(text)) {
    const reading = readLiveComment(comment, codes);
    if (!reading) {
      if (unread.length < MAX_UNREAD && looksLikeReservation(comment, codes)) unread.push(comment);
      continue;
    }
    const key = `${reading.phone}|${reading.code}`;
    if (byKey.has(key)) repeated += 1;
    else byKey.set(key, { ...reading, comment: comment.slice(0, 500) });
  }
  return { readings: [...byKey.values()], repeated, unread };
}
