import { create } from 'zustand';
import type { Moment, MomentComment } from '@/types';
import {
  fetchMoments,
  createMoment,
  deleteMoment,
  likeMoment,
  unlikeMoment,
  checkMomentLiked,
  fetchComments,
  addComment,
  deleteComment,
} from '@/lib/api';

interface MomentState {
  // Moments list
  moments: Moment[];
  currentMoment: Moment | null;
  comments: MomentComment[];
  hasMore: boolean;
  offset: number;
  limit: number;
  // Compose
  isComposing: boolean;
  showCompose: boolean;
  // Comments
  isSubmittingComment: boolean;
  replyTo: { commentId: string; nickname: string } | null;
  // Loading
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  // Toast
  toast: { message: string; type: 'success' | 'error' } | null;
  // Actions
  fetchMoments: (userId?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  setCurrentMoment: (moment: Moment | null) => void;
  fetchComments: (momentId: string) => Promise<void>;
  toggleLike: (momentId: string) => Promise<void>;
  checkLikedStatus: (momentIds: string[]) => Promise<void>;
  createMoment: (data: {
    content: string;
    images?: string[];
    visibility?: 'public' | 'friends' | 'party_only';
    mood_tag?: string | null;
    bar_id?: string | null;
    location_name?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteMoment: (momentId: string) => Promise<{ success: boolean; error?: string }>;
  addComment: (momentId: string, content: string, parentId?: string) => Promise<{ success: boolean; error?: string }>;
  deleteComment: (commentId: string) => Promise<{ success: boolean; error?: string }>;
  setShowCompose: (show: boolean) => void;
  setReplyTo: (reply: { commentId: string; nickname: string } | null) => void;
  clearToast: () => void;
}

export const useMomentStore = create<MomentState>((set, get) => ({
  moments: [],
  currentMoment: null,
  comments: [],
  hasMore: true,
  offset: 0,
  limit: 20,
  isComposing: false,
  showCompose: false,
  isSubmittingComment: false,
  replyTo: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  toast: null,

  fetchMoments: async (userId?: string) => {
    set({ isLoading: true, offset: 0, moments: [], hasMore: true });
    try {
      const moments = await fetchMoments({ userId, limit: get().limit, offset: 0 });
      set({
        moments,
        hasMore: moments.length >= get().limit,
        offset: moments.length,
        isLoading: false,
      });

      // Check liked status for all moments
      const momentIds = moments.map(m => m.id);
      if (momentIds.length > 0) {
        get().checkLikedStatus(momentIds);
      }
    } catch {
      set({ error: 'Failed to fetch moments', isLoading: false });
    }
  },

  loadMore: async () => {
    const { hasMore, isLoadingMore, offset, limit } = get();
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const moreMoments = await fetchMoments({ limit, offset });
      set(state => ({
        moments: [...state.moments, ...moreMoments],
        hasMore: moreMoments.length >= limit,
        offset: state.offset + moreMoments.length,
        isLoadingMore: false,
      }));

      // Check liked status for new moments
      const newIds = moreMoments.map(m => m.id);
      if (newIds.length > 0) {
        get().checkLikedStatus(newIds);
      }
    } catch {
      set({ isLoadingMore: false });
    }
  },

  setCurrentMoment: (moment) => {
    set({ currentMoment: moment, comments: [] });
    if (moment) {
      get().fetchComments(moment.id);
    }
  },

  fetchComments: async (momentId: string) => {
    try {
      const comments = await fetchComments(momentId);
      set({ comments });
    } catch {
      // Silently fail
    }
  },

  toggleLike: async (momentId: string) => {
    try {
      // Check current state
      const { moments } = get();
      const moment = moments.find(m => m.id === momentId);
      const isCurrentlyLiked = moment?.is_liked || false;

      if (isCurrentlyLiked) {
        const result = await unlikeMoment(momentId);
        if (result.success) {
          set(state => ({
            moments: state.moments.map(m =>
              m.id === momentId
                ? { ...m, is_liked: false, likes_count: Math.max(0, m.likes_count - 1) }
                : m
            ),
          }));
        }
      } else {
        const result = await likeMoment(momentId);
        if (result.success) {
          set(state => ({
            moments: state.moments.map(m =>
              m.id === momentId
                ? { ...m, is_liked: true, likes_count: m.likes_count + 1 }
                : m
            ),
          }));
        }
      }
    } catch {
      // Silently fail
    }
  },

  checkLikedStatus: async (momentIds: string[]) => {
    // Batch check by calling individually (Supabase doesn't support batch well)
    const likedIds: Set<string> = new Set();
    await Promise.all(
      momentIds.map(async (id) => {
        const liked = await checkMomentLiked(id);
        if (liked) likedIds.add(id);
      })
    );
    set(state => ({
      moments: state.moments.map(m => ({
        ...m,
        is_liked: likedIds.has(m.id),
      })),
    }));
  },

  createMoment: async (data) => {
    set({ isComposing: true });
    try {
      const result = await createMoment(data);
      if (result.success) {
        set(state => ({
          showCompose: false,
          isComposing: false,
          toast: { message: 'postSuccess', type: 'success' },
        }));
        // Refresh moments list
        await get().fetchMoments();
        return result;
      }
      set({ isComposing: false, toast: { message: data.content.trim() ? 'postFail' : 'EMPTY', type: 'error' } });
      return result;
    } catch {
      set({ isComposing: false, toast: { message: 'postFail', type: 'error' } });
      return { success: false, error: 'Post failed' };
    }
  },

  deleteMoment: async (momentId: string) => {
    try {
      const result = await deleteMoment(momentId);
      if (result.success) {
        set(state => ({
          moments: state.moments.filter(m => m.id !== momentId),
          currentMoment: state.currentMoment?.id === momentId ? null : state.currentMoment,
          toast: { message: 'deleteSuccess', type: 'success' },
        }));
      }
      return result;
    } catch {
      set({ toast: { message: 'deleteFail', type: 'error' } });
      return { success: false, error: 'Delete failed' };
    }
  },

  addComment: async (momentId, content, parentId) => {
    set({ isSubmittingComment: true });
    try {
      const result = await addComment(momentId, content, parentId);
      if (result.success) {
        // Refresh comments
        await get().fetchComments(momentId);
        // Update comments_count in moments list
        set(state => ({
          moments: state.moments.map(m =>
            m.id === momentId ? { ...m, comments_count: m.comments_count + 1 } : m
          ),
          isSubmittingComment: false,
          replyTo: null,
        }));
      } else {
        set({ isSubmittingComment: false });
      }
      return result;
    } catch {
      set({ isSubmittingComment: false });
      return { success: false, error: 'Comment failed' };
    }
  },

  deleteComment: async (commentId: string) => {
    const { currentMoment } = get();
    if (!currentMoment) return { success: false, error: 'No moment selected' };

    try {
      const result = await deleteComment(commentId);
      if (result.success) {
        // Refresh comments
        await get().fetchComments(currentMoment.id);
        // Update comments_count
        set(state => ({
          moments: state.moments.map(m =>
            m.id === currentMoment.id ? { ...m, comments_count: Math.max(0, m.comments_count - 1) } : m
          ),
        }));
      }
      return result;
    } catch {
      return { success: false, error: 'Delete failed' };
    }
  },

  setShowCompose: (show) => set({ showCompose: show }),
  setReplyTo: (reply) => set({ replyTo: reply }),
  clearToast: () => set({ toast: null }),
}));
