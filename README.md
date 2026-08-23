# RAAHAT — Figma Make implementation + backend

This project now uses the actual exported Figma Make React source: all public, user, assessment and administration screens are in `src/`.

## Run in VS Code

Install dependencies once:

```powershell
npm install
```

Open **two VS Code terminals**:

```powershell
# Terminal 1 — backend and AI API
npm run server

# Terminal 2 — exact Figma React frontend
npm run dev
```

Open the Vite address printed in Terminal 2 (normally `http://localhost:8443`). The frontend proxies `/api` calls to the backend at port `3000`.

## AI

The app works without credentials using a safety-oriented local assessment fallback. To enable a real model, copy `.env.example` to `.env`, set `OPENAI_API_KEY`, then restart the backend. The key remains server-side. The API uses the Responses endpoint and asks the model for structured assessment output; it is designed to provide support recommendations and never medical diagnoses or autonomous emergency action.

## API

- `GET /api/health`
- `GET /api/cases`
- `POST /api/auth/login`
- `POST /api/ai/assess` with `{ "text": "..." }`
- `POST /api/support-request`
