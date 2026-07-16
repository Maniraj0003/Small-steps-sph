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
- Move JWT secret to environment variables. The backend now reads the JWT secret and port from environment variables; see backend/.env.example.
- Deploy backend to a hosting provider (Render, Railway, Heroku, etc.) and update frontend fetch URLs to the deployed URL. See the "Deployment (Render)" section below.
- Run `npm audit` and review vulnerabilities before forcing fixes.

Deployment (Render - recommended for quick Node hosting)

1. Connect this GitHub repository to Render (https://render.com) and create a new Web Service.
2. Use the example render.yaml in the repo for an automated setup, or configure manually:
   - Build command: cd backend && npm install
   - Start command: cd backend && npm start
   - Set environment variables on Render: JWT_SECRET (set a strong secret), DB_PATH (e.g. /data/smallsteps.db)
   - Add a persistent disk or mount `/data` so the SQLite DB file persists between restarts if you keep using SQLite.
3. After backend is deployed, note the backend URL (e.g., https://small-steps-backend.onrender.com).
4. Configure the frontend to call the deployed backend by adding this to docs/index.html before the main script (or by editing the file):
   <script>window.API_BASE_URL = 'https://your-backend-on-render.example.com';</script>
5. Deploy the frontend by connecting the repo to Vercel (or GitHub Pages). If using Vercel, set the output directory to /docs. For GitHub Pages, enable Pages in repo settings using Branch: main and Folder: /docs.

Notes about production
- For production use, consider moving from SQLite to a managed DB (Postgres) to avoid data loss and enable concurrent access. If you use SQLite, make sure the hosting provider provides persistent storage that survives restarts.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
