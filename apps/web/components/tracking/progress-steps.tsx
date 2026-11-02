import type { ParcelStatus } from '@trackecom/contracts';
import { getTranslations } from 'next-intl/server';
import { PROGRESS_STEPS, progressOf, type ProgressTone } from '../../lib/tracking/progress';

const DONE_CLASS: Readonly<Record<ProgressTone, string>> = {
  on_track: 'bg-tape',
  attention: 'bg-kraft',
  stopped: 'bg-stamp',
};

/** Five dots joined by a bar; plain markup so the page ships no JavaScript for it. */
export async function ProgressSteps({ status }: { readonly status: ParcelStatus }) {
  const t = await getTranslations('tracking.steps');
  const { reached, tone } = progressOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label={t(PROGRESS_STEPS[reached] ?? 'created')}>
      {PROGRESS_STEPS.map((step, index) => (
        <li
          key={step}
          className="flex flex-col gap-2"
          aria-current={index === reached ? 'step' : undefined}
        >
          <span
            aria-hidden
            className={`h-2 rounded-full ${index <= reached ? DONE_CLASS[tone] : 'bg-border'}`}
          />
          <span className={`text-xs ${index === reached ? 'font-semibold' : 'text-muted'}`}>
            {t(step)}
          </span>
        </li>
      ))}
    </ol>
  );
}
