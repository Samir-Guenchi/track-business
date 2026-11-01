import { TEMPLATE_VARIABLES } from '@trackecom/contracts';

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateValues = Readonly<Record<TemplateVariable, string>>;

/** Fills `{placeholder}`s; unknown ones were refused when the template was saved. */
export function renderTemplate(body: string, values: TemplateValues): string {
  return body
    .replace(/\{([a-z_]+)\}/g, (match, name: string) =>
      name in values ? values[name as TemplateVariable] : match,
    )
    .replace(/^\s*:\s*/, '')
    .trim();
}
