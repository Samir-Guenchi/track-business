import type { Preview } from '@storybook/react-vite';
import '../src/styles.css';

const preview: Preview = {
  globalTypes: {
    locale: {
      description: 'Story language',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: [
          { value: 'ar', title: 'العربية' },
          { value: 'fr', title: 'Français' },
          { value: 'en', title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Text direction preview',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'auto', title: 'Use language direction' },
          { value: 'ltr', title: 'LTR' },
          { value: 'rtl', title: 'RTL' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: 'fr', direction: 'auto', theme: 'light' },
  decorators: [
    (Story, context) => {
      const locale = String(context.globals.locale ?? 'fr');
      const selectedDirection = String(context.globals.direction ?? 'auto');
      const direction =
        selectedDirection === 'auto' ? (locale === 'ar' ? 'rtl' : 'ltr') : selectedDirection;
      const theme = String(context.globals.theme ?? 'light');
      return (
        <div
          lang={locale}
          dir={direction}
          data-theme={theme}
          style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
