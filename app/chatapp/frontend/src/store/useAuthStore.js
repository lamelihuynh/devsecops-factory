import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: JSON.parse(localStorage.getItem("authUser")) || null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      // Backend returns { message, user }, so we need to extract the user
      const userData = res.data.user || res.data;
      set({ authUser: userData });
      localStorage.setItem("authUser", JSON.stringify(userData));
      get().connectSocket();
    } catch (error) {
      console.log("Error in authCheck:", error);
      set({ authUser: null });
      localStorage.removeItem("authUser");
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      localStorage.setItem("authUser", JSON.stringify(res.data));

      toast.success("Account created successfully!");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      localStorage.setItem("authUser", JSON.stringify(res.data));

      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      localStorage.removeItem("authUser");
      toast.success("Logged out successfully");
      get().disconnectSocket();

      // Clear chat state to prevent showing previous user's chat
      const { useChatStore } = await import("./useChatStore");
      useChatStore.getState().resetChatState();
    } catch (error) {
      toast.error("Error logging out");
      console.log("Logout error:", error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      localStorage.setItem("authUser", JSON.stringify(res.data));
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    const currentSocket = get().socket;

    // Don't reconnect if already connected
    if (!authUser) return;
    if (currentSocket?.connected) {
      console.log("Socket already connected");
      return;
    }

    // Disconnect old socket if it exists but isn't connected
    if (currentSocket) {
      currentSocket.disconnect();
    }

    const socket = io(BASE_URL, {
      withCredentials: true, // this ensures cookies are sent with the connection
    });

    socket.connect();

    set({ socket });

    // listen for online users event
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });


    // Add connection error handling
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.off("getOnlineUsers");
      socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },

  subscribeToAuthChanges: () => {
    // Prevent duplicate event listeners
    const handleStorageChange = (e) => {
      if (e.key === "authUser") {
        if (e.newValue) {
          // User logged in from another tab
          try {
            const newAuthUser = JSON.parse(e.newValue);
            set({ authUser: newAuthUser });
            get().connectSocket();
          } catch (error) {
            console.error("Failed to parse authUser from storage:", error);
          }
        } else {
          // User logged out from another tab
          set({ authUser: null });
          get().disconnectSocket();
        }
      }
    };

    // Remove any existing listener before adding a new one
    window.removeEventListener("storage", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    // Return cleanup function
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  },
}));
