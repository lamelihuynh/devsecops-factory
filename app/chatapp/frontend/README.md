# Frontend

This folder contains the **React-based client application** for QuackChat. It is a Single-Page Application (SPA) built with **React**, **Vite**, and **TailwindCSS**, communicating with the backend via REST API and WebSockets (Socket.IO).

---

## Folder Structure

```
frontend/
├── public/                  # Static assets served directly by Vite
│   ├── avatar.png           # Default user avatar image
│   ├── duck.png             # Duck brand/logo image
│   ├── login.png            # Background image for the Login page
│   ├── signup.png           # Background image for the Sign Up page
│   ├── vite.svg             # Vite framework logo (default)
│   └── sounds/              # Audio files for UI sound effects
├── src/                     # All application source code (see src/README.md)
├── index.html               # HTML entry point — mounts the React app at <div id="root">
├── package.json             # Project dependencies and npm scripts
├── package-lock.json        # Locked dependency versions for reproducible installs
├── vite.config.js           # Vite bundler configuration (dev server, proxy, plugins)
├── tailwind.config.js       # TailwindCSS theme and content path configuration
├── postcss.config.js        # PostCSS configuration (required by TailwindCSS pipeline)
├── eslint.config.js         # ESLint rules for code quality and React best practices
└── .gitignore               # Files and directories excluded from version control
```

---

## Key Files

| File | Purpose |
|---|---|
| `index.html` | The HTML shell for the SPA. Vite injects the compiled JS bundle here. The single `<div id="root">` is where React mounts the entire application. |
| `vite.config.js` | Configures the Vite dev server and build process. Enables the React plugin for JSX transformation. |
| `tailwind.config.js` | Configures TailwindCSS — defines the `content` glob so Tailwind can tree-shake unused styles in production. |
| `postcss.config.js` | Required PostCSS config that integrates TailwindCSS and Autoprefixer into the CSS pipeline. |
| `eslint.config.js` | ESLint configuration that enforces code style, React best practices, and react-hooks rules. |
| `package.json` | Lists all npm dependencies (React, Vite, Zustand, Socket.IO client, etc.) and defines scripts like `dev`, `build`, and `preview`. |

---

## Tech Stack

- **React 18** — UI component library
- **Vite** — Fast build tool and dev server
- **TailwindCSS** — Utility-first CSS framework
- **Zustand** — Lightweight state management
- **Socket.IO Client** — Real-time bidirectional communication with the backend
- **Axios** — HTTP client for REST API calls
- **React Router** — Client-side routing
- **React Hot Toast** — Toast notification system
- **Lucide React** — Icon library
