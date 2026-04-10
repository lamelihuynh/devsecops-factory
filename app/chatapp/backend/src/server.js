import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { ENV } from "./lib/env.js";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/messages.route.js";
import groupRoutes from "./routes/group.route.js";
import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import { seedQuackAI } from "./lib/seed.js";
import { initializeGemini } from "./lib/gemini.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "5mb" })); // to parse JSON bodies
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true })); //accept requests from this URL
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

// Make ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// server.listen(PORT, async () => {
//   console.log("Server running on port:" + PORT);
//   await connectDB();

//   // Initialize QuackAI and Gemini after DB connection
//   seedQuackAI();
//   initializeGemini();
// });
const startServer = async () => {
  await connectDB();
  await seedQuackAI();
  initializeGemini();

  server.listen(PORT, () => {
    console.log("Server running on port:" + PORT);
  });
};

startServer();
