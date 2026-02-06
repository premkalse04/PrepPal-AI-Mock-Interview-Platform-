# AI Mock Interview Platform

AI-assisted mock interview Platform web app: generate questions, record answers, and save sessions for review.

## Overview

This project is a lightweight React + Vite application that helps users practice interview scenarios using AI-generated questions and client-side recording (webcam and speech-to-text). It integrates with Firebase for authentication and storage and can use Google Generative AI to create dynamic interview prompts.

Why it was built
- To provide a quick, no-setup way for candidates to rehearse technical and behavioral interviews.
- To combine automated, varied question generation with simple recording and review workflows.

Who it’s for
- Job candidates practicing interviews
- Interview coaches and mentors
- Developers looking for an example of integrating AI, client recording, and Firebase in a modern frontend app

## Features

- AI-generated interview question sets (Google Generative AI)
- Webcam recording and optional speech-to-text transcription
- Save and review recorded sessions and transcripts
- User authentication (Firebase / third-party providers)
- Minimal, accessible UI built with Tailwind CSS
- Client-side validation and form flows via `react-hook-form`

## Tech Stack

Frontend
- React 18, Vite, JSX

Backend / Services
- Firebase (Authentication, Firestore, Storage)
- Google Generative AI (question generation)

Database
- Firestore (document store for sessions, user profiles)

Tools / Libraries
- Tailwind CSS
- `react-hook-form`, `zod` (validation)
- `react-webcam`, `react-hook-speech-to-text`
- `@clerk/clerk-react` (optional)
- ESLint, TypeScript (build step), Sonner (toasts), Radix UI primitives

## Architecture Overview

- Client (React + Vite) is the primary app and UI layer.
- User authenticates via Firebase (or configured auth provider).
- When a user starts a mock interview:
	- The client requests question prompts from Google Generative AI (API call).
	- The client records the candidate via `react-webcam` and optionally captures speech-to-text locally.
	- Completed session metadata, transcript and media are uploaded to Firebase Storage and Firestore.
- All persistent data lives in Firestore collections (for example `users/` and `sessions/`).

## Getting Started

Prerequisites
- Node.js 18+ (or latest LTS)
- pnpm (recommended) or npm/yarn
- A Firebase project with Auth and Firestore enabled
- Google Generative AI API key (if using question generation)

Installation

```bash
# clone
git clone https://github.com/premkalse04/ai-mock-interview.git
cd ai-mock-interview

# install deps (pnpm recommended)
pnpm install
```

## Environment Variables

Create a `.env` file in the project root (Vite requires `VITE_` prefix for client-exposed variables). Example:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Generative AI
VITE_GOOGLE_API_KEY=your_google_api_key

# Optional auth providers
VITE_CLERK_FRONTEND_API=your_clerk_frontend_api

# App settings
VITE_APP_NAME=AI Mock Interview Platform
```

Notes:
- Do not commit `.env` to source control.
- For server-only keys, keep them in server or platform secrets (do not use `VITE_` prefix).

## Running the Application

Development

```bash
pnpm dev
# open http://localhost:5173 (or the port shown by Vite)
```

Production build

```bash
pnpm build
pnpm preview
```

Lint

```bash
pnpm run lint
```

## API Reference (If Applicable)

This repo is primarily a frontend app using Firebase and third-party APIs. Example Firestore data model for a saved session:

Collection: `sessions`

Document structure (example)
```json
{
	"id": "generatedDocId",
	"userId": "userUid",
	"title": "System Design - Round 1",
	"questions": [
		{"q": "Explain how you would design a URL shortener", "notes": ""}
	],
	"transcript": "Full speech-to-text transcript",
	"recordingUrl": "https://storage.googleapis.com/...",
	"createdAt": "2025-12-25T12:00:00Z",
	"durationSeconds": 420,
	"score": null
}
```

Reading/writing sessions is done with the official Firebase SDK in `src/config` / `src/lib` helper functions.

## Folder Structure

Top-level overview:

```
.
├─ public/
│  ├─ assets/
│  └─ ...
├─ src/
│  ├─ assets/
│  ├─ components/
	│  ├─ add-interview-sheet.jsx
	│  ├─ container.jsx
	│  └─ ...
	├─ config/           # firebase.config.js, auth handlers
	├─ layouts/
	├─ lib/              # helpers.js, utils.js
	├─ provider/         # toast and auth providers
	├─ routes/           # pages (home, dashboard, mock-interview, etc.)
	├─ App.jsx
	└─ main.jsx
├─ package.json
├─ vite.config.js
└─ README.md
```

Key files to inspect
- `src/main.jsx` — application entry
- `src/App.jsx` — routing and layout
- `src/config/firebase.config.js` — Firebase initialization
- `src/lib/helpers.js` — utility helpers

## Deployment

Recommended platforms
- Vercel (static frontend, env vars configured via dashboard)
- Netlify
- Firebase Hosting

General steps (Vercel example)
1. Push repo to GitHub.
2. Create a Vercel project and import the repo.
3. Set environment variables in the project settings (use the same keys as `.env`).
4. Build command: `pnpm build`
5. Output directory: (Vite defaults—Vercel auto-detects) or use `dist`.

Netlify / Firebase Hosting have similar flows: set env vars in the dashboard and use `pnpm build` as the build step.

## Future Improvements

- Add server-side proxy for Google Generative AI to keep API keys secret
- CI/CD with tests and linting (GitHub Actions)
- Add per-question timing, scoring rubric, and analytics dashboard
- Export session summaries and transcripts (PDF / shareable links)
- User roles: coach vs candidate with shared session review
- Offline-first recording and resumable uploads

## Contribution Guidelines

- Fork the repository and open a pull request against `main`.
- Create feature branches named `feat/<short-desc>` or `fix/<short-desc>`.
- Code style:
	- Follow existing ESLint rules and project conventions
	- Keep components small and focused
	- Use `react-hook-form` for form state and `zod` for validation where applicable
- Run tests and linter before submitting:
```bash
pnpm install
pnpm run lint
```
- Write clear PR descriptions and link related issues.

## License

This repository is permissively licensed. Add a `LICENSE` file (MIT recommended). If you want a specific license now, replace this section accordingly.

