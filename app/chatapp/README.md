# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Socket.IO, and MongoDB.
## Live Demo

**Deployment:** [Sevalla](https://chatapp-brhgd.sevalla.app/)

---

## Features

### Core Functionality

- **Real-time Messaging**: Instant message delivery using Socket.IO
- **Group Chats**: Create and manage group conversations with 3+ members
- **QuackAI Chatbot**: Integrate Google Gemini AI
- **Multi-Tab Support**: Synchronized state across multiple browser tabs and devices
- **Online Status**: Real-time online/offline user presence
- **Modern UI**: Responsive design with TailwindCSS and daisyUI
- **Secure Authentication**: JWT-based authentication with HTTP-only cookies
- **Image Sharing**: Upload and share images via Cloudinary
- **Sound enabling**: Users can enable app sound
- **Sound Notifications**: Optional audio alerts for new messages (toggleable)
- **Welcome Emails**: Automated welcome emails via Resend
- **Swichable Avatar**: Users can change their profile picture


### Technical Features

- **Rate Limiting & Bot Protection**: Powered by Arcjet for abuse protection
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Persistent Storage**: MongoDB for data persistence
- **State Management**: Zustand for efficient React state management
- **Real-time Sync**: WebSocket connections for instant updates
---

## Architecture

### Tech Stack

#### Backend

- **Runtime:** Node.js (>=20.0.0)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time Communication:** Socket.IO
- **Password Hashing:** bcryptjs
- **Email Service:** Resend
- **Image Storage:** Cloudinary
- **AI Service:** Google Gemini (gemini-2.5-flash)
- **Security:** Arcjet (rate limiting & bot detection)
- **Development:** Nodemon for hot reloading

#### Frontend

- **Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router v7
- **CSS Framework:** TailwindCSS v3
- **Component Library:** daisyUI
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Real-time Client:** Socket.IO Client
- **Notifications:** React Hot Toast
- **Icons:** Lucide React

---

## Project Structure

```
chatapp/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── message.controller.js
│   │   │   ├── group.controller.js
│   │   │   └── ai.controller.js
│   │   ├── emails/           # Email templates
│   │   │   └── emailTemplate.js
│   │   ├── lib/              # Core libraries
│   │   │   ├── cloudinary.js  # Image upload config
│   │   │   ├── db.js         # MongoDB connection
│   │   │   ├── gemini.js     # Google Gemini AI integration
│   │   │   ├── seed.js       # QuackAI initialization
│   │   │   ├── socket.js     # Socket.IO setup
│   │   │   └── utils.js      # Helper functions
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   └── arcjet.middleware.js  # Rate limiting
│   │   ├── models/           # MongoDB schemas
│   │   │   ├── user.model.js
│   │   │   ├── message.model.js
│   │   │   └── group.model.js
│   │   ├── routes/           # API routes
│   │   │   ├── auth.route.js
│   │   │   ├── message.route.js
│   │   │   └── group.route.js
│   │   └── server.js         # Application entry point
│   ├── package.json
│   └── .env                  # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── ChatsList.jsx
│   │   │   ├── ContactList.jsx
│   │   │   └── ... (14 components total)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Frontend utilities
│   │   │   └── axios.js      # Axios configuration
│   │   ├── pages/            # Page components
│   │   │   ├── ChatPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignUpPage.jsx
│   │   ├── store/            # Zustand state stores
│   │   │   ├── useAuthStore.js   # Authentication state
│   │   │   └── useChatStore.js   # Chat state
│   │   ├── App.jsx           # Root component
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── package.json              # Root package.json for deployment
└── README.md                 # This file
```

---
## Installation & Setup

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- MongoDB database (local or Atlas)
- Cloudinary account
- Resend account (for emails)
- Arcjet account (for security)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chatapp
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend Email
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="email_powered_by_resend"
EMAIL_FROM_NAME="expected_name"

# Arcjet
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development

# URL for welcome email
CLIENT_URL=http://localhost:5173

# Key for Gemini AI
GEMINI_API_KEY=your_key
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory (if needed):

```env
VITE_API_URL=http://localhost:5000
```

### 4. Run the Application

**Development Mode:**

Terminal 1 (Backend):

```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):

```bash
cd frontend
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

**Production Build:**

From the root directory:

```bash
npm run build   # Builds both frontend and backend
npm start       # Starts production server
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /signup` - Register a new user
- `POST /login` - Login with email and password
- `POST /logout` - Logout current user
- `GET /check` - Check authentication status
- `PUT /update-profile` - Update user profile picture

### Message Routes (`/api/messages`)

- `GET /contacts` - Get all available contacts
- `GET /chats` - Get user's chat partners
- `GET /:userId` - Get messages with a specific user
- `POST /send/:userId` - Send a message to a user
- `POST /send-group/:groupId` - Send a message to a group
- `GET /group/:groupId` - Get messages from a group

### Group Routes (`/api/groups`)

- `POST /create` - Create a new group (min 3 members)
- `GET /` - Get all groups where user is a member

### Socket.IO Events

- **Client → Server:**
  - `setCurrentUser` - Register user's socket connection
- **Server → Client:**
  - `getOnlineUsers` - Broadcast online users list
  - `newMessage` - Notify about new messages (individual or group)
  - `newGroup` - Notify members about new group creation
  - `currentUserConfirmed` - Confirm socket registration

---

## Key Components

### Frontend Components

#### State Management (Zustand Stores)

- **`useAuthStore`** - Manages authentication state, socket connections, and cross-tab synchronization
- **`useChatStore`** - Manages chat state, messages, contacts, and real-time subscriptions

#### Main Pages

- **`ChatPage`** - Main chat interface with sidebar and message view
- **`LoginPage`** - User login form
- **`SignUpPage`** - User registration form

#### UI Components

- **`ChatContainer`** - Message display and input
- **`ChatHeader`** - Chat header with user info
- **`ChatsList`** - List of active conversations
- **`ContactList`** - List of all available users
- **`ProfileHeader`** - User profile display in sidebar

### Backend Architecture

#### Controllers

- **`auth.controller`** - Authentication logic (signup, login, logout, profile)
- **`message.controller`** - Message handling (send, retrieve, contacts)

#### Models

- **`User`** - User schema with authentication fields
- **`Message`** - Message schema with sender/receiver references

#### Middleware

- **`protectRoute`** - JWT authentication verification
- **`arcjetMiddleware`** - Rate limiting and bot protection

---

## Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **HTTP-Only Cookies** - Prevents XSS attacks on tokens
3. **Password Hashing** - bcryptjs for secure password storage
4. **Rate Limiting** - Arcjet protection against abuse
5. **Bot Detection** - Automated threat detection via Arcjet
6. **CORS Configuration** - Controlled cross-origin access
7. **Input Validation** - Server-side validation of all inputs

---

## External Services

### Deployment

**Sevalla** - https://app.sevalla.com

- Full-stack hosting platform

### Backend Services

- **MongoDB** - https://cloud.mongodb.com/ (Database)
- **Cloudinary** - https://console.cloudinary.com (Image storage)
- **Resend** - https://resend.com (Email delivery)
- **Arcjet** - https://app.arcjet.com (Security & rate limiting)

### Frontend Tools

- **TailwindCSS** - https://v3.tailwindcss.com/docs/installation
- **daisyUI** - https://daisyui.com/

### Testing

- **Postman** - API endpoint testing

---

## Development Workflow

### Running Tests

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Building for Production

```bash
# From root directory
npm run build
```

### Linting

```bash
cd frontend
npm run lint
```
---

## License

ISC

---

## Author

Loi Bui

---

## Acknowledgments

- Socket.IO for real-time capabilities
- MongoDB for flexible data storage
- Cloudinary for image management
- Resend for reliable email delivery
- Arcjet for security infrastructure
