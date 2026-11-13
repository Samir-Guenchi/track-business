import { getTranslations } from 'next-intl/server';

export default async function FormNotFound() {
  const t = await getTranslations('orderForm.notFound');
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <p className="text-sm text-muted">{t('body')}</p>
    </div>
  );
}
