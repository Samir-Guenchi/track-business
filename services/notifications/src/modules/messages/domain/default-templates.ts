import type { MessageLanguage, NotificationTrigger } from '@trackecom/contracts';

/**
 * Built-in texts, used until a store writes its own. Short on purpose: an Arabic SMS segment
 * holds 67 characters. Darija is written in Latin letters, as customers text.
 */
export const DEFAULT_TEMPLATES: Readonly<
  Record<NotificationTrigger, Readonly<Record<MessageLanguage, string>>>
> = {
  order_confirmed: {
    ar: '{store_name}: تم تأكيد طلبك {ref}. شكرا {name}!',
    fr: '{store_name} : votre commande {ref} est confirmée. Merci {name} !',
    darija: '{store_name}: la commande {ref} tconfirmat. Saha {name}!',
  },
  parcel_shipped: {
    ar: '{store_name}: طردك {ref} في الطريق مع {carrier}. التتبع: {tracking_link}',
    fr: '{store_name} : votre colis {ref} est expédié avec {carrier}. Suivi : {tracking_link}',
    darija: '{store_name}: le colis {ref} rah f triq m3a {carrier}. Suivi: {tracking_link}',
  },
  out_for_delivery: {
    ar: '{store_name}: طردك {ref} سيصلك اليوم. حضّر المبلغ من فضلك. {tracking_link}',
    fr: "{store_name} : votre colis {ref} arrive aujourd'hui. Préparez le montant. {tracking_link}",
    darija: '{store_name}: le colis {ref} jayek lyoum. Wejjed le montant. {tracking_link}',
  },
  failed_attempt: {
    ar: '{store_name}: لم يتمكن الموزع من تسليم طردك {ref}. تابع هنا: {tracking_link}',
    fr: "{store_name} : le livreur n'a pas pu livrer votre colis {ref}. Suivi : {tracking_link}",
    darija: '{store_name}: le livreur ma qderch ywasel le colis {ref}. Suivi: {tracking_link}',
  },
  parcel_delivered: {
    ar: '{store_name}: تم تسليم طردك {ref}. شكرا لثقتك {name}!',
    fr: '{store_name} : votre colis {ref} est livré. Merci pour votre confiance {name} !',
    darija: '{store_name}: le colis {ref} wsel. Saha {name}, merci!',
  },
  parcel_returned: {
    ar: '{store_name}: عاد طردك {ref} إلينا. اتصل بنا لإعادة إرساله.',
    fr: '{store_name} : votre colis {ref} nous est revenu. Contactez-nous pour le renvoyer.',
    darija: '{store_name}: le colis {ref} rje3 lina. Appelina bach n3awdou nb3thouh.',
  },
};
