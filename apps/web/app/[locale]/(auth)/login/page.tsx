import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { LoginForm } from '../../../../components/auth/login-form';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('login.title'), robots: { index: false } };
}

export default async function Page({ params }: PageProps) {
  setRequestLocale((await params).locale);
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
