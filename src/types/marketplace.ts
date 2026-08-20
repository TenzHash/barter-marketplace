export type ListingMode = 'cash_only' | 'barter_only' | 'cash_or_barter';
export type ItemCondition = 'brand_new' | 'like_new' | 'used_good' | 'used_fair' | 'for_parts';
export type ListingStatus = 'active' | 'pending_trade' | 'sold' | 'traded' | 'archived';
export type OfferType = 'cash' | 'barter' | 'hybrid';
export type OfferStatus = 'pending' | 'countered' | 'accepted' | 'declined' | 'cancelled';
export type TradeStatus = 'in_progress' | 'completed' | 'disputed' | 'cancelled';
export type MeetupStatus = 'unsettled' | 'proposed' | 'agreed';

// Ensure these fields exist in src/types/marketplace.ts
export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  location_city?: string;
  university?: string;
  student_id_verified?: boolean;
  rating_avg: number;
  trades_completed: number;
  bio?: string;
  default_campus_meetup?: string;
  created_at: string;
  updated_at: string;
}

export interface TradeReview {
  id: string;
  trade_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  tags: string[];
  comment?: string;
  created_at: string;
  reviewer?: Profile;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  condition: ItemCondition;
  mode: ListingMode;
  cash_price?: number | null;
  estimated_value: number;
  looking_for?: string | null;
  images: string[];
  is_inventory_only: boolean;
  status: ListingStatus;
  campus_location?: string | null;
  course_code?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface OfferProposalPayload {
  listing_id: string;
  proposer_id: string;
  recipient_id: string;
  type: OfferType;
  cash_amount: number;
  offered_item_ids: string[];
  message?: string;
}

export interface OfferItem {
  id: string;
  offer_id: string;
  listing_id: string;
  listing?: Listing;
}

export interface Offer {
  id: string;
  listing_id: string;
  proposer_id: string;
  recipient_id: string;
  type: OfferType;
  cash_amount: number;
  message?: string;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
  proposer?: Profile;
  recipient?: Profile;
  target_listing?: Listing;
  offer_items?: OfferItem[];
}

export interface Trade {
  id: string;
  offer_id: string;
  buyer_id: string;
  seller_id: string;
  status: TradeStatus;
  buyer_confirmed_at?: string | null;
  seller_confirmed_at?: string | null;
  meetup_location?: string | null;
  meetup_time?: string | null;
  meetup_proposed_by?: string | null;
  meetup_status?: MeetupStatus;
  created_at: string;
  updated_at: string;
}

export interface DetailedTrade extends Trade {
  buyer?: Profile;
  seller?: Profile;
  offer?: Offer;
}

export interface TradeMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}