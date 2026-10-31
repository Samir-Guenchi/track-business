import type { Locale } from '@trackecom/contracts';
import type { AuthEmail } from '../../application/ports/auth.ports.js';

interface Template {
  readonly subject: string;
  readonly intro: string;
  readonly action: string;
  readonly outro: string;
}

type Kind = AuthEmail['kind'];

const TEMPLATES: Record<Kind, Record<Locale, Template>> = {
  verify_email: {
    ar: {
      subject: 'تأكيد بريدك الإلكتروني',
      intro: 'مرحبا بك في TrackEcom.',
      action: 'أكّد بريدك الإلكتروني عبر هذا الرابط:',
      outro: 'إذا لم تنشئ حسابا، تجاهل هذه الرسالة.',
    },
    fr: {
      subject: 'Confirmez votre adresse e-mail',
      intro: 'Bienvenue sur TrackEcom.',
      action: 'Confirmez votre adresse avec ce lien :',
      outro: "Si vous n'avez pas créé de compte, ignorez ce message.",
    },
    en: {
      subject: 'Confirm your email address',
      intro: 'Welcome to TrackEcom.',
      action: 'Confirm your address with this link:',
      outro: 'If you did not create an account, ignore this email.',
    },
  },
  store_invitation: {
    ar: {
      subject: 'دعوة للانضمام إلى متجر على TrackEcom',
      intro: 'تمت دعوتك للانضمام إلى فريق متجر.',
      action: 'اقبل الدعوة عبر هذا الرابط (صالح 7 أيام):',
      outro: 'إذا لم تكن تتوقع هذه الدعوة، تجاهل هذه الرسالة.',
    },
    fr: {
      subject: 'Invitation à rejoindre une boutique sur TrackEcom',
      intro: "Vous êtes invité à rejoindre l'équipe d'une boutique.",
      action: 'Acceptez avec ce lien (valable 7 jours) :',
      outro: 'Si vous ne vous y attendiez pas, ignorez ce message.',
    },
    en: {
      subject: 'Invitation to join a store on TrackEcom',
      intro: "You have been invited to join a store's team.",
      action: 'Accept with this link (valid 7 days):',
      outro: 'If you did not expect this, ignore this email.',
    },
  },
  reset_password: {
    ar: {
      subject: 'إعادة تعيين كلمة المرور',
      intro: 'طلبت إعادة تعيين كلمة المرور.',
      action: 'الرابط صالح لمدة 30 دقيقة:',
      outro: 'إذا لم تطلب ذلك، تجاهل هذه الرسالة.',
    },
    fr: {
      subject: 'Réinitialisation du mot de passe',
      intro: 'Vous avez demandé un nouveau mot de passe.',
      action: 'Ce lien est valable 30 minutes :',
      outro: "Si ce n'était pas vous, ignorez ce message.",
    },
    en: {
      subject: 'Reset your password',
      intro: 'You asked to reset your password.',
      action: 'This link is valid for 30 minutes:',
      outro: 'If this was not you, ignore this email.',
    },
  },
};

const PATHS: Record<Kind, string> = {
  verify_email: 'verify-email',
  reset_password: 'reset-password',
  store_invitation: 'invite',
};

export interface RenderedEmail {
  readonly subject: string;
  readonly text: string;
}

/** Plain-text emails in the user's language; the link goes to the web app, which calls the API. */
export function renderAuthEmail(email: AuthEmail, appUrl: string): RenderedEmail {
  const template = TEMPLATES[email.kind][email.locale];
  const link = new URL(`/${email.locale}/${PATHS[email.kind]}`, appUrl);
  link.searchParams.set('token', email.token);
  return {
    subject: template.subject,
    text: [template.intro, '', template.action, link.toString(), '', template.outro].join('\n'),
  };
}
