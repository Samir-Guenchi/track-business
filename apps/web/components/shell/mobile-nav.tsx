'use client';

import { Button, Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@trackecom/ui';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { NavLinks } from './nav-links';

export function MobileNav() {
  const t = useTranslations('shell');
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('openMenu')} className="lg:hidden">
          <Menu size={20} aria-hidden />
        </Button>
      </DrawerTrigger>
      <DrawerContent side="start">
        <DrawerTitle>{t('mainNav')}</DrawerTitle>
        <nav aria-label={t('mainNav')} className="mt-4">
          <NavLinks onNavigate={() => setIsOpen(false)} />
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
