import { supabase } from '../lib/supabaseClient';
import type { TradeMessage, DetailedTrade } from '../types/marketplace';

export const tradeService = {
  async getTradeDetails(tradeId: string): Promise<DetailedTrade> {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        buyer:buyer_id(*),
        seller:seller_id(*),
        offer:offer_id(
          *,
          target_listing:listing_id(*),
          offer_items(
            id,
            listing_id,
            listing:listing_id(*)
          )
        )
      `)
      .eq('id', tradeId)
      .single();

    if (error) throw error;
    return data as unknown as DetailedTrade;
  },

  async getUserTrades(userId: string): Promise<DetailedTrade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        buyer:buyer_id(*),
        seller:seller_id(*),
        offer:offer_id(
          *,
          target_listing:listing_id(*)
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as DetailedTrade[]) || [];
  },

  async getMessages(tradeId: string): Promise<TradeMessage[]> {
    const { data, error } = await supabase
      .from('trade_messages')
      .select('*, sender:sender_id(*)')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as unknown as TradeMessage[]) || [];
  },

  async sendMessage(tradeId: string, senderId: string, content: string): Promise<TradeMessage> {
    const { data, error } = await supabase
      .from('trade_messages')
      .insert({
        trade_id: tradeId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select('*, sender:sender_id(*)')
      .single();

    if (error) throw error;
    return data as unknown as TradeMessage;
  },

  async confirmReceipt(tradeId: string, userId: string): Promise<{ status: string }> {
    const { data, error } = await supabase.rpc('confirm_trade_receipt', {
      target_trade_id: tradeId,
      executing_user_id: userId,
    });

    if (error) throw error;
    return data;
  },

async proposeMeetup(
    tradeId: string,
    proposerId: string,
    location: string,
    time: string
  ): Promise<void> {
    const { error } = await supabase
      .from('trades')
      .update({
        meetup_location: location,
        meetup_time: time,
        meetup_proposed_by: proposerId,
        meetup_status: 'proposed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tradeId);

    if (error) throw error;
  },

  async agreeToMeetup(tradeId: string): Promise<void> {
    const { error } = await supabase
      .from('trades')
      .update({
        meetup_status: 'agreed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tradeId);

    if (error) throw error;
  },
};