import React from "react";
import type { ListingMode, ItemCondition } from "../../types/marketplace";
import { Search, ArrowUpDown, X, Tag } from "lucide-react";

export type SortOption =
  | "newest"
  | "value_asc"
  | "value_desc"
  | "price_asc"
  | "price_desc";

export interface FilterState {
  searchQuery: string;
  mode: ListingMode | "all";
  condition: ItemCondition | "all";
  selectedCategory: string;
  sortBy: SortOption;
}

interface SearchBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onFilterChange,
  categories,
}) => {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      searchQuery: "",
      mode: "all",
      condition: "all",
      selectedCategory: "All",
      sortBy: "newest",
    });
  };

  const isFiltered =
    filters.searchQuery !== "" ||
    filters.mode !== "all" ||
    filters.condition !== "all" ||
    filters.selectedCategory !== "All" ||
    filters.sortBy !== "newest";

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            placeholder="Search textbooks, reviewers, calculators, dorm gear..."
            className="w-full bg-zinc-900/80 border border-zinc-800/80 focus:border-zinc-600 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter("searchQuery", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex bg-zinc-900/80 border border-zinc-800/80 p-1 rounded-xl shrink-0">
          {[
            { id: "all", label: "All Modes" },
            { id: "cash_or_barter", label: "Sale / Trade" },
            { id: "barter_only", label: "Barter Only" },
            { id: "cash_only", label: "₱ Cash Only" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => updateFilter("mode", m.id as ListingMode | "all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filters.mode === m.id
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <div className="flex items-center bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs text-zinc-300">
            <ArrowUpDown size={13} className="text-zinc-500 mr-2" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                updateFilter("sortBy", e.target.value as SortOption)
              }
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-2"
            >
              <option value="newest" className="bg-zinc-900">
                Newest First
              </option>
              <option value="value_desc" className="bg-zinc-900">
                Highest Value (₱)
              </option>
              <option value="value_asc" className="bg-zinc-900">
                Lowest Value (₱)
              </option>
              <option value="price_desc" className="bg-zinc-900">
                Highest Price (₱)
              </option>
              <option value="price_asc" className="bg-zinc-900">
                Lowest Price (₱)
              </option>
            </select>
          </div>
        </div>

        {isFiltered && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/20 border border-rose-900/30 rounded-xl transition shrink-0"
          >
            <X size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 flex items-center gap-1 mr-1 shrink-0">
          <Tag size={11} /> Categories:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => updateFilter("selectedCategory", cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
              filters.selectedCategory === cat
                ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                : "bg-zinc-950/40 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
