import { supabase } from '../lib/supabaseClient';
import { compressImage } from '../lib/imageCompression';
import type { Listing } from '../types/marketplace';

export interface CreateListingInput {
  title: string;
  description: string;
  condition: Listing['condition'];
  mode: Listing['mode'];
  cash_price?: number | null;
  estimated_value: number;
  looking_for?: string | null;
  is_inventory_only: boolean;
  imageFiles: File[];
}

export const listingService = {
  async uploadImages(userId: string, files: File[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Apply browser-level canvas compression before sending network payload
      const processedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        outputFormat: 'image/webp',
      });

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, processedFile, {
          cacheControl: '31536000', // 1-year immutable cache
          upsert: false,
          contentType: processedFile.type,
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  },

  async createListing(userId: string, input: CreateListingInput): Promise<Listing> {
    const imageUrls = await this.uploadImages(userId, input.imageFiles);

    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        condition: input.condition,
        mode: input.mode,
        cash_price: input.mode === 'barter_only' ? null : input.cash_price,
        estimated_value: input.estimated_value,
        looking_for: input.looking_for || null,
        images: imageUrls,
        is_inventory_only: input.is_inventory_only,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Listing;
  },

  async getPublicListings(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles:user_id(*)')
      .eq('is_inventory_only', false)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as Listing[]) || [];
  },

  async getUserCloset(userId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as Listing[]) || [];
  },

  async toggleItemVisibility(listingId: string, isInventoryOnly: boolean): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .update({
        is_inventory_only: isInventoryOnly,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (error) throw error;
  },

  async archiveItem(listingId: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (error) throw error;
  },
};