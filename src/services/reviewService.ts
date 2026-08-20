// src/services/reviewService.ts
import { supabase } from '../lib/supabaseClient';
import type { TradeReview } from '../types/marketplace';

export interface SubmitReviewInput {
  tradeId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  tags: string[];
  comment?: string;
}

export const reviewService = {
  async submitReview(input: SubmitReviewInput): Promise<void> {
    const { error } = await supabase.rpc('submit_trade_review', {
      p_trade_id: input.tradeId,
      p_reviewer_id: input.reviewerId,
      p_reviewee_id: input.revieweeId,
      p_rating: input.rating,
      p_tags: input.tags,
      p_comment: input.comment || null,
    });

    if (error) throw error;
  },

  async hasReviewed(tradeId: string, reviewerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('trade_reviews')
      .select('id')
      .eq('trade_id', tradeId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  async getUserReviews(userId: string): Promise<TradeReview[]> {
    const { data, error } = await supabase
      .from('trade_reviews')
      .select('*, reviewer:reviewer_id(*)')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as TradeReview[]) || [];
  },
};