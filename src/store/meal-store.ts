import { create } from 'zustand';
import type { Meal, CuisineType, MealLanguage, PaymentMethod } from '@/types';
import { fetchOpenMeals, fetchMealById, fetchMyMeals } from '@/lib/api';

interface MealState {
  meals: Meal[];
  currentMeal: Meal | null;
  isLoading: boolean;
  error: string | null;
  filters: MealFilters;
  setMeals: (meals: Meal[]) => void;
  setCurrentMeal: (meal: Meal | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<MealFilters>) => void;
  resetFilters: () => void;
  fetchMeals: () => Promise<void>;
  fetchMealById: (id: string) => Promise<Meal | null>;
}

export interface MealFilters {
  cuisine_type: CuisineType | null;
  meal_languages: MealLanguage[];
  payment_method: PaymentMethod | null;
  date_from: string | null;
  date_to: string | null;
  search: string;
}

const defaultFilters: MealFilters = {
  cuisine_type: null,
  meal_languages: [],
  payment_method: null,
  date_from: null,
  date_to: null,
  search: '',
};

export const useMealStore = create<MealState>((set, get) => ({
  meals: [],
  currentMeal: null,
  isLoading: false,
  error: null,
  filters: defaultFilters,
  setMeals: (meals) => set({ meals }),
  setCurrentMeal: (currentMeal) => set({ currentMeal }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),

  fetchMeals: async () => {
    set({ isLoading: true, error: null });
    try {
      const meals = await fetchOpenMeals();
      set({ meals, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to fetch meals', isLoading: false });
    }
  },

  fetchMealById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const meal = await fetchMealById(id);
      set({ currentMeal: meal, isLoading: false });
      return meal;
    } catch (err) {
      set({ error: 'Failed to fetch meal', isLoading: false });
      return null;
    }
  },
}));

// Hook for my meals (separate from main meal store to avoid conflicts)
export async function getMyMeals(userId: string) {
  return fetchMyMeals(userId);
}
