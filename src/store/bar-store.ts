import { create } from 'zustand';
import type { Bar, BarRating, BarCity, BarCategory } from '@/types';
import {
  fetchBars,
  fetchBarById,
  fetchBarRatings,
  fetchMyBarCheckinToday,
  fetchMyBarRating,
  fetchTodayCheckinCount,
} from '@/lib/api';

interface BarState {
  bars: Bar[];
  currentBar: Bar | null;
  ratings: BarRating[];
  isLoading: boolean;
  error: string | null;
  filters: BarFilters;
  hasCheckedInToday: boolean;
  hasRated: boolean;
  todayCheckinCount: number;
  setBars: (bars: Bar[]) => void;
  setCurrentBar: (bar: Bar | null) => void;
  setRatings: (ratings: BarRating[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<BarFilters>) => void;
  resetFilters: () => void;
  fetchBars: () => Promise<void>;
  fetchBarById: (id: string) => Promise<Bar | null>;
  fetchRatings: (barId: string) => Promise<void>;
  checkCheckinStatus: (barId: string) => Promise<void>;
  checkRatingStatus: (barId: string) => Promise<void>;
  fetchTodayCheckinCount: (barId: string) => Promise<void>;
}

export interface BarFilters {
  city: BarCity | 'all';
  category: BarCategory | 'all';
  search: string;
}

const defaultFilters: BarFilters = {
  city: 'all',
  category: 'all',
  search: '',
};

export const useBarStore = create<BarState>((set, get) => ({
  bars: [],
  currentBar: null,
  ratings: [],
  isLoading: false,
  error: null,
  filters: defaultFilters,
  hasCheckedInToday: false,
  hasRated: false,
  todayCheckinCount: 0,
  setBars: (bars) => set({ bars }),
  setCurrentBar: (currentBar) => set({ currentBar }),
  setRatings: (ratings) => set({ ratings }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),

  fetchBars: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const bars = await fetchBars({
        city: filters.city,
        category: filters.category,
        search: filters.search || undefined,
      });
      set({ bars, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch bars', isLoading: false });
    }
  },

  fetchBarById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const bar = await fetchBarById(id);
      set({ currentBar: bar, isLoading: false });
      return bar;
    } catch {
      set({ error: 'Failed to fetch bar', isLoading: false });
      return null;
    }
  },

  fetchRatings: async (barId: string) => {
    try {
      const ratings = await fetchBarRatings(barId);
      set({ ratings });
    } catch {
      // Silently fail for ratings
    }
  },

  checkCheckinStatus: async (barId: string) => {
    const checkedIn = await fetchMyBarCheckinToday(barId);
    set({ hasCheckedInToday: checkedIn });
  },

  checkRatingStatus: async (barId: string) => {
    const rating = await fetchMyBarRating(barId);
    set({ hasRated: !!rating });
  },

  fetchTodayCheckinCount: async (barId: string) => {
    const count = await fetchTodayCheckinCount(barId);
    set({ todayCheckinCount: count });
  },
}));
