import type { TranslationDict } from '../types.ts';

/**
 * English UI translations.
 * [PLACEHOLDER] strings require Marketing approval before production use.
 */
export const en: TranslationDict = {
  nav: {
    menu: 'Menu',
    branches: 'Our Branches',
    corporate: 'Corporate',
    shop: 'Shop',
    account: 'My Account',
  },
  errors: {
    validation: 'Please check your input and try again.',
    unauthorized: 'Please sign in to continue.',
    forbidden: 'You do not have permission to perform this action.',
    notFound: 'The requested item could not be found.',
    conflict: 'This action conflicts with the current state.',
    internal: 'Something went wrong. Please try again.',
    itemUnavailable: 'This item is currently unavailable.',
    orderingDisabled: 'Online ordering is not available at this branch right now.',
    branchClosed: 'This branch is currently closed.',
    rateLimited: 'Too many requests. Please wait a moment and try again.',
  },
  actions: {
    addToCart: 'Add to Cart',
    removeFromCart: 'Remove',
    checkout: 'Checkout',
    placeOrder: 'Place Order',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    submit: 'Submit',
    loading: 'Loading…',
    retry: 'Try Again',
  },
  order: {
    status: {
      PENDING_PAYMENT: 'Awaiting Payment',
      CONFIRMED: 'Order Confirmed',
      ACCEPTED: 'Accepted by Branch',
      PREPARING: 'Being Prepared',
      READY: 'Ready for Pickup',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded',
    },
  },
  currency: {
    aed: 'AED',
    free: 'Free',
  },
};
