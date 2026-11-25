/**
 * Coffee bean catalogue for /[locale]/coffeebeans.
 *
 * ⚠ [PLACEHOLDER] DATA — every bean below is sample content. Origins, regions, altitudes,
 * processes, roast levels, tasting notes, flavour scores and brew guides are NOT supplied
 * by Operations/Roasting yet and must be replaced before launch. The page labels them
 * "[PLACEHOLDER]" while `placeholder` is true. Do not invent real supplier claims here.
 *
 * Kept as a typed file so it can move to Sanity later: the shape maps 1:1 onto a `bean` document.
 */

export type Lang = 'en' | 'ar';
export interface L10n { en: string; ar: string }

export type RoastLevel = 1 | 2 | 3 | 4 | 5;

export const ROAST_LABELS: Record<RoastLevel, L10n> = {
  1: { en: 'Light', ar: 'خفيف' },
  2: { en: 'Medium-light', ar: 'متوسط إلى خفيف' },
  3: { en: 'Medium', ar: 'متوسط' },
  4: { en: 'Medium-dark', ar: 'متوسط إلى غامق' },
  5: { en: 'Dark', ar: 'غامق' },
};

/** Flavour wheel axes, in drawing order (clockwise from the top). Scores are 0–5. */
export const FLAVOUR_AXES = ['sweetness', 'acidity', 'body', 'fruity', 'nutty', 'floral'] as const;
export type FlavourAxis = (typeof FLAVOUR_AXES)[number];
export type FlavourProfile = Record<FlavourAxis, number>;

export const FLAVOUR_LABELS: Record<FlavourAxis, L10n> = {
  sweetness: { en: 'Sweetness', ar: 'الحلاوة' },
  acidity: { en: 'Acidity', ar: 'الحموضة' },
  body: { en: 'Body', ar: 'القوام' },
  fruity: { en: 'Fruity', ar: 'فاكهي' },
  nutty: { en: 'Nutty & cocoa', ar: 'مكسرات وكاكاو' },
  floral: { en: 'Floral', ar: 'زهري' },
};

export type OriginKey = 'ethiopia' | 'colombia' | 'brazil' | 'yemen' | 'kenya' | 'guatemala';

export const ORIGINS: Record<OriginKey, L10n> = {
  ethiopia: { en: 'Ethiopia', ar: 'إثيوبيا' },
  colombia: { en: 'Colombia', ar: 'كولومبيا' },
  brazil: { en: 'Brazil', ar: 'البرازيل' },
  yemen: { en: 'Yemen', ar: 'اليمن' },
  kenya: { en: 'Kenya', ar: 'كينيا' },
  guatemala: { en: 'Guatemala', ar: 'غواتيمالا' },
};

export interface BrewGuide {
  method: L10n;
  grind: L10n;
  /** Water note: ratio and temperature. */
  water: L10n;
}

export interface Bean {
  id: string;
  name: L10n;
  originKeys: OriginKey[];
  /** Display text for the origin line (e.g. blends list two countries). */
  origin: L10n;
  region: L10n;
  /** Metres above sea level; null when unknown or a blend. */
  altitudeM: { min: number; max: number } | null;
  process: L10n;
  roast: RoastLevel;
  notes: L10n[];
  description: L10n;
  brew: BrewGuide;
  profile: FlavourProfile;
  /** True while origin/flavour text has not been supplied by the business. */
  placeholder: boolean;
}

export const BEANS: Bean[] = [
  {
    id: 'signature-blend',
    name: { en: 'Signature Blend', ar: 'الخلطة المميزة' },
    originKeys: ['ethiopia', 'colombia'],
    origin: { en: 'Ethiopia & Colombia', ar: 'إثيوبيا وكولومبيا' },
    region: { en: 'Multiple regions', ar: 'مناطق متعددة' },
    altitudeM: null,
    process: { en: 'Washed', ar: 'مغسولة' },
    roast: 3,
    notes: [
      { en: 'Chocolate', ar: 'شوكولاتة' },
      { en: 'Caramel', ar: 'كراميل' },
      { en: 'Citrus', ar: 'حمضيات' },
    ],
    description: {
      en: 'A balanced everyday blend with a sweet, rounded cup and a bright finish.',
      ar: 'خلطة متوازنة للاستمتاع اليومي بكوب حلو ومتوازن ونهاية منعشة.',
    },
    brew: {
      method: { en: 'Espresso or filter', ar: 'إسبريسو أو فلتر' },
      grind: { en: 'Fine for espresso; medium for filter', ar: 'ناعم للإسبريسو؛ متوسط للفلتر' },
      water: { en: 'Ratio 1:2 (espresso) or 1:16 (filter), 93 °C', ar: 'النسبة 1:2 (إسبريسو) أو 1:16 (فلتر)، 93 °م' },
    },
    profile: { sweetness: 4, acidity: 3, body: 3, fruity: 2, nutty: 4, floral: 1 },
    placeholder: true,
  },
  {
    id: 'dark-roast',
    name: { en: 'Dark Roast', ar: 'التحميص الغامق' },
    originKeys: ['brazil'],
    origin: { en: 'Brazil', ar: 'البرازيل' },
    region: { en: 'Cerrado', ar: 'سيرادو' },
    altitudeM: { min: 1000, max: 1200 },
    process: { en: 'Natural', ar: 'طبيعية' },
    roast: 5,
    notes: [
      { en: 'Bold', ar: 'قوي' },
      { en: 'Smoky', ar: 'دخاني' },
      { en: 'Nutty', ar: 'مكسرات' },
    ],
    description: {
      en: 'A deep, low-acidity roast with a heavy body, made for milk drinks and moka pots.',
      ar: 'تحميص عميق منخفض الحموضة وقوام ثقيل، مناسب للمشروبات بالحليب وإبريق الموكا.',
    },
    brew: {
      method: { en: 'Moka pot or espresso', ar: 'إبريق موكا أو إسبريسو' },
      grind: { en: 'Fine to medium-fine', ar: 'ناعم إلى متوسط الدقة' },
      water: { en: 'Ratio 1:2 (espresso) or 1:12 (moka), 90 °C', ar: 'النسبة 1:2 (إسبريسو) أو 1:12 (موكا)، 90 °م' },
    },
    profile: { sweetness: 2, acidity: 1, body: 5, fruity: 0, nutty: 5, floral: 0 },
    placeholder: true,
  },
  {
    id: 'single-origin-yemen',
    name: { en: 'Single Origin', ar: 'المصدر الواحد' },
    originKeys: ['yemen'],
    origin: { en: 'Yemen', ar: 'اليمن' },
    region: { en: 'Haraz', ar: 'حراز' },
    altitudeM: { min: 1800, max: 2200 },
    process: { en: 'Natural', ar: 'طبيعية' },
    roast: 1,
    notes: [
      { en: 'Floral', ar: 'زهري' },
      { en: 'Fruity', ar: 'فاكهي' },
      { en: 'Honey', ar: 'عسل' },
    ],
    description: {
      en: 'A delicate, aromatic light roast that shows off fruit and floral character.',
      ar: 'تحميص خفيف عطري ولطيف يُبرز النكهات الفاكهية والزهرية.',
    },
    brew: {
      method: { en: 'Pour-over (V60)', ar: 'تقطير يدوي (V60)' },
      grind: { en: 'Medium-fine', ar: 'متوسط الدقة' },
      water: { en: 'Ratio 1:16, 94 °C', ar: 'النسبة 1:16، 94 °م' },
    },
    profile: { sweetness: 4, acidity: 4, body: 2, fruity: 5, nutty: 1, floral: 5 },
    placeholder: true,
  },
  {
    id: 'kenya-aa',
    name: { en: 'Kenya AA', ar: 'كينيا AA' },
    originKeys: ['kenya'],
    origin: { en: 'Kenya', ar: 'كينيا' },
    region: { en: 'Nyeri', ar: 'نييري' },
    altitudeM: { min: 1700, max: 1900 },
    process: { en: 'Washed', ar: 'مغسولة' },
    roast: 2,
    notes: [
      { en: 'Blackcurrant', ar: 'كشمش أسود' },
      { en: 'Grapefruit', ar: 'جريب فروت' },
      { en: 'Brown sugar', ar: 'سكر بني' },
    ],
    description: {
      en: 'A vibrant, juicy cup with sparkling acidity and a clean, sweet finish.',
      ar: 'كوب حيوي وعصيري بحموضة منعشة ونهاية نظيفة وحلوة.',
    },
    brew: {
      method: { en: 'Pour-over or AeroPress', ar: 'تقطير يدوي أو إيروبرس' },
      grind: { en: 'Medium', ar: 'متوسط' },
      water: { en: 'Ratio 1:15, 95 °C', ar: 'النسبة 1:15، 95 °م' },
    },
    profile: { sweetness: 3, acidity: 5, body: 3, fruity: 5, nutty: 1, floral: 3 },
    placeholder: true,
  },
  {
    id: 'guatemala-huehuetenango',
    name: { en: 'Guatemala Huehuetenango', ar: 'غواتيمالا ويهويتينانغو' },
    originKeys: ['guatemala'],
    origin: { en: 'Guatemala', ar: 'غواتيمالا' },
    region: { en: 'Huehuetenango', ar: 'ويهويتينانغو' },
    altitudeM: { min: 1500, max: 1900 },
    process: { en: 'Washed', ar: 'مغسولة' },
    roast: 4,
    notes: [
      { en: 'Cocoa', ar: 'كاكاو' },
      { en: 'Toffee', ar: 'توفي' },
      { en: 'Almond', ar: 'لوز' },
    ],
    description: {
      en: 'A smooth, full-bodied cup with deep cocoa sweetness and a gentle acidity.',
      ar: 'كوب ناعم وقوي القوام بحلاوة كاكاو عميقة وحموضة هادئة.',
    },
    brew: {
      method: { en: 'French press or espresso', ar: 'فرنش برس أو إسبريسو' },
      grind: { en: 'Coarse for French press; fine for espresso', ar: 'خشن للفرنش برس؛ ناعم للإسبريسو' },
      water: { en: 'Ratio 1:15 (press) or 1:2 (espresso), 92 °C', ar: 'النسبة 1:15 (برس) أو 1:2 (إسبريسو)، 92 °م' },
    },
    profile: { sweetness: 4, acidity: 2, body: 4, fruity: 1, nutty: 5, floral: 1 },
    placeholder: true,
  },
  {
    id: 'colombia-huila',
    name: { en: 'Colombia Huila', ar: 'كولومبيا هويلا' },
    originKeys: ['colombia'],
    origin: { en: 'Colombia', ar: 'كولومبيا' },
    region: { en: 'Huila', ar: 'هويلا' },
    altitudeM: { min: 1600, max: 1900 },
    process: { en: 'Washed', ar: 'مغسولة' },
    roast: 3,
    notes: [
      { en: 'Red apple', ar: 'تفاح أحمر' },
      { en: 'Caramel', ar: 'كراميل' },
      { en: 'Hazelnut', ar: 'بندق' },
    ],
    description: {
      en: 'A sweet, easy-drinking cup with soft fruit and a smooth nutty finish.',
      ar: 'كوب حلو وسهل الشرب بفاكهة ناعمة ونهاية سلسة بنكهة المكسرات.',
    },
    brew: {
      method: { en: 'Drip or pour-over', ar: 'قهوة مفلترة أو تقطير يدوي' },
      grind: { en: 'Medium', ar: 'متوسط' },
      water: { en: 'Ratio 1:16, 93 °C', ar: 'النسبة 1:16، 93 °م' },
    },
    profile: { sweetness: 4, acidity: 3, body: 3, fruity: 3, nutty: 3, floral: 2 },
    placeholder: true,
  },
];
