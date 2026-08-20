import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  description: z.string().trim().min(10, "Provide at least a short description").max(2000),
  condition: z.enum(['brand_new', 'like_new', 'used_good', 'used_fair', 'for_parts']),
  mode: z.enum(['cash_only', 'barter_only', 'cash_or_barter']),
  cash_price: z.number().nonnegative().optional().nullable(),
  estimated_value: z.number().positive("Estimated value is required for trade balancing"),
  looking_for: z.string().max(300).optional().nullable(),
  is_inventory_only: z.boolean().default(false),
  images: z.array(z.string().url()).min(1, "Upload at least one item photo").max(6, "Maximum 6 photos allowed")
});

export const offerSchema = z.object({
  listing_id: z.string().uuid(),
  type: z.enum(['cash', 'barter', 'hybrid']),
  cash_amount: z.number().min(0, "Cash amount cannot be negative"),
  offered_item_ids: z.array(z.string().uuid()),
  message: z.string().max(500).optional()
}).refine((data) => {
  if (data.type === 'cash' && data.cash_amount <= 0) {
    return false;
  }
  if (data.type === 'barter' && data.offered_item_ids.length === 0) {
    return false;
  }
  if (data.type === 'hybrid' && (data.offered_item_ids.length === 0 || data.cash_amount <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Invalid offer configuration for the selected offer type"
});