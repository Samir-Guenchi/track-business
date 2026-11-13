import { LocaleSwitcher } from './locale-switcher';
import { LogoutButton } from './logout-button';
import { MobileNav } from './mobile-nav';
import { StoreSwitcher } from './store-switcher';
import { ThemeToggle } from './theme-toggle';

export function TopBar() {
  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6 print:hidden">
      <MobileNav />
      <StoreSwitcher />
      <div className="ms-auto flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
