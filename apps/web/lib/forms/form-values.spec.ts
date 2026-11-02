// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { formValues } from './form-values';

function formWith(fields: Record<string, string>): HTMLFormElement {
  const form = document.createElement('form');
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.name = name;
    input.value = value;
    form.append(input);
  }
  return form;
}

describe('formValues', () => {
  it('trims text but keeps passwords exactly as typed', () => {
    expect(formValues(formWith({ email: ' a@b.dz ', password: ' secret ' }))).toEqual({
      email: 'a@b.dz',
      password: ' secret ',
    });
  });

  it('leaves out empty optional fields', () => {
    expect(formValues(formWith({ name: 'Amina', phone: '  ' }))).toEqual({ name: 'Amina' });
  });
});
