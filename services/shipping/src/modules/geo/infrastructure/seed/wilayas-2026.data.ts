import type { WilayaRow } from './wilayas.data.js';

/**
 * Wilayas 59 to 69, created by law 26-06 (Journal Officiel n° 25, 5 April 2026) from former
 * delegated wilayas. Commune codes did not change: their communes only moved to the new wilaya.
 */
export const WILAYAS_2026_VERSION = '2026-04';

export const WILAYAS_2026: readonly WilayaRow[] = [
  [59, 'Aflou', 'آفلو'],
  [60, 'Barika', 'بريكة'],
  [61, 'El Kantara', 'القنطرة'],
  [62, 'Bir El Ater', 'بئر العاتر'],
  [63, 'El Aricha', 'العريشة'],
  [64, 'Ksar Chellala', 'قصر الشلالة'],
  [65, 'Aïn Ouessara', 'عين وسارة'],
  [66, 'Messaad', 'مسعد'],
  [67, 'Ksar El Boukhari', 'قصر البخاري'],
  [68, 'Bou Saâda', 'بوسعادة'],
  [69, 'El Abiodh Sidi Cheikh', 'الأبيض سيدي الشيخ'],
];
