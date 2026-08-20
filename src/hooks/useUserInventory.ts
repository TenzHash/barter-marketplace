import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Listing } from '../types/marketplace';

export function useUserInventory(userId: string | null) {
  const [inventory, setInventory] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchInventory() {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchErr) {
        setError(fetchErr.message);
      } else {
        setInventory((data as unknown as Listing[]) || []);
      }
      setLoading(false);
    }

    fetchInventory();
  }, [userId]);

  return { inventory, loading, error };
}