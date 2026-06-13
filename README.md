# BUDGET 2026 // E. Reyes Personal Ledger

[![Open in Google AI Studio](https://img.shields.io/badge/Open%20in-Google%20AI%20Studio-blue?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/apps/00f77151-1164-45b4-972d-ae74891f1118?showPreview=true&showAssistant=true)

BUDGET 2026 is a premium, single-user full-stack personal budget tracker ledger designed to control monthly allocations, trace auxiliary transactions, monitor specific savings targets, and visualize dynamic financial distributions.

## Tech Stack

- **Client**: React 18, Vite, TypeScript, Tailwind CSS
- **Server**: Node.js & Express (dev environment), Vercel serverless TypeScript handlers (production environment)
- **Database**: Firebase Admin SDK (Cloud Firestore)
- **Authentication**: Stateless server-signed JSON Web Tokens (JWT)

---

## Configuration & Environment Variables

Create a secure `.env` file in the project workspace root with these parameters:

```env
# Required secure encryption secret to sign and verify user JWTs
JWT_SECRET="YOUR_ENCRYPTION_SECRET_KEY"

# Firebase Config JSON object string initialized server-side via cert methods
FIREBASE_CONFIG='{"type": "service_account", "project_id": "...", "private_key_id": "...", "private_key": "...", "client_email": "..."}'
```

*Note: If no `FIREBASE_CONFIG` is defined, the engine automatically falls back to an offline local JSON file storage (`local-budget-db.json`) inside the workspace root. This ensures the application starts instantly and operates perfectly out-of-the-box for development and sandbox previews.*

---

## Folder Architecture

```
├── api/                   # Serverless handler functions (Vercel Node runtime)
│   ├── shared.ts          # Common DB & Auth utilities
│   ├── auth.ts            # Password verification & token issuer
│   ├── expenses.ts        # GET/POST endpoints for expense entries
│   ├── expenses/[id].ts   # PUT/DELETE specific expense actions
│   ├── income.ts          # GET/POST endpoints for extra incomes
│   ├── income/[id].ts     # DELETE manual income entries
│   ├── stats.ts           # Aggregated statistics computation
│   ├── settings.ts        # View/Control system configurations
│   └── budget-limits.ts   # Fetch and update category specific ceilings
├── src/                   # Client application codebase (Vite React TypeScript)
│   ├── main.tsx           # Entry coordinate
│   ├── App.tsx            # Main state manager
│   ├── types.ts           # Central interface definitions
│   ├── lib/
│   │   ├── api.ts         # Client communication wrapper
│   │   └── utils.ts       # Layout constants & formatters
│   ├── components/        # Isolated visual components
│   └── pages/             # Access and Overview views
├── server.ts              # Local Express development proxy
└── vercel.json            # Vercel Serverless routing instructions
```

---

## Local Development Execution

```bash
# 1. Install dependencies
npm install

# 2. Boot Express full-stack dev server (port 3000)
npm run dev

# 3. Compile client and bundle server matching production targets
npm run build
```
