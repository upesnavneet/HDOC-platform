# HDOC Platform — ACM 100 Days of Code

A web platform for the **UPES ACM & ACM-W Student Chapters** 100 Days of Code challenge. Participants submit daily coding solutions, compete on a leaderboard, and coordinators manage challenges, grading, and debugging rounds — all in real time.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Routing | React Router v7 |
| Backend / Auth | Firebase (Auth, Firestore) |
| Animations | GSAP, OGL, Three.js |
| Hosting | Netlify |

---

## Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9
- **Firebase CLI** — `npm install -g firebase-tools` (only for emulator usage)

---

## Local Development Setup

```bash
# 1. Clone the repo
git clone https://github.com/gaurangiigarg/HDOC-platform.git
cd HDOC-platform

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and fill in values from Firebase Console → Project Settings → Your Apps

# 4. (Optional) Start Firebase emulators for local development
#    Set VITE_USE_EMULATORS=true in .env.local first
firebase emulators:start

# 5. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

All variables are documented in [`.env.example`](.env.example). Values come from **Firebase Console → Project Settings → Your Apps**. Never commit real values to the repository.

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain (e.g., `project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_USE_EMULATORS` | Set to `true` to use local Firebase emulators |

---

## Admin / Coordinator Setup

Admin access is granted by setting a **Firebase Custom Claim** on the user's Auth account. There is no in-app admin creation — only 2–3 coordinators are needed.

### Granting admin access

1. Ensure you have the Firebase Admin SDK configured, or use the Firebase CLI with the project's service account.
2. Run the following one-off script (replace `<USER_UID>` with the target user's UID from Firebase Auth):

```bash
node -e "
  const admin = require('firebase-admin');
  admin.initializeApp();
  admin.auth().setCustomUserClaims('<USER_UID>', { admin: true })
    .then(() => console.log('Admin claim set.'))
    .catch(console.error);
"
```

3. The user must **sign out and sign back in** for the new claim to take effect.

---

## Deployment

Deployment is via **Netlify**. The `netlify.toml` at the repo root configures the build:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Environment variables | Same as `.env.example` — set these in Netlify Dashboard → Site Settings → Environment Variables |

### Deploy manually

```bash
# Build production bundle
npm run build

# Preview locally
npm run preview
```

---

## Project Structure

```
src/
├── views/              # Page-level components (Dashboard, Profile, Leaderboards, etc.)
├── features/           # Feature modules (coordinator dashboard + tabs)
├── context/            # Global state (AuthContext, DataContext, AppActionsContext)
├── services/           # Firestore CRUD operations (userService, completionService, etc.)
├── routes/             # Route definitions (AppRoutes) and guards (ProtectedRoute, AdminRoute)
├── hooks/              # Custom hooks (useLeaderboard, useAsyncAction, etc.)
├── components/         # Shared UI components (Navbar, ErrorBoundary, Shuffle, etc.)
├── utils/              # Utilities (logger, dateFormat, seedFirestore)
├── index.css           # Global styles and design tokens
└── main.jsx            # Application entry point

firestore.rules         # Firestore security rules (schema validation, auth checks)
netlify.toml            # Netlify build + redirect + security header config
.env.example            # Environment variable template
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
