# `src/` — Backend Source Code

This folder contains the complete server-side application logic for QuackChat, organized into clearly separated layers: routing, controllers, database models, middleware, library utilities, and email handling.

---

## Folder & File Overview

```
src/
├── server.js        # Application entry point — configures Express and starts the server
├── controllers/     # Request handlers: core business logic for each API domain
├── routes/          # Express routers: map HTTP endpoints to controllers
├── models/          # Mongoose schemas and models for MongoDB collections
├── middleware/      # Express/Socket middleware (authentication, security)
├── lib/             # Shared utility modules and third-party client configurations
└── emails/          # Email templates and sending logic
```

---

## Root File

| File | Description |
|---|---|
| `server.js` | The main entry point for the backend. Configures the Express app with JSON body parsing (5 MB limit), CORS, and cookie-parser. Mounts the three route groups (`/api/auth`, `/api/messages`, `/api/groups`). In production, serves the built frontend static files. On startup, connects to MongoDB, seeds the QuackAI user, initializes the Gemini AI model, then starts listening on the configured port. |

---

## `controllers/` — Business Logic

Controllers contain the actual logic for handling HTTP requests. They interact with models, third-party services, and sockets, then send a response.

| File | Description |
|---|---|
| `auth.controller.js` | Handles user **authentication**: `signup` (validates input, hashes the password with bcrypt, saves the user, generates a JWT cookie, and sends a welcome email), `login` (verifies credentials, issues a JWT cookie), `logout` (clears the JWT cookie), and `updateProfile` (uploads a new profile picture to Cloudinary and updates the user document). |
| `message.controller.js` | Handles all **messaging** operations: `getAllContacts` (returns all users except the logged-in user), `getChatPartners` (returns users the logged-in user has exchanged direct messages with, always pinning QuackAI at the top), `getMessagesByUserId` (fetches a direct message history between two users), `sendMessage` (saves a new message, emits it via Socket.IO to the receiver's connected sockets, and triggers the AI response pipeline if the receiver is QuackAI), `sendGroupMessage` (saves and broadcasts a group message to all members except the sender), and `getGroupMessages` (fetches all messages for a group, populating sender info). |
| `group.controller.js` | Handles **group chat** management: `createGroup` (validates the group name and minimum 3-member requirement, saves the group, and notifies all new members via Socket.IO `newGroup` event) and `getUserGroups` (returns all groups the authenticated user belongs to). |
| `ai.controller.js` | Handles the **QuackAI** response pipeline: `processAIMessage` is called asynchronously after a user sends a message to the QuackAI bot. It fetches the last 5 messages for conversation context, calls `generateAIResponse` from Gemini, saves the AI's reply as a new `Message` document, and emits it to the user via Socket.IO. |

---

## `routes/` — API Routing

Routes define URL patterns and attach middleware before delegating to controllers.

| File | Description |
|---|---|
| `auth.route.js` | Mounts auth endpoints under `/api/auth`. Public routes: `POST /signup`, `POST /login`, `POST /logout`. Protected routes (require `protectRoute` middleware): `PUT /update-profile`, `GET /check`. |
| `messages.route.js` | Mounts message endpoints under `/api/messages`. All routes are protected by `arcjetProtection` + `protectRoute`. Provides `GET /contacts`, `GET /chats`, `GET /:id`, `POST /send/:id`, `POST /send-group/:id`, `GET /group/:id`. |
| `group.route.js` | Mounts group endpoints under `/api/groups`. All routes are protected by `arcjetProtection` + `protectRoute`. Provides `POST /create` and `GET /`. |

---

## `models/` — MongoDB Data Models

Each file defines a Mongoose schema and exports a model for a MongoDB collection.

| File | Description |
|---|---|
| `User.js` | The **User** schema. Fields: `email` (unique, required), `fullName` (max 15 chars), `password` (required only for non-AI users, min 6 chars), `profilePic` (URL string, defaults to empty), `isAI` (boolean flag that distinguishes the QuackAI bot from real users). Includes `timestamps` for `createdAt` / `updatedAt`. |
| `Message.js` | The **Message** schema. Fields: `senderId` (ref User, required), `receiverId` (ref User, required only for direct messages), `groupId` (ref Group, required only for group messages), `text` (max 2000 chars), `image` (Cloudinary URL). A `pre-validate` hook enforces that exactly one of `receiverId` or `groupId` is provided. Includes compound indexes for fast query performance. |
| `Group.js` | The **Group** schema. Fields: `name` (max 15 chars), `avatar` (URL, defaults to a hosted duck image), `members` (array of User ObjectId references). Includes a `members` index for fast membership queries and `timestamps`. |

---

## `middleware/` — Express & Socket Middleware

| File | Description |
|---|---|
| `auth.middleware.js` | **`protectRoute`**: Reads the `jwt` HTTP-only cookie, verifies it with `jsonwebtoken`, fetches the user from the database, and attaches the user object to `req.user`. Returns 401 if the token is missing or invalid, 404 if the user is not found. Used on all protected REST routes. |
| `arcjet.middleware.js` | **`arcjetProtection`**: Runs each incoming request through the Arcjet security layer (configured in `lib/arcjet.js`). Returns 429 for rate-limit violations, 403 for detected or spoofed bots, and passes the request through on success. |
| `socket.auth.middleware.js` | **`socketAuthMiddleware`**: Applied to all Socket.IO connections. Extracts the `jwt` cookie from the socket handshake headers, verifies it, fetches the user, and attaches `socket.user` and `socket.userId`. Rejects the connection with an error if authentication fails. |

---

## `lib/` — Shared Utilities & Client Configurations

| File | Description |
|---|---|
| `env.js` | Loads environment variables using `dotenv` and re-exports them as a typed `ENV` object. All modules import from here instead of reading `process.env` directly, providing a single source of truth for all configuration keys (MongoDB URI, JWT secret, Cloudinary credentials, Arcjet key, Gemini API key, email settings, QuackAI credentials, etc.). |
| `db.js` | Exports `connectDB()`, which connects to MongoDB using `mongoose.connect()` with the URI from `ENV.MONGO_URI`. Logs the connected host on success, or exits the process with code 1 on failure. |
| `socket.js` | Creates the Express `app`, the `http.Server`, and the `Socket.IO` server instance. Applies `socketAuthMiddleware` to all connections. Maintains a `userSocketMap` (`{ userId: Set<socketId> }`) to track all active socket connections per user (supporting multi-tab). Handles `connection`, `disconnect`, and `setCurrentUser` events. Emits `getOnlineUsers` to all clients whenever the online user list changes. Exports `io`, `app`, `server`, and `getReceiverSocketId`. |
| `utils.js` | Exports `generateToken(userId, res)`, which signs a JWT (24-hour expiry) and sets it as an HTTP-only, `sameSite: strict` cookie on the response. Secure flag is enabled in production. |
| `gemini.js` | Initializes the **Google Gemini AI** client (`gemini-2.5-flash` model) using the `GEMINI_API_KEY`. Exports `initializeGemini()` (called once on startup) and `generateAIResponse(userMessage, conversationHistory)`, which builds a prompt with QuackAI's persona and returns the model's text response. Includes fallback messages if generation fails. |
| `seed.js` | Manages the **QuackAI** bot user. Exports `seedQuackAI()` (creates the QuackAI `User` document if it does not already exist) and `getQuackAI()` (retrieves the QuackAI user from the database). Called during server startup before the server begins listening. |
| `arcjet.js` | Configures and exports the **Arcjet** security client with three layered rules: `shield` (protects against OWASP attacks like SQL injection), `detectBot` (blocks all non-search-engine bots in LIVE mode), and `slidingWindow` (rate limit of 100 requests per 60 seconds). |
| `cloudinary.js` | Configures and exports the **Cloudinary v2** client using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` from `ENV`. Used by controllers to upload user profile pictures and message images. |
| `resend.js` | Configures and exports the **Resend** email client and sender identity (`{ email, name }`). Used by `emailHandlers.js` to send transactional emails. |

---

## `emails/` — Email Templates & Dispatching

| File | Description |
|---|---|
| `emailHandlers.js` | Exports `sendWelcomeEmail(email, name, clientURL)`, which uses the Resend client to send a welcome email to a newly registered user. Calls `createWelcomeEmailTemplate` to generate the HTML body. Throws an error if the send fails so the calling controller can handle it gracefully. |
| `emailTemplates.js` | Exports `createWelcomeEmailTemplate(name, clientURL)`, which returns an HTML string for the welcome email. The template is a branded, styled HTML email that greets the new user by name and includes a call-to-action link to the application. |
