import { create } from 'zustand';
import type { Meal, MealFormData, CuisineType, MealLanguage, PaymentMethod } from '@/types';

interface MealState {
  meals: Meal[];
  currentMeal: Meal | null;
  isLoading: boolean;
  filters: MealFilters;
  setMeals: (meals: Meal[]) => void;
  setCurrentMeal: (meal: Meal | null) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: Partial<MealFilters>) => void;
  resetFilters: () => void;
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

export const useMealStore = create<MealState>((set) => ({
  meals: [],
  currentMeal: null,
  isLoading: false,
  filters: defaultFilters,
  setMeals: (meals) => set({ meals }),
  setCurrentMeal: (currentMeal) => set({ currentMeal }),
  setLoading: (isLoading) => set({ isLoading }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
