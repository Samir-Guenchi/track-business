import trackecomPreset from '@trackecom/ui/tailwind.preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [trackecomPreset],
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './config/**/*.ts'],
};
