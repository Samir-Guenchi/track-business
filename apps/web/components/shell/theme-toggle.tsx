'use client';

import { Button } from '@trackecom/ui';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle() {
  const t = useTranslations('shell.theme');
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => setTheme(readTheme()), []);

  function toggle(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('trackecom-theme', next);
    } catch {
      // Private mode: the choice simply lasts for this page view.
    }
    setTheme(next);
  }

  const label = `${t('label')}: ${t(theme === 'dark' ? 'light' : 'dark')}`;
  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </Button>
  );
}
