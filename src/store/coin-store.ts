import { create } from 'zustand';
import type { CoinTransaction, ShopItem, ShopOrder, ShopItemCategory } from '@/types';
import {
  fetchCoinTransactions,
  dailyCheckin,
  fetchTodayCheckinStatus,
  fetchShopItems,
  redeemShopItem,
  fetchMyShopOrders,
} from '@/lib/api';

interface CoinState {
  // Coin balance
  totalCoins: number;
  dailyCoinEarned: number;
  dailyLimit: number;
  // Checkin
  hasCheckedInToday: boolean;
  streakDays: number;
  isCheckingIn: boolean;
  // Transactions
  transactions: CoinTransaction[];
  // Shop
  shopItems: ShopItem[];
  shopCategory: ShopItemCategory | 'all';
  orders: ShopOrder[];
  // Loading
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchBalance: () => Promise<void>;
  performCheckin: () => Promise<{ success: boolean; coins?: number; error?: string }>;
  fetchTransactions: () => Promise<void>;
  fetchShopItems: () => Promise<void>;
  setShopCategory: (category: ShopItemCategory | 'all') => void;
  redeemItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  fetchOrders: () => Promise<void>;
}

const DAILY_LIMIT = 300;

export const useCoinStore = create<CoinState>((set, get) => ({
  totalCoins: 0,
  dailyCoinEarned: 0,
  dailyLimit: DAILY_LIMIT,
  hasCheckedInToday: false,
  streakDays: 0,
  isCheckingIn: false,
  transactions: [],
  shopItems: [],
  shopCategory: 'all',
  orders: [],
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('total_coins, daily_coin_earned, daily_coin_reset_date')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Reset daily count if new day
        const today = new Date().toISOString().split('T')[0];
        const resetDate = profile.daily_coin_reset_date?.split('T')[0];
        const dailyEarned = resetDate === today ? profile.daily_coin_earned : 0;
        set({ totalCoins: profile.total_coins, dailyCoinEarned: dailyEarned });

        // Also fetch checkin status
        const { data: todayCheckin } = await supabase
          .from('daily_checkins')
          .select('streak_days')
          .eq('user_id', user.id)
          .eq('checkin_date', today)
          .maybeSingle();

        if (todayCheckin) {
          set({ hasCheckedInToday: true, streakDays: todayCheckin.streak_days });
        } else {
          // Get streak from yesterday
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const { data: yesterdayCheckin } = await supabase
            .from('daily_checkins')
            .select('streak_days')
            .eq('user_id', user.id)
            .eq('checkin_date', yesterday)
            .maybeSingle();
          set({
            hasCheckedInToday: false,
            streakDays: yesterdayCheckin?.streak_days || 0,
          });
        }
      }
    } catch {
      // Silently fail
    }
  },

  performCheckin: async () => {
    set({ isCheckingIn: true });
    try {
      const result = await dailyCheckin();
      if (result.success) {
        set({ hasCheckedInToday: true, streakDays: result.streakDays || 0 });
        // Refresh balance
        await get().fetchBalance();
        // Refresh transactions
        await get().fetchTransactions();
      }
      return result;
    } catch {
      return { success: false, error: 'Checkin failed' };
    } finally {
      set({ isCheckingIn: false });
    }
  },

  fetchTransactions: async () => {
    try {
      const transactions = await fetchCoinTransactions(30);
      set({ transactions });
    } catch {
      // Silently fail
    }
  },

  fetchShopItems: async () => {
    set({ isLoading: true });
    try {
      const { shopCategory } = get();
      const shopItems = await fetchShopItems(shopCategory);
      set({ shopItems, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch shop items', isLoading: false });
    }
  },

  setShopCategory: (category) => {
    set({ shopCategory: category });
    get().fetchShopItems();
  },

  redeemItem: async (itemId: string) => {
    set({ isLoading: true });
    try {
      const result = await redeemShopItem(itemId);
      if (result.success) {
        // Refresh balance and orders
        await Promise.all([
          get().fetchBalance(),
          get().fetchOrders(),
          get().fetchTransactions(),
        ]);
      }
      set({ isLoading: false });
      return result;
    } catch {
      set({ error: 'Redemption failed', isLoading: false });
      return { success: false, error: 'Redemption failed' };
    }
  },

  fetchOrders: async () => {
    try {
      const orders = await fetchMyShopOrders();
      set({ orders });
    } catch {
      // Silently fail
    }
  },
}));
