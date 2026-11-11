/**
 * Customer domain types — shared contracts for profile, addresses, order history.
 *
 * Customer identity is managed by the external auth provider (D-004).
 * This module manages the customer record AFTER first authentication,
 * including profile data, addresses, consent, and order history.
 */

export interface CustomerProfileDto {
  id: string;
  name: string | null;
  email: string | null;
  phoneE164: string | null;
  locale: 'en' | 'ar';
  createdAt: string;
}

export interface UpdateProfileInput {
  name?: string | undefined;
  email?: string | undefined;
  locale?: 'en' | 'ar' | undefined;
}

export interface CustomerAddressDto {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  emirate: string;
  country: string;
  isDefault: boolean;
}

export interface CreateAddressInput {
  label?: string | undefined;
  line1: string;
  line2?: string | undefined;
  city: string;
  emirate: string;
  country?: string | undefined;
  isDefault?: boolean | undefined;
}

export interface UpdateAddressInput {
  label?: string | undefined;
  line1?: string | undefined;
  line2?: string | undefined;
  city?: string | undefined;
  emirate?: string | undefined;
  isDefault?: boolean | undefined;
}

export interface ConsentInput {
  consentType: string;
  granted: boolean;
  evidenceRef: string;
}
