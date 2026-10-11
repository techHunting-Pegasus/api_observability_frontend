# API Observability Dashboard

Next.js (App Router) + TypeScript + Tailwind. Talks to the real backend, no mock data.

## Run
```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=https://api-observability-backend.onrender.com
npm run dev                  # http://localhost:3000
```
Render free tier cold start ho sakta hai: pehli request 30-60s tak slow ho sakti hai.

## Structure
- `src/lib/api/` — `client.ts` (base URL, JWT header, 401 handling), `auth.ts`, `projects.ts`, `logs.ts`
- `src/lib/session.ts` — token + user persisted in localStorage
- `src/features/{auth,projects,logs}` — feature components (CurlPanel, JsonViewer, LogTable, dialogs...)
- `src/components/ui` — Button, Modal/ConfirmDialog, Toast, Skeleton, Empty/Error states
- `src/app` — routes: `/login`, `/signup`, `/dashboard`, `/projects/[projectId]`, `/projects/[projectId]/logs/[requestId]`

## Notes
- Sirf JWT use hota hai; `X-API-Key` dashboard me kabhi nahi.
- Koi bhi 401 (authenticated) → session clear → `/login`.
- Project API key sirf create dialog ke state me rehti hai, kahin persist nahi hoti.
- Backend me single-project GET nahi hai, isliye project name/bundle ID `GET /projects` list se nikalte hain.
- Search/sort client-side hai (loaded ≤100 logs par); `useAsync` + `filterAndSort` ko swap karke server-side pagination baad me add ho sakti hai.
