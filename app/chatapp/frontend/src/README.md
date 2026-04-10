# `src/` — Frontend Source Code

This folder contains all the application source code for the QuackChat React frontend.

---

## Folder & File Overview

```
src/
├── App.jsx          # Root component — defines routes and app-level layout
├── main.jsx         # React entry point — bootstraps the app into the DOM
├── index.css        # Global CSS styles and TailwindCSS base imports
├── components/      # Reusable UI components
├── pages/           # Top-level page components (one per route)
├── store/           # Zustand global state stores
├── hooks/           # Custom React hooks
└── lib/             # Utility/configuration modules
```

---

## Root Files

| File | Description |
|---|---|
| `main.jsx` | The application entry point. Calls `createRoot` to mount the React app to `index.html`'s `<div id="root">`. Wraps the app with `<BrowserRouter>` for client-side routing and `<StrictMode>` for development warnings. |
| `App.jsx` | The root React component. Calls `checkAuth()` on mount to verify the user's session. Defines the three client-side routes (`/`, `/login`, `/signup`) with redirect guards — unauthenticated users cannot access the chat page, and authenticated users are redirected away from login/signup. Also renders the `<Toaster>` for toast notifications and a decorative background. |
| `index.css` | Global stylesheet. Imports TailwindCSS base, components, and utility layers. Defines any custom global styles. |

---

## `components/` — Reusable UI Components

Each file is a focused React component used across one or more pages.

| File | Description |
|---|---|
| `ActiveTabSwitch.jsx` | A toggle tab bar that switches the left sidebar between the **Chats** and **Contacts** tabs, updating `activeTab` in `useChatStore`. |
| `BorderAnimatedContainer.jsx` | A decorative container wrapper that renders an animated glowing border (amber/gold) around its children, used to highlight active or selected UI panels. |
| `ChatContainer.jsx` | The main chat panel. Displays the message history for the currently selected chat (user or group), shows a loading skeleton while fetching, and subscribes to real-time incoming messages via Socket.IO. Scrolls to the latest message automatically. |
| `ChatHeader.jsx` | The header bar shown at the top of the open chat. Displays the selected contact/group name, avatar, and online status. Contains a button to close the current chat. |
| `ChatsList.jsx` | The sidebar list of active chat partners and groups. Fetches and renders the user's chat history. Clicking a chat selects it and loads its messages. Also renders the `GroupCreationModal` trigger. |
| `ContactList.jsx` | The sidebar list of all registered users (the "Contacts" tab). Allows a user to start a new conversation with any contact. |
| `GroupCreationModal.jsx` | A modal dialog for creating a new group chat. Lets the user name the group and select members from their contacts. Validates that at least 3 members are chosen before submitting. |
| `MessageInput.jsx` | The chat input bar at the bottom of `ChatContainer`. Handles text input and optional image attachment (base64 preview). Plays a random keystroke sound on each keypress (if sound is enabled). Sends the message on Enter or button click. |
| `MessagesLoadingSkeleton.jsx` | A placeholder skeleton UI displayed while messages are being fetched from the API, preventing layout shift. |
| `NoChatHistoryPlaceholder.jsx` | An empty-state illustration shown inside the `ChatContainer` when a conversation has no messages yet. Prompts the user to send the first message. |
| `NoChatsFound.jsx` | An empty-state placeholder shown in `ChatsList` when the user has no existing chats or the search/filter yields no results. |
| `NoConversationPlaceholder.jsx` | The default landing view for the right panel when no chat is selected. Displays a welcome message encouraging the user to pick a conversation. |
| `PageLoader.jsx` | A full-screen loading spinner shown while the app is checking the user's authentication status on initial load. |
| `ProfileHeader.jsx` | The header of the left sidebar panel. Shows the logged-in user's avatar, name, and a settings panel with buttons to toggle sound effects and log out. |
| `Toolbar.jsx` | The narrow icon toolbar on the far left of the chat layout. Contains navigation icons (e.g., to switch to contacts view) and displays the active user's avatar. |
| `UsersLoadingSkeleton.jsx` | A skeleton placeholder displayed in `ChatsList` or `ContactList` while the user/contact list is being loaded from the API. |

---

## `pages/` — Page Components

Each file corresponds to a full-page view mapped to a route in `App.jsx`.

| File | Description |
|---|---|
| `ChatPage.jsx` | The main authenticated chat interface. Renders the full layout: `Toolbar`, `ProfileHeader`, `ActiveTabSwitch`, `ChatsList` / `ContactList`, and `ChatContainer` (or `NoConversationPlaceholder` when nothing is selected). Subscribes to global messages for real-time sidebar updates. |
| `LogInPage.jsx` | The login page. Contains a form for email/password input with validation. On success, calls `useAuthStore.login()` which sets the auth user and redirects to the chat page. |
| `SignUpPage.jsx` | The sign-up / registration page. Contains a form for full name, email, and password with client-side validation. On success, calls `useAuthStore.signup()` which creates the account and navigates to the chat page. |

---

## `store/` — Global State (Zustand)

Zustand stores manage all shared application state.

| File | Description |
|---|---|
| `useAuthStore.js` | Manages **authentication state**: the logged-in user (`authUser`), loading flags (`isCheckingAuth`, `isLoggingIn`, `isSigningUp`), the Socket.IO connection (`socket`), and the list of online users. Provides actions: `checkAuth`, `signup`, `login`, `logout`, `updateProfile`, `connectSocket`, `disconnectSocket`, and `subscribeToAuthChanges` (which syncs auth across multiple browser tabs via the `storage` event). |
| `useChatStore.js` | Manages **chat state**: all contacts, active chats, messages, selected user/group, active sidebar tab, group list, and sound settings. Provides actions for fetching data (`getAllContacts`, `getMyChatPartners`, `getMessagesByUserId`), sending messages (`sendMessage`), real-time subscriptions (`subscribeToMessages`, `subscribeToGlobalMessages`), group management (`createGroup`, `getUserGroups`), and resetting state on logout (`resetChatState`). Implements optimistic UI updates for outgoing messages. |

---

## `hooks/` — Custom React Hooks

| File | Description |
|---|---|
| `useKeyboardSound.js` | A custom hook that pre-loads four keystroke audio files and exposes a `playRandomKeyStrokeSound()` function. Used by `MessageInput` to play a random click sound on each keypress for an immersive typing experience. |

---

## `lib/` — Utility & Configuration Modules

| File | Description |
|---|---|
| `axios.js` | Creates and exports a pre-configured **Axios instance** (`axiosInstance`) with the correct `baseURL` (`http://localhost:3000/api` in development, `/api` in production) and `withCredentials: true` so HTTP-only JWT cookies are automatically sent with every request. |
