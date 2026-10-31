/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kraft: 'var(--trackecom-kraft)',
        'kraft-shadow': 'var(--trackecom-kraft-shadow)',
        tape: 'var(--trackecom-tape-green)',
        'tape-dark': 'var(--trackecom-tape-green-dark)',
        stamp: 'var(--trackecom-stamp-red)',
        ink: 'var(--trackecom-ink)',
        paper: 'var(--trackecom-paper)',
        canvas: 'var(--trackecom-canvas)',
        surface: 'var(--trackecom-surface)',
        border: 'var(--trackecom-border)',
        muted: 'var(--trackecom-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans Arabic', 'ui-sans-serif', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Noto Kufi Arabic', 'sans-serif'],
      },
      borderRadius: {
        control: 'var(--trackecom-radius-control)',
        panel: 'var(--trackecom-radius-panel)',
      },
      boxShadow: {
        panel: '0 1px 2px rgb(28 26 23 / 0.08), 0 8px 24px rgb(28 26 23 / 0.06)',
      },
    },
  },
};
