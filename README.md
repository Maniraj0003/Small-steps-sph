Small Steps (Small-steps-sph)

This repository contains a simple static frontend and a Node/Express backend (SQLite) for a small project connecting landowners and tenants.

Quick start (development)

1. Start the backend:
   cd backend
   npm install
   npm start
   # Backend listens on http://localhost:5000

2. Serve the static frontend (from the docs folder):
   # Option A (recommended):
   npx http-server docs -p 8080
   # Option B (Python):
   python3 -m http.server --directory docs 8080
   # Then open http://localhost:8080 in your browser.

Notes
- The frontend uses a configurable API base URL. By default it points to http://localhost:5000 when running locally.
  You can set the backend URL for the hosted site by inserting a small script before the main page script in docs/index.html, for example:

  <script>window.API_BASE_URL = 'https://your-backend.example.com';</script>

  The frontend will use window.API_BASE_URL when present; otherwise it falls back to localhost for development.
- For GitHub Pages: the static site is in the docs/ folder. Enable Pages in repository settings: Branch: main, Folder: /docs.
- The backend uses a local SQLite DB at backend/smallsteps.db.
- This repository includes minimal security defaults for development (CORS wide open, JWT secret in code). Change before production.

Useful scripts from repo root
- npm run start-backend  # starts backend
- npm run serve-docs     # serves docs on port 8080 (requires npx/http-server)

Next recommended improvements
- Make frontend API base URL configurable so the client works with a deployed backend.
- Move JWT secret to environment variables.
- Deploy backend to a hosting provider (Render, Railway, Heroku, etc.) and update frontend fetch URLs to the deployed URL.
- Run `npm audit` and review vulnerabilities before forcing fixes.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
