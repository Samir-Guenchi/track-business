import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CreateStoreForm } from '../../../components/onboarding/create-store-form';
import { SignedInOnly } from '../../../components/session/signed-in-only';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'onboarding' });
  return { title: t('title'), robots: { index: false } };
}

export default async function OnboardingPage({ params }: PageProps) {
  setRequestLocale((await params).locale);
  return (
    <main
      id="main"
      className="flex min-h-screen items-start justify-center bg-canvas px-4 py-12 text-ink sm:items-center"
    >
      <SignedInOnly>
        <CreateStoreForm />
      </SignedInOnly>
    </main>
  );
}
