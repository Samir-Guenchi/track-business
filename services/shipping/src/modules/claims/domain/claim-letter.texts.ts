import type { ClaimReason } from '@trackecom/contracts';

interface Facts {
  readonly tracking: string;
  readonly reference: string;
  readonly carrier: string;
  readonly date: string;
  readonly value: string;
}

interface LetterTexts {
  readonly subject: (facts: Facts, reason: string) => string;
  readonly greeting: string;
  readonly intro: (facts: Facts) => string;
  readonly reasonLabel: string;
  readonly reasons: Readonly<Record<ClaimReason, string>>;
  readonly value: (facts: Facts) => string;
  readonly timeline: string;
  readonly noEvents: string;
  readonly noteLabel: string;
  readonly ask: string;
  readonly closing: string;
}

const fr: LetterTexts = {
  subject: (f, reason) => `Réclamation colis ${f.tracking} : ${reason}`,
  greeting: 'Madame, Monsieur,',
  intro: (f) =>
    `Nous vous adressons une réclamation pour le colis ${f.tracking} (notre référence ${f.reference}), confié à ${f.carrier} le ${f.date}.`,
  reasonLabel: 'Motif :',
  reasons: {
    stuck: 'aucune mise à jour du suivi depuis plusieurs jours, le colis semble bloqué.',
    return_missing: 'le colis est indiqué comme retourné, mais nous ne l’avons jamais reçu.',
    damaged: 'le colis nous a été retourné endommagé ou incomplet.',
    lost: 'le colis a été déclaré perdu.',
  },
  value: (f) => `Valeur déclarée de la marchandise : ${f.value} DA.`,
  timeline: 'Historique du suivi :',
  noEvents: '- aucun événement de suivi reçu',
  noteLabel: 'Précisions :',
  ask: 'Nous vous demandons de retrouver ce colis ou, à défaut, de nous rembourser la valeur déclarée dans les meilleurs délais.',
  closing: 'Cordialement.',
};

const ar: LetterTexts = {
  subject: (f, reason) => `شكوى بخصوص الطرد ${f.tracking}: ${reason}`,
  greeting: 'السيدة، السيد،',
  intro: (f) =>
    `نتقدم إليكم بشكوى بخصوص الطرد ${f.tracking} (مرجعنا ${f.reference})، المسلَّم إلى ${f.carrier} بتاريخ ${f.date}.`,
  reasonLabel: 'السبب:',
  reasons: {
    stuck: 'لا يوجد أي تحديث في التتبع منذ عدة أيام، ويبدو أن الطرد متوقف.',
    return_missing: 'الطرد مسجل كمُرجَع، لكنه لم يصلنا أبدًا.',
    damaged: 'أُرجع إلينا الطرد تالفًا أو ناقصًا.',
    lost: 'تم التصريح بضياع الطرد.',
  },
  value: (f) => `القيمة المصرح بها للبضاعة: ${f.value} دج.`,
  timeline: 'سجل التتبع:',
  noEvents: '- لم يصل أي حدث تتبع',
  noteLabel: 'تفاصيل:',
  ask: 'نطلب منكم العثور على هذا الطرد أو، إن تعذر ذلك، تعويضنا بالقيمة المصرح بها في أقرب الآجال.',
  closing: 'مع خالص التحيات.',
};

export const LETTER_TEXTS: Readonly<Record<'fr' | 'ar', LetterTexts>> = { fr, ar };
