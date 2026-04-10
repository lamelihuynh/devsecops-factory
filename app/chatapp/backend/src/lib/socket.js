import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  if (!userSocketMap[userId]) {
    userSocketMap[userId] = new Set();
  }
  userSocketMap[userId].add(socket.id);

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  //socket.on used for listening for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);

    // CRITICAL FIX: Remove socket from Set instead of deleting entire user
    if (userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);

      // Only remove user from map if they have no more connections
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // Listen for setCurrentUser event from client
  socket.on("setCurrentUser", (userId) => {
    socket.emit("currentUserConfirmed", userId);
    console.log(`User ${userId} confirmed their identity`);
  });
});

export { io, app, server };
