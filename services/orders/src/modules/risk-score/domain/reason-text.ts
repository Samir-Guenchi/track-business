import type { RiskFlag, RiskReason } from '@trackecom/contracts';
import type { ScoredReason } from './return-risk.js';

type Text = RiskReason['text'];
type Params = ScoredReason['params'];

const FLAG_TEXT: Readonly<Record<RiskFlag, Text>> = {
  blacklisted: {
    ar: 'الزبون في القائمة السوداء',
    fr: 'Client sur liste noire',
    en: 'Customer is blacklisted',
  },
  suspicious_phone: {
    ar: 'رقم هاتف مشبوه',
    fr: 'Numéro de téléphone suspect',
    en: 'Suspicious phone number',
  },
  gibberish_name: { ar: 'اسم غير مفهوم', fr: 'Nom incohérent', en: 'Nonsense name' },
  impossible_address: {
    ar: 'البلدية لا تنتمي إلى الولاية',
    fr: "La commune n'est pas dans la wilaya",
    en: 'The commune is not in the wilaya',
  },
  order_burst: {
    ar: 'عدة طلبات من نفس الرقم في دقائق',
    fr: 'Plusieurs commandes du même numéro en quelques minutes',
    en: 'Several orders from this number within minutes',
  },
  network_refusals: {
    ar: 'رفض طرودا في متاجر أخرى',
    fr: "A refusé des colis dans d'autres boutiques",
    en: 'Refused parcels at other stores',
  },
};

const percent = (rate: number | string | undefined): string => `${Math.round(Number(rate) * 100)}%`;

const TEXT: Readonly<Record<ScoredReason['code'], (params: Params) => Text>> = {
  customer_returned_before: ({ count }) => ({
    ar: `هذا الرقم رفض ${count} طرد(ا) سابقا في متجرك`,
    fr: `Ce numéro a refusé ${count} colis chez vous`,
    en: `This number refused ${count} parcel(s) at your store`,
  }),
  customer_delivered_before: ({ count }) => ({
    ar: `هذا الزبون استلم ${count} طرد(ا) سابقا`,
    fr: `Ce client a déjà reçu ${count} colis`,
    en: `This customer already received ${count} parcel(s)`,
  }),
  network_refusals: () => FLAG_TEXT.network_refusals,
  wilaya_return_rate: ({ rate }) => ({
    ar: `${percent(rate)} من طرودك إلى هذه الولاية ترجع`,
    fr: `${percent(rate)} de vos colis vers cette wilaya reviennent`,
    en: `${percent(rate)} of your parcels to this wilaya come back`,
  }),
  high_value: ({ amount }) => ({
    ar: `مبلغ مرتفع للتحصيل: ${amount} دج`,
    fr: `Montant élevé à encaisser : ${amount} DA`,
    en: `High amount to collect: ${amount} DZD`,
  }),
  night_order: () => ({
    ar: 'طلب بين منتصف الليل والسادسة صباحا',
    fr: 'Commande passée entre minuit et 6 h',
    en: 'Ordered between midnight and 6 am',
  }),
  hard_to_reach: ({ count }) => ({
    ar: `${count} مكالمات بدون رد`,
    fr: `${count} appels sans réponse`,
    en: `${count} calls not answered`,
  }),
  fake_order_signal: ({ flag }) => FLAG_TEXT[flag as RiskFlag],
  possible_duplicate: () => ({
    ar: 'يشبه طلبا حديثا من نفس الرقم',
    fr: 'Ressemble à une commande récente du même numéro',
    en: 'Looks like a recent order from the same number',
  }),
};

/** The reason as the API returns it, with its sentence in Arabic, French and English. */
export const describeReason = (reason: ScoredReason): RiskReason => ({
  code: reason.code,
  points: reason.points,
  params: { ...reason.params },
  text: TEXT[reason.code](reason.params),
});
