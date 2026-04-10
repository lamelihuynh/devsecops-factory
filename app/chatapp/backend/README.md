# Backend

This folder contains the **Node.js/Express server** for QuackChat. It handles authentication, messaging, group management, real-time socket communication, and AI-powered chat via Google Gemini. Data is persisted in **MongoDB** via Mongoose.

---

## Folder Structure

```
backend/
├── src/                     # All server source code (see src/README.md)
├── package.json             # Project dependencies and npm scripts
├── package-lock.json        # Locked dependency versions for reproducible installs
└── .env                     # Environment variables (not committed to git)
```

---

## Key Files

| File | Purpose |
|---|---|
| `package.json` | Lists all npm dependencies (Express, Mongoose, Socket.IO, bcryptjs, JWT, Cloudinary, Arcjet, Resend, Gemini SDK, etc.) and defines the `start` / `dev` scripts. |
| `.env` | Stores secret keys and configuration for MongoDB, JWT, Cloudinary, Resend email, Arcjet security, and Google Gemini. **Never commit this file.** |

---

## Tech Stack

- **Node.js + Express** — HTTP server and REST API framework
- **Socket.IO** — Real-time WebSocket server for live messaging
- **MongoDB + Mongoose** — NoSQL database and ODM
- **bcryptjs** — Password hashing
- **jsonwebtoken (JWT)** — Stateless authentication via HTTP-only cookies
- **Cloudinary** — Cloud image hosting for profile pictures and message images
- **Resend** — Transactional email service for welcome emails
- **Arcjet** — Security layer: rate limiting, bot detection, and shield protection
- **Google Gemini AI** (`@google/generative-ai`) — Powers the QuackAI chatbot feature
- **dotenv** — Environment variable loading

---

## API Overview

| Prefix | Description |
|---|---|
| `POST /api/auth/signup` | Register a new user |
| `POST /api/auth/login` | Authenticate and receive a JWT cookie |
| `POST /api/auth/logout` | Clear the JWT cookie |
| `PUT /api/auth/update-profile` | Update user profile picture |
| `GET /api/auth/check` | Verify current authentication status |
| `GET /api/messages/contacts` | Get all registered users |
| `GET /api/messages/chats` | Get current user's chat partners |
| `GET /api/messages/:id` | Get direct messages with a specific user |
| `POST /api/messages/send/:id` | Send a direct message |
| `GET /api/messages/group/:id` | Get messages for a group |
| `POST /api/messages/send-group/:id` | Send a message to a group |
| `POST /api/groups/create` | Create a new group |
| `GET /api/groups` | Get all groups the current user belongs to |
