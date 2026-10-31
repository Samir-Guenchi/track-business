import { ControlsSection } from './controls-section.js';
import { DomainSection } from './domain-section.js';
import { OverlaySection } from './overlay-section.js';
import { TableSection } from './table-section.js';
import { storyCopy } from './copy.js';
import type { UiLocale } from '../domain/money-dzd.js';

export interface ComponentsShowcaseProps {
  readonly locale: UiLocale;
}

export function ComponentsShowcase({ locale }: ComponentsShowcaseProps) {
  const copy = storyCopy[locale];
  return (
    <main className="tk-showcase">
      <header className="tk-showcase__header">
        <div>
          <h1>TrackEcom UI</h1>
          <p>{copy.storyDescription}</p>
        </div>
      </header>
      <div className="tk-showcase__grid">
        <ControlsSection copy={copy} locale={locale} />
        <DomainSection copy={copy} locale={locale} />
        <TableSection copy={copy} />
        <OverlaySection copy={copy} />
      </div>
    </main>
  );
}
