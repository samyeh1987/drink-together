import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        set({ user: null, isLoading: false });
        return;
      }

      // Fetch profile from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          user_tags(tag:tags(id, name, category, i18n_key))
        `)
        .eq('id', authUser.id)
        .single();

      if (profile) {
        set({
          user: {
            id: profile.id,
            email: profile.email,
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            age_range: profile.age_range,
            occupation: profile.occupation,
            bio: profile.bio,
            languages_spoken: profile.languages_spoken || [],
            credit_score: profile.credit_score,
            email_verified: profile.email_verified,
            created_at: profile.created_at,
            tags: (profile.user_tags || []).map((ut: any) => ut.tag),
            // Extended profile fields
            height: profile.height,
            weight: profile.weight,
            birthday: profile.birthday,
            city: profile.city,
            zodiac: profile.zodiac,
            line_id: profile.line_id,
            whatsapp: profile.whatsapp,
            contact_visible: profile.contact_visible,
          } as any,
          isLoading: false,
        });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, isLoading: false });
  },
}));
