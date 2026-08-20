// src/services/offerService.ts
import { supabase } from '../lib/supabaseClient';
import type { OfferProposalPayload, Offer } from '../types/marketplace';

export interface AcceptOfferResponse {
  success: boolean;
  trade_id: string;
  target_listing_id: string;
}

export const offerService = {
  async submitOffer(payload: OfferProposalPayload): Promise<Offer> {
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .insert({
        listing_id: payload.listing_id,
        proposer_id: payload.proposer_id,
        recipient_id: payload.recipient_id,
        type: payload.type,
        cash_amount: payload.cash_amount,
        message: payload.message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (offerError) throw offerError;

    if (payload.offered_item_ids && payload.offered_item_ids.length > 0) {
      const offerItems = payload.offered_item_ids.map((itemId) => ({
        offer_id: offer.id,
        listing_id: itemId,
      }));

      const { error: itemsError } = await supabase
        .from('offer_items')
        .insert(offerItems);

      if (itemsError) throw itemsError;
    }

    return offer as unknown as Offer;
  },

  async getUserOffers(userId: string): Promise<{ received: Offer[]; sent: Offer[] }> {
    const { data: receivedData, error: receivedError } = await supabase
      .from('offers')
      .select(`
        *,
        proposer:proposer_id(*),
        target_listing:listing_id(*),
        offer_items(
          id,
          listing_id,
          listing:listing_id(*)
        )
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (receivedError) throw receivedError;

    const { data: sentData, error: sentError } = await supabase
      .from('offers')
      .select(`
        *,
        recipient:recipient_id(*),
        target_listing:listing_id(*),
        offer_items(
          id,
          listing_id,
          listing:listing_id(*)
        )
      `)
      .eq('proposer_id', userId)
      .order('created_at', { ascending: false });

    if (sentError) throw sentError;

    return {
      received: (receivedData as unknown as Offer[]) || [],
      sent: (sentData as unknown as Offer[]) || [],
    };
  },

  async acceptOffer(offerId: string, userId: string): Promise<AcceptOfferResponse> {
    const { data, error } = await supabase.rpc('accept_offer', {
      target_offer_id: offerId,
      executing_user_id: userId,
    });

    if (error) throw error;
    return data as AcceptOfferResponse;
  },

  async updateOfferStatus(offerId: string, status: 'declined' | 'cancelled'): Promise<void> {
    const { error } = await supabase
      .from('offers')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', offerId);

    if (error) throw error;
  },
};