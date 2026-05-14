import { create } from 'zustand';
import {
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  checkFollowStatus,
  fetchFollowers,
  fetchFollowing,
  fetchBlockedUsers,
  reportUser,
} from '@/lib/api';

interface SocialState {
  // Follow status cache: { [targetUserId]: { isFollowing, isMutual, isBlocked } }
  followStatusMap: Record<string, { isFollowing: boolean; isMutual: boolean; isBlocked: boolean }>;
  isLoadingFollow: Record<string, boolean>;

  // Lists
  followers: any[];
  following: any[];
  blockedUsers: any[];
  isLoadingFollowers: boolean;
  isLoadingFollowing: boolean;
  isLoadingBlocked: boolean;

  // Actions
  loadFollowStatus: (targetUserId: string) => Promise<{ isFollowing: boolean; isMutual: boolean; isBlocked: boolean }>;
  follow: (targetUserId: string) => Promise<boolean>;
  unfollow: (targetUserId: string) => Promise<boolean>;
  block: (targetUserId: string) => Promise<boolean>;
  unblock: (targetUserId: string) => Promise<boolean>;
  report: (targetUserId: string, reason: string) => Promise<boolean>;
  loadFollowers: (userId: string) => Promise<void>;
  loadFollowing: (userId: string) => Promise<void>;
  loadBlockedUsers: () => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  followStatusMap: {},
  isLoadingFollow: {},
  followers: [],
  following: [],
  blockedUsers: [],
  isLoadingFollowers: false,
  isLoadingFollowing: false,
  isLoadingBlocked: false,

  loadFollowStatus: async (targetUserId: string) => {
    const existing = get().followStatusMap[targetUserId];
    if (existing) return existing;

    const status = await checkFollowStatus(targetUserId);
    set((state) => ({
      followStatusMap: { ...state.followStatusMap, [targetUserId]: status },
    }));
    return status;
  },

  follow: async (targetUserId: string) => {
    set((state) => ({ isLoadingFollow: { ...state.isLoadingFollow, [targetUserId]: true } }));
    const { success } = await followUser(targetUserId);
    if (success) {
      // Re-check mutual status
      const status = await checkFollowStatus(targetUserId);
      set((state) => ({
        followStatusMap: { ...state.followStatusMap, [targetUserId]: status },
        isLoadingFollow: { ...state.isLoadingFollow, [targetUserId]: false },
      }));
    } else {
      set((state) => ({ isLoadingFollow: { ...state.isLoadingFollow, [targetUserId]: false } }));
    }
    return success;
  },

  unfollow: async (targetUserId: string) => {
    set((state) => ({ isLoadingFollow: { ...state.isLoadingFollow, [targetUserId]: true } }));
    const { success } = await unfollowUser(targetUserId);
    if (success) {
      const status = await checkFollowStatus(targetUserId);
      set((state) => ({
        followStatusMap: { ...state.followStatusMap, [targetUserId]: status },
        isLoadingFollow: { ...state.isLoadingFollow, [targetUserId]: false },
      }));
    } else {
      set((state) => ({ isLoadingFollow: { ...state.isLoadingFollow, [targetUserId]: false } }));
    }
    return success;
  },

  block: async (targetUserId: string) => {
    const { success } = await blockUser(targetUserId);
    if (success) {
      set((state) => ({
        followStatusMap: {
          ...state.followStatusMap,
          [targetUserId]: {
            ...state.followStatusMap[targetUserId],
            isBlocked: true,
            isFollowing: false,
          },
        },
      }));
    }
    return success;
  },

  unblock: async (targetUserId: string) => {
    const { success } = await unblockUser(targetUserId);
    if (success) {
      set((state) => ({
        followStatusMap: {
          ...state.followStatusMap,
          [targetUserId]: {
            ...state.followStatusMap[targetUserId],
            isBlocked: false,
          },
        },
        blockedUsers: state.blockedUsers.filter((u: any) => u.blocked_id !== targetUserId),
      }));
    }
    return success;
  },

  report: async (targetUserId: string, reason: string) => {
    const { success } = await reportUser(targetUserId, reason);
    return success;
  },

  loadFollowers: async (userId: string) => {
    set({ isLoadingFollowers: true });
    const data = await fetchFollowers(userId);
    set({ followers: data, isLoadingFollowers: false });
  },

  loadFollowing: async (userId: string) => {
    set({ isLoadingFollowing: true });
    const data = await fetchFollowing(userId);
    set({ following: data, isLoadingFollowing: false });
  },

  loadBlockedUsers: async () => {
    set({ isLoadingBlocked: true });
    const data = await fetchBlockedUsers();
    set({ blockedUsers: data, isLoadingBlocked: false });
  },
}));
