import { supabase } from '../lib/supabaseClient';
import { compressImage } from '../lib/imageCompression';
import type { Profile } from '../types/marketplace';

export interface UpdateProfileInput {
  full_name: string;
  bio?: string;
  location_city?: string;
  default_campus_meetup?: string;
  avatarFile?: File | null;
}

export const profileService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    // Compress square avatar to 400x400 max
    const compressedAvatar = await compressImage(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.85,
      outputFormat: 'image/webp',
    });

    const fileExt = compressedAvatar.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, compressedAvatar, {
        cacheControl: '3600',
        upsert: true,
        contentType: compressedAvatar.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  },

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
    currentAvatarUrl?: string
  ): Promise<Profile> {
    let avatarUrl = currentAvatarUrl;

    if (input.avatarFile) {
      avatarUrl = await this.uploadAvatar(userId, input.avatarFile);
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: input.full_name.trim(),
        bio: input.bio?.trim() || null,
        location_city: input.location_city?.trim() || null,
        default_campus_meetup: input.default_campus_meetup?.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Profile;
  },
};