import next from '@trackecom/config/eslint/next';

/**
 * RTL guard: physical spacing and position classes break the Arabic layout.
 * Use logical ones instead: ms-/me-, ps-/pe-, start-/end-, border-s/-e, text-start/-end.
 */
const PHYSICAL_CLASS = String.raw`/(^|\s)(?:[a-z-]+:)*-?(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|text-left|text-right)(?:-|\s|$)/`;
const message = 'Use logical Tailwind classes (ms-, me-, ps-, pe-, start-, end-) so RTL works.';

export default [
  ...next,
  { ignores: ['next-env.d.ts'] },
  {
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXAttribute[name.name='className'] Literal[value=${PHYSICAL_CLASS}]`,
          message,
        },
        {
          selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=${PHYSICAL_CLASS}]`,
          message,
        },
      ],
    },
  },
];
