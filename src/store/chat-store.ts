import { create } from 'zustand';
import { fetchThreads, fetchMessages, sendMessage, deleteMessage, fetchLastMessage } from '@/lib/api';
import type { MessageThread, Message } from '@/types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ChatState {
  // Threads (message list)
  threads: MessageThread[];
  threadsLoading: boolean;

  // Current chat room
  currentThreadId: string | null;
  messages: Message[];
  messagesLoading: boolean;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;

  // UI
  toasts: Toast[];
  sendingMessage: boolean;

  // Actions
  fetchThreads: () => Promise<void>;
  openThread: (threadId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  send: (content: string, messageType?: string, imageUrls?: string[], metadata?: Record<string, unknown>) => Promise<void>;
  removeMessage: (messageId: string) => Promise<void>;
  addToast: (message: string, type?: 'success' | 'error') => void;
  removeToast: (id: string) => void;
  clearCurrentThread: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  threadsLoading: false,
  currentThreadId: null,
  messages: [],
  messagesLoading: false,
  hasMoreMessages: false,
  isLoadingMore: false,
  toasts: [],
  sendingMessage: false,

  fetchThreads: async () => {
    set({ threadsLoading: true });
    const threads = await fetchThreads(50);

    // Fetch last message for each thread concurrently
    const threadsWithMessages = await Promise.all(
      threads.map(async (thread) => {
        const lastMsg = await fetchLastMessage(thread.id);
        return { ...thread, last_message: lastMsg || undefined };
      })
    );

    set({ threads: threadsWithMessages, threadsLoading: false });
  },

  openThread: async (threadId: string) => {
    set({ currentThreadId: threadId, messagesLoading: true, messages: [], hasMoreMessages: true });

    const messages = await fetchMessages(threadId, { limit: 30 });
    set({
      messages,
      messagesLoading: false,
      hasMoreMessages: messages.length >= 30,
    });
  },

  loadMoreMessages: async () => {
    const { currentThreadId, messages, isLoadingMore, hasMoreMessages } = get();
    if (!currentThreadId || isLoadingMore || !hasMoreMessages || messages.length === 0) return;

    set({ isLoadingMore: true });

    const oldestMessage = messages[0];
    const olderMessages = await fetchMessages(currentThreadId, {
      limit: 30,
      before: oldestMessage.created_at,
    });

    set({
      messages: [...olderMessages, ...messages],
      isLoadingMore: false,
      hasMoreMessages: olderMessages.length >= 30,
    });
  },

  send: async (content, messageType = 'text', imageUrls = [], metadata = {}) => {
    const { currentThreadId } = get();
    if (!currentThreadId) return;

    set({ sendingMessage: true });

    // Optimistic: add message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      thread_id: currentThreadId,
      sender_id: 'self',
      content,
      message_type: messageType as Message['message_type'],
      image_urls: imageUrls,
      metadata,
      is_deleted: false,
      created_at: new Date().toISOString(),
      sender: undefined, // will be filled by real response
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg],
    }));

    const result = await sendMessage(currentThreadId, content, messageType, imageUrls, metadata);

    if (result.success) {
      // Replace temp message with real one
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempId
            ? { ...m, id: result.messageId!, sender_id: m.sender_id }
            : m
        ),
        sendingMessage: false,
      }));

      // Refresh threads to update last_message_at
      get().fetchThreads();
    } else {
      // Remove optimistic message
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempId),
        sendingMessage: false,
      }));
      get().addToast(result.error || 'Send failed', 'error');
    }
  },

  removeMessage: async (messageId: string) => {
    const result = await deleteMessage(messageId);
    if (result.success) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true } : m
        ),
      }));
      get().addToast('Message deleted', 'success');
    } else {
      get().addToast('Failed to delete', 'error');
    }
  },

  addToast: (message, type = 'success') => {
    const id = `toast-${Date.now()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearCurrentThread: () => {
    set({
      currentThreadId: null,
      messages: [],
      hasMoreMessages: false,
    });
  },
}));
