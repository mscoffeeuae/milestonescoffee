export type Locale = 'en' | 'ar';
export type Dir = 'ltr' | 'rtl';

export const LOCALES: readonly Locale[] = ['en', 'ar'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

export function getDir(locale: Locale): Dir {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getLang(locale: Locale): string {
  return locale === 'ar' ? 'ar' : 'en';
}

/** Translation dictionary shape — both locales must have all keys */
export interface TranslationDict {
  nav: {
    menu: string;
    branches: string;
    corporate: string;
    shop: string;
    account: string;
  };
  errors: {
    validation: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    conflict: string;
    internal: string;
    itemUnavailable: string;
    orderingDisabled: string;
    branchClosed: string;
    rateLimited: string;
  };
  actions: {
    addToCart: string;
    removeFromCart: string;
    checkout: string;
    placeOrder: string;
    cancel: string;
    confirm: string;
    close: string;
    back: string;
    submit: string;
    loading: string;
    retry: string;
  };
  order: {
    status: {
      PENDING_PAYMENT: string;
      CONFIRMED: string;
      ACCEPTED: string;
      PREPARING: string;
      READY: string;
      COMPLETED: string;
      CANCELLED: string;
      REFUNDED: string;
    };
  };
  currency: {
    aed: string;
    free: string;
  };
}
