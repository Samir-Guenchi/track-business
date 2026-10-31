import { describe, expect, it } from 'vitest';
import { renderAuthEmail } from './auth-email.templates.js';

describe('renderAuthEmail', () => {
  it('writes in Arabic and links to the Arabic page', () => {
    const email = renderAuthEmail(
      { kind: 'verify_email', to: 'a@example.dz', locale: 'ar', token: 'tok_123' },
      'https://app.trackecom.dz',
    );

    expect(email.subject).toBe('تأكيد بريدك الإلكتروني');
    expect(email.text).toContain('https://app.trackecom.dz/ar/verify-email?token=tok_123');
  });

  it('says how long a reset link lasts', () => {
    const email = renderAuthEmail(
      { kind: 'reset_password', to: 'a@example.dz', locale: 'fr', token: 't' },
      'http://localhost:3000',
    );

    expect(email.text).toContain('30 minutes');
  });
});
