import { Link2Off } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function PortalNotFound() {
  const t = await getTranslations('resellerPortal.notFound');
  return (
    <div className="studio-portal-page">
      <div className="studio-portal">
        <section className="studio-state">
          <span className="studio-state__icon">
            <Link2Off size={20} aria-hidden />
          </span>
          <h1>{t('title')}</h1>
          <p>{t('body')}</p>
        </section>
      </div>
    </div>
  );
}
