import type { TranslationDict } from '../types';

/**
 * Arabic UI translations.
 * [PLACEHOLDER] — All Arabic strings require native speaker review and Marketing approval
 * before production use. These are placeholder translations for development scaffolding only.
 */
export const ar: TranslationDict = {
  nav: {
    menu: 'القائمة', // [PLACEHOLDER]
    branches: 'فروعنا', // [PLACEHOLDER]
    corporate: 'الشركات', // [PLACEHOLDER]
    shop: 'المتجر', // [PLACEHOLDER]
    account: 'حسابي', // [PLACEHOLDER]
  },
  errors: {
    validation: 'يرجى مراجعة المدخلات والمحاولة مرة أخرى.', // [PLACEHOLDER]
    unauthorized: 'يرجى تسجيل الدخول للمتابعة.', // [PLACEHOLDER]
    forbidden: 'ليس لديك إذن لتنفيذ هذا الإجراء.', // [PLACEHOLDER]
    notFound: 'لم يتم العثور على العنصر المطلوب.', // [PLACEHOLDER]
    conflict: 'يتعارض هذا الإجراء مع الحالة الحالية.', // [PLACEHOLDER]
    internal: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.', // [PLACEHOLDER]
    itemUnavailable: 'هذا العنصر غير متاح حالياً.', // [PLACEHOLDER]
    orderingDisabled: 'الطلب عبر الإنترنت غير متاح في هذا الفرع الآن.', // [PLACEHOLDER]
    branchClosed: 'هذا الفرع مغلق حالياً.', // [PLACEHOLDER]
    rateLimited: 'طلبات كثيرة جداً. يرجى الانتظار لحظة والمحاولة مرة أخرى.', // [PLACEHOLDER]
  },
  actions: {
    addToCart: 'أضف إلى السلة', // [PLACEHOLDER]
    removeFromCart: 'إزالة', // [PLACEHOLDER]
    checkout: 'الدفع', // [PLACEHOLDER]
    placeOrder: 'تأكيد الطلب', // [PLACEHOLDER]
    cancel: 'إلغاء', // [PLACEHOLDER]
    confirm: 'تأكيد', // [PLACEHOLDER]
    close: 'إغلاق', // [PLACEHOLDER]
    back: 'رجوع', // [PLACEHOLDER]
    submit: 'إرسال', // [PLACEHOLDER]
    loading: 'جارٍ التحميل…', // [PLACEHOLDER]
    retry: 'حاول مرة أخرى', // [PLACEHOLDER]
  },
  order: {
    status: {
      PENDING_PAYMENT: 'في انتظار الدفع', // [PLACEHOLDER]
      CONFIRMED: 'تم تأكيد الطلب', // [PLACEHOLDER]
      ACCEPTED: 'تم قبوله من الفرع', // [PLACEHOLDER]
      PREPARING: 'قيد التحضير', // [PLACEHOLDER]
      READY: 'جاهز للاستلام', // [PLACEHOLDER]
      COMPLETED: 'مكتمل', // [PLACEHOLDER]
      CANCELLED: 'ملغى', // [PLACEHOLDER]
      REFUNDED: 'تم الاسترداد', // [PLACEHOLDER]
    },
  },
  currency: {
    aed: 'د.إ', // [PLACEHOLDER]
    free: 'مجاناً', // [PLACEHOLDER]
  },
};
