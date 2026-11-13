# AvodahLoans — loan search & comparison site

```
frontend/   React 19 + Vite + Tailwind CSS v4 + React Router, GSAP + Lenis
backend/    Node + Express + Mongoose (MongoDB) API: lenders, offer matching, OTP login, dashboard data, lead forms
```

```bash
npm run install:all   # installs both
npm --prefix backend run seed   # loads the lender catalogue into MongoDB (safe to re-run)
npm run dev:backend   # API on http://localhost:4000   (terminal 1)
npm run dev:frontend  # site on http://localhost:5173  (terminal 2) — /api is proxied to the backend
npm run build         # builds frontend/dist
```

Backend config lives in `backend/.env` (copy from `backend/.env.example`): `MONGO_DB_URI`, `MONGO_DB_NAME` (default `avodahloans`), `PORT`, `CORS_ORIGIN`, `OTP_DEMO`. Mongoose models are in `backend/src/models/index.js`: Lender, User, Otp, Session, Activity, Application, Lead.

## API (`backend/src/routes/`)
| Method & path | What it does |
|---|---|
| `GET /api/loan-types`, `/api/employment-types` | Product + employment lists |
| `GET /api/lenders?kind=&type=` | Lender directory |
| `GET /api/lenders/:id` | One lender + prev/next, eligibility, documents |
| `GET /api/offers?type=&amount=&tenure=&income=` | Matched offers with EMI + eligibility (FOIR 50%) |
| `POST /api/emi` | EMI, total payment, total interest |
| `POST /api/auth/otp`, `/api/auth/verify` | Mobile OTP login → bearer token (`OTP_DEMO=true` accepts any 6 digits) |
| `GET /api/auth/me`, `POST /api/auth/logout` | Session |
| `GET/PUT /api/me/activity`, `POST /api/me/activity/:list`, `PATCH /api/me/profile` | Dashboard data (login required) |
| `POST/GET /api/applications` | Apply to an offer / list my applications |
| `POST /api/leads/callback`, `/api/leads/credit-report` | Public lead forms |

The frontend client for all of these is `frontend/src/lib/api.js`. The pages still use the local `lib/` modules; switch them to `api.*` calls page by page.

## Pages
| Route | What it does |
|---|---|
| `/` | Home: hero search widget (7 loan types), stats, loan products, lender strip, how-it-works, EMI calculator, FAQ |
| `/search?type=home` | Step flow: loan type → employment type → details (amount, tenure, pincode, annual income) |
| `/offers?...` | Matching animation, then lender offers: sort, filter sheet (rate of interest / lender type / lenders), save, compare (up to 3), show details, apply |
| `/dashboard` | Logged-in dashboard: overview tiles, applications + status, saved offers, search history, requests, profile |
| `/lenders` | Directory of all lenders, filterable by PVT Bank / PSU Bank / HFC / NBFC |
| `/lenders/:id` | One page per lender: rates per loan type, EMI estimate, rate card, eligibility, documents, previous/next lender |
| `/login` | Mobile + OTP login (demo — any 6 digits) |
| `/emi-calculator` | EMI calculator + formula |
| `/credit-score` | Interactive score gauge + free report request form |
| `/support` | Searchable help centre, contact options, callback form |

Every step lives in the URL, so the browser back button and shared links work.

## Where things live
- `frontend/src/lib/loans.js` – loan types, employment types, **lender catalogue and offer matching** (`getOffers`)
- `frontend/src/lib/content.js` – marketing copy, FAQs, testimonials, contact details
- `frontend/src/lib/auth.jsx` – front-end-only session (replace with real OTP auth)
- `frontend/src/lib/activity.js` – per-user activity log behind the dashboard (stored in this browser; replace with API)
- `frontend/src/lib/motion.js` – GSAP + Lenis setup; `src/lib/emi.js` – EMI maths
- `frontend/src/pages/` – one file per route; `src/components/` – shared sections

## Before launch
- Lender rates, limits and features in `loans.js` are **sample data** — replace with live data from the API.
- Phone/email in `CONTACT` are placeholders from the reference repo.
- Login OTP, eligibility, credit report, callback and "Apply" are simulated on the front end — wire them to the backend.
- The hero photo is hot-linked from Unsplash; download it into `public/` (or use your own) for production.
