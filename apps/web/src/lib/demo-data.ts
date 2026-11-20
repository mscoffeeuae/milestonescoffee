/**
 * DEV-ONLY demo content so the menu/locations UI can be previewed while the CMS is empty.
 * Never used in production builds (guarded by NODE_ENV in the pages). Not real data.
 */
import type { MenuCategory } from '@/components/menu/menu-browser';

export const IS_DEV_PREVIEW = process.env.NODE_ENV === 'development';

const p = (
  id: string, en: string, ar: string, price: number,
  extra: Partial<MenuCategory['products'][number]> = {},
): MenuCategory['products'][number] => ({
  _id: id, nameEn: en, nameAr: ar, slug: id,
  descriptionEn: 'Demo description — replace with CMS content.',
  descriptionAr: 'وصف تجريبي — يُستبدل بمحتوى النظام.',
  displayPriceAed: price, allergens: null, dietaryFlags: null,
  isNew: false, isFeatured: false, productImage: null, ...extra,
});

export const DEMO_MENU: MenuCategory[] = [
  {
    _id: 'demo-hot', nameEn: 'Demo: Hot Coffee', nameAr: 'تجريبي: قهوة ساخنة', slug: 'demo-hot',
    descriptionEn: 'Sample category for UI preview.', descriptionAr: 'قسم تجريبي للمعاينة.',
    products: [
      p('d1', 'Sample Espresso', 'إسبريسو تجريبي', 10, { isFeatured: true, dietaryFlags: ['vegan'] }),
      p('d2', 'Sample Latte', 'لاتيه تجريبي', 18, { allergens: ['dairy'], dietaryFlags: ['vegetarian'] }),
      p('d3', 'Sample Spanish Latte', 'سبانش لاتيه تجريبي', 20, { isNew: true, allergens: ['dairy'] }),
    ],
  },
  {
    _id: 'demo-cold', nameEn: 'Demo: Cold Drinks', nameAr: 'تجريبي: مشروبات باردة', slug: 'demo-cold',
    descriptionEn: null, descriptionAr: null,
    products: [
      p('d4', 'Sample Iced Americano', 'أمريكانو مثلج تجريبي', 16, { isFeatured: true, dietaryFlags: ['vegan', 'sugar-free'] }),
      p('d5', 'Sample Cold Brew', 'كولد برو تجريبي', 19, { isNew: true, dietaryFlags: ['vegan'] }),
    ],
  },
  {
    _id: 'demo-bakery', nameEn: 'Demo: Bakery', nameAr: 'تجريبي: مخبوزات', slug: 'demo-bakery',
    descriptionEn: null, descriptionAr: null,
    products: [
      p('d6', 'Sample Croissant', 'كرواسون تجريبي', 12, { allergens: ['gluten', 'dairy', 'eggs'] }),
      p('d7', 'Sample Date Cake', 'كعكة تمر تجريبية', 15, { isFeatured: true, allergens: ['gluten', 'tree-nuts'] }),
    ],
  },
];

const hours = (open: string, close: string, fridayClosed = false) =>
  Object.fromEntries(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].flatMap((d) => [
      [`${d}Open`, open], [`${d}Close`, close], [`${d}Closed`, fridayClosed && d === 'friday'],
    ]),
  );

const b = (id: string, emirate: string, n: number, h: Record<string, unknown>, services: string[]) => ({
  _id: id, nameEn: `Demo Branch ${n}`, nameAr: `فرع تجريبي ${n}`, slug: id, emirate,
  addressEn: 'Demo address — not a real location', addressAr: 'عنوان تجريبي — ليس موقعاً حقيقياً',
  googleMapsUrl: null, coordinates: null, openingHours: h,
  openingHoursNoteEn: 'Demo note: hours may vary.', openingHoursNoteAr: 'ملاحظة تجريبية: قد تختلف الساعات.',
  services, phone: null, heroImage: null,
});

export const DEMO_BRANCHES = [
  b('demo-1', 'abu-dhabi', 1, hours('07:00', '23:00'), ['dine-in', 'takeaway', 'wifi', 'parking']),
  b('demo-2', 'abu-dhabi', 2, hours('18:00', '02:00'), ['takeaway', 'drive-through']),
  b('demo-3', 'dubai', 3, hours('06:00', '13:00', true), ['dine-in', 'delivery', 'accessible', 'prayer-room']),
];
