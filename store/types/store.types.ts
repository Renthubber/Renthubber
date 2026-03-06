// ============================================================
// RENTHUBBER STORE - Types
// Path: store/types/store.types.ts
// ============================================================

export interface Store {
  id: string;
  application_id: string | null;
  user_id: string;
  business_name: string;
  vat_number: string;
  legal_representative: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  description: string | null;
  profile_photo_url: string | null;
  photos: string[];
  opening_hours: Record<string, { open: string; close: string } | null>;
  iban: string | null;
  bank_name: string | null;
  sdi_code: string | null;
  pec: string | null;
  custody_rate_small: number;
  custody_rate_medium: number;
  custody_rate_large: number;
  grace_period_hours: number;
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  subscription_status: 'welcome_pack' | 'active' | 'past_due' | 'cancelled' | 'pending' | 'inactive';
  completed_pickups: number;
  welcome_pack_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  commission_rate: number;
  average_rating: number;
  total_reviews: number;
  is_early_adopter: boolean;
  activated_at: string | null;
  subscription_current_period_end: string | null;
  created_at: string;
  updated_at: string;
  password_hash?: string;
  must_change_password?: boolean;
}

export interface StoreInventoryItem {
  id: string;
  store_id: string;
  item_code_id: string;
  listing_id: string;
  booking_id: string | null;
  hubber_id: string;
  renter_id: string | null;
  status: 'in_custody' | 'rented_out' | 'returned' | 'grace_period' | 'paid_custody' | 'completed' | 'voluntarily_stored';
  custody_size: 'small' | 'medium' | 'large' | null;
  checkin_photos: string[];
  checkout_photos: string[];
  return_photos: string[];
  custody_started_at: string | null;
  custody_daily_rate: number | null;
  custody_total_charged: number;
  is_voluntary_custody: boolean;
  grace_period_ends_at: string | null;
  deposited_at: string | null;
  renter_pickup_at: string | null;
  renter_return_at: string | null;
  hubber_pickup_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  item_code?: string;
  listing_title?: string;
  listing_images?: string[];
  listing_short_code?: string;
  hubber_name?: string;
  hubber_phone?: string | null;
  renter_name?: string;
}

export interface StoreOperation {
  id: string;
  store_id: string;
  inventory_id: string;
  operator_id: string;
  operation_type: 'checkin_deposit' | 'checkout_renter' | 'checkin_return' | 'checkout_hubber';
  subject_user_id: string;
  verified_code: string | null;
  photos: string[];
  notes: string | null;
  created_at: string;
}

export interface StoreTransaction {
  id: string;
  store_id: string;
  transaction_type: 'activation_fee' | 'subscription' | 'booking_commission' | 'custody_fee' | 'payout' | 'refund' | 'credit_note';
  amount: number;
  vat_amount: number;
  net_amount: number;
  booking_id: string | null;
  inventory_id: string | null;
  stripe_payment_id: string | null;
  stripe_invoice_id: string | null;
  store_share: number | null;
  platform_share: number | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  period_start: string | null;
  period_end: string | null;
  description: string | null;
  created_at: string;
}

export interface StoreBalance {
  id: string;
  store_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_paid_out: number;
  last_payout_at: string | null;
  last_payout_amount: number | null;
  updated_at: string;
}

export interface StoreMessage {
  id: string;
  store_id: string;
  user_id: string;
  inventory_id: string | null;
  booking_id: string | null;
  sender_type: 'store' | 'user';
  sender_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface StoreReview {
  id: string;
  store_id: string;
  reviewer_id: string;
  booking_id: string | null;
  inventory_id: string | null;
  reviewer_role: 'hubber' | 'renter';
  rating: number;
  comment: string | null;
  store_reply: string | null;
  store_replied_at: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  reviewer_name?: string;
}

export interface StoreReport {
  id: string;
  store_id: string;
  inventory_id: string;
  booking_id: string | null;
  reported_by: string;
  report_type: 'damage' | 'missing_parts' | 'wrong_item' | 'condition_mismatch' | 'other';
  description: string;
  photos: string[];
  dispute_id: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface StoreItemCode {
  id: string;
  listing_id: string;
  hubber_id: string;
  store_id: string;
  code: string;
  code_type: string;
  is_active: boolean;
  created_at: string;
}

export interface StorePickupReceipt {
  id: string;
  booking_id: string;
  renter_id: string;
  store_id: string;
  inventory_id: string | null;
  receipt_code: string;
  is_used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}
