import { useMemo } from 'react';
import type { Listing } from '../types/marketplace';
import type { FilterState } from '../components/filters/SearchBar';

export function useFilteredListings(listings: Listing[], filters: FilterState) {
  return useMemo(() => {
    return listings
      .filter((item) => {
        if (filters.searchQuery.trim() !== '') {
          const q = filters.searchQuery.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesDesc = item.description.toLowerCase().includes(q);
          const matchesLookingFor = item.looking_for?.toLowerCase().includes(q) ?? false;
          if (!matchesTitle && !matchesDesc && !matchesLookingFor) {
            return false;
          }
        }

        if (filters.mode !== 'all' && item.mode !== filters.mode) {
          return false;
        }

        if (filters.condition !== 'all' && item.condition !== filters.condition) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'value_desc':
            return Number(b.estimated_value) - Number(a.estimated_value);
          case 'value_asc':
            return Number(a.estimated_value) - Number(b.estimated_value);
          case 'price_desc':
            return Number(b.cash_price || 0) - Number(a.cash_price || 0);
          case 'price_asc':
            return Number(a.cash_price || 0) - Number(b.cash_price || 0);
          case 'newest':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [listings, filters]);
}