import type {
  ExpectedFeesResponse,
  FeeAuditLine,
  FeeIssue,
  PayoutLineInput,
} from '@trackecom/contracts';

export type ExpectedFee = ExpectedFeesResponse['items'][number];

export interface FeeAuditResult {
  readonly checked: number;
  readonly issues: FeeAuditLine[];
  readonly overchargedTotal: number;
}

function above(issue: FeeIssue, charged: number, expected: number | null | undefined) {
  if (expected === null || expected === undefined || charged <= expected) return [];
  return [{ issue, charged, expected, overcharge: charged - expected }];
}

/** A return fee while the same line pays cash collected: the parcel was delivered. */
function returnOnDelivered(line: PayoutLineInput) {
  if (line.codAmount === 0 || line.returnFee === 0) return [];
  const charged = line.returnFee;
  return [{ issue: 'return_fee_on_delivered' as const, charged, expected: 0, overcharge: charged }];
}

function lineIssues(line: PayoutLineInput, expected: ExpectedFee | undefined) {
  const onDelivered = returnOnDelivered(line);
  return [
    ...above('delivery_fee_above_rate', line.shippingFee, expected?.deliveryFee),
    ...(onDelivered.length > 0
      ? onDelivered
      : above('return_fee_above_rate', line.returnFee, expected?.returnFee)),
  ].map((issue) => ({ trackingNumber: line.trackingNumber, ...issue }));
}

function chargedTwice(line: PayoutLineInput): FeeAuditLine {
  const charged = line.shippingFee + line.returnFee;
  return {
    trackingNumber: line.trackingNumber,
    issue: 'charged_twice',
    charged,
    expected: null,
    overcharge: charged,
  };
}

/**
 * Checks a carrier statement's fees (#196), as Shiprocket's weight-discrepancy panel does:
 * above the rate card, a return fee on a delivered parcel, or the same parcel twice. Expected
 * fees are null when shipping could not be asked; the rate-free checks still run.
 */
export function auditFees(
  lines: readonly PayoutLineInput[],
  expected: ReadonlyMap<string, ExpectedFee> | null,
): FeeAuditResult {
  const seen = new Set<string>();
  const issues: FeeAuditLine[] = [];
  let checked = 0;
  for (const line of lines) {
    if (seen.has(line.trackingNumber)) {
      issues.push(chargedTwice(line));
      continue;
    }
    seen.add(line.trackingNumber);
    const rate = expected?.get(line.trackingNumber);
    if (rate && (rate.deliveryFee !== null || rate.returnFee !== null)) checked += 1;
    issues.push(...lineIssues(line, rate));
  }
  const overchargedTotal = issues.reduce((sum, issue) => sum + issue.overcharge, 0);
  return { checked, issues, overchargedTotal };
}
