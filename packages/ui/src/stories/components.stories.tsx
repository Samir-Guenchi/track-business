import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComponentsShowcase } from './components-showcase.js';
import type { UiLocale } from '../domain/money-dzd.js';

const meta: Meta<typeof ComponentsShowcase> = {
  title: 'Design system/Components',
  component: ComponentsShowcase,
  parameters: { layout: 'fullscreen' },
  args: { locale: 'fr' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllComponents: Story = {
  render: (_args, context) => {
    const selectedLocale = context.globals.locale;
    const locale: UiLocale =
      selectedLocale === 'ar' || selectedLocale === 'en' ? selectedLocale : 'fr';
    return <ComponentsShowcase locale={locale} />;
  },
};
