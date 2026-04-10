import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  confirmedUserId: null,
  // Group-related state
  isGroupModalOpen: false,
  groups: [],
  // internal handler reference for global message listener
  globalMessageHandler: null,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      // Check if it's a group (has members array) or user
      const selectedUser = get().selectedUser;
      const isGroup = selectedUser?.members !== undefined;

      const endpoint = isGroup
        ? `/messages/group/${userId}`
        : `/messages/${userId}`;
      const res = await axiosInstance.get(endpoint);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    const isGroup = selectedUser?.members !== undefined;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: isGroup ? authUser._id : authUser._id,
      receiverId: isGroup ? undefined : selectedUser._id,
      groupId: isGroup ? selectedUser._id : undefined,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Add sender info for optimistic message display
    if (isGroup) {
      optimisticMessage.senderId = {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic,
      };
    }

    set({ messages: [...messages, optimisticMessage] });

    try {
      const endpoint = isGroup
        ? `/messages/send-group/${selectedUser._id}`
        : `/messages/send/${selectedUser._id}`;
      const res = await axiosInstance.post(endpoint, messageData);
      set((state) => ({
        messages: state.messages
          .filter((msg) => msg._id !== tempId)
          .concat(res.data),
      }));
    } catch (error) {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempId),
      }));
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();
    if (!socket || !authUser) return;

    const isGroup = selectedUser?.members !== undefined;

    // Request server confirmation of current user
    socket.emit("setCurrentUser", authUser._id);

    // Listen for confirmation from server
    socket.off("currentUserConfirmed");
    socket.off("newMessage");
    socket.on("currentUserConfirmed", (userId) => {
      set({ confirmedUserId: userId });
      console.log("Current user confirmed:", userId);
    });

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const isGroup = selectedUser?.members !== undefined;

      // Check if message is for currently open chat
      const isRelevantMessage = isGroup
        ? newMessage.groupId === selectedUser._id
        : newMessage.senderId === selectedUser._id;

      if (isRelevantMessage) {
        // Message for current chat - add to messages
        const currentMessages = get().messages;
        set({ messages: [...currentMessages, newMessage] });

        if (isSoundEnabled) {
          const notificationSound = new Audio("/sounds/notification.mp3");

          notificationSound.currentTime = 0; // reset to start
          notificationSound
            .play()
            .catch((e) => console.log("Audio play failed:", e));
        }
      } else {
        // Message for different chat
        if (newMessage.senderId) {
          get().getMyChatPartners(); // Refresh chats
        }

        // Play notification sound
        if (isSoundEnabled) {
          const notificationSound = new Audio("/sounds/notification.mp3");
          notificationSound.currentTime = 0; // reset to start
          notificationSound
            .play()
            .catch((e) => console.log("Audio play failed:", e));
        }
      }
    });
  },

  // Subscribe to newMessage globally (used when there's no open conversation)
  subscribeToGlobalMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // If already registered, skip
    if (get().globalMessageHandler) return;

    const handler = (newMessage) => {
      // Only handle global updates when no conversation is selected
      const selectedUser = get().selectedUser;
      if (selectedUser) return;

      if (newMessage.senderId) {
        get().getMyChatPartners();
      }
      if (newMessage.groupId) {
        get().getUserGroups();
      }

      if (get().isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound
          .play()
          .catch((e) => console.log("Audio play failed:", e));
      }
    };

    set({ globalMessageHandler: handler });
    socket.on("newMessage", handler);
  },

  unsubscribeFromGlobalMessages: () => {
    const socket = useAuthStore.getState().socket;
    const handler = get().globalMessageHandler;
    if (!socket || !handler) return;
    socket.off("newMessage", handler);
    set({ globalMessageHandler: null });
  },

  // Group management functions
  setGroupModalOpen: (isOpen) => set({ isGroupModalOpen: isOpen }),

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set({ groups: [res.data, ...get().groups] });
      toast.success("Group created successfully!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  getUserGroups: async () => {
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("currentUserConfirmed");
  },

  // Reset all chat state (call this on logout)
  resetChatState: () => {
    set({
      allContacts: [],
      chats: [],
      messages: [],
      activeTab: "chats",
      selectedUser: null,
      isUsersLoading: false,
      isMessagesLoading: false,
      confirmedUserId: null,
    });
  },
}));
