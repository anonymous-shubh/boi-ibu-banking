# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Type-check with tsc -b, then Vite production build → dist/
npm run lint       # ESLint across all src files
npm run preview    # Serve the dist/ folder locally after a build
```

There are no tests. `npm run build` is the canonical correctness check — it runs `tsc -b` first, so TypeScript errors abort the build before Vite runs.

## Architecture

### State management

Two React Context + `useReducer` stores wrap the entire app in `src/main.tsx`:

- **`AuthContext`** (`src/context/AuthContext.tsx`) — auth state machine. `isAuthenticated` is only set to `true` on the `CONSENT_ACCEPTED` action (not on login or OTP). The full flow is `LOGIN → OTP_VERIFIED → CONSENT_ACCEPTED`. `SWITCH_ROLE` swaps `currentUser` by matching role against `src/data/users.json`.

- **`BankingContext`** (`src/context/BankingContext.tsx`) — accounts, FX rates, payment draft, FX quote lock, and pending approvals count. The `paymentDraft` field carries in-flight payment state between `/payments/new` and `/payments/review`; it is `null` when no transfer is in progress.

No external state library, no API calls. All data is from JSON files in `src/data/`. State resets on page refresh.

### Routing

Uses **`HashRouter`** (not `BrowserRouter`) for compatibility with GitHub Pages static hosting. All routes live in `src/router/AppRouter.tsx`. The `ProtectedRoute` wrapper redirects to `/login` when `isAuthenticated` is false. Auth screens (Login, OTP, Consent) use `AuthLayout`; all banking screens use `AppShell` (sidebar + topbar).

### Data layer

Mock JSON files in `src/data/` are imported directly as typed constants. The single source of truth for all domain types is `src/types/index.ts`. When adding new data shapes, add the interface there first.

### Key utilities

- **`cn(...)`** in `src/lib/utils.ts` — `clsx` + `tailwind-merge` for conditional class composition. Use this everywhere instead of template literals.
- **`formatINR` / `formatCurrency`** in `src/lib/utils.ts` — Indian number formatting (Cr/L/K compact scale) and multi-currency formatting.
- **`validateSWIFT` / `validateIBAN`** in `src/lib/formatters.ts` — SWIFT regex and IBAN mod-97 checksum used in the Beneficiaries form.
- **`useCharges`** in `src/hooks/useCharges.ts` — computes the full charges breakdown from `src/data/chargesConfig.json`. Called in PaymentNew and FXConversion; the result is stored in `paymentDraft.charges` and rendered by `ChargesBreakdown`.
- **`useFXRates`** in `src/hooks/useFXRates.ts` — runs a `setInterval` every 5 seconds to simulate live rate ticks with ±0.02 variance. Mount it only once (currently in `FXConversion`).

### Design tokens (Tailwind)

All custom colors are in `tailwind.config.js` under `theme.extend.colors`. The complete shade sets defined are:

- `primary`: 50–900
- `accent`: DEFAULT / gold / light / dark / foreground
- `surface`: 0, 50, 100, 200, 300
- `success`: 50, 100, 200, 500, 600, 700, 800
- `warning`: 50, 100, 200, 300, 400, 500, 600, 700, 800
- `error`: 50, 100, 200, 300, 400, 500, 600, 700, 800
- `info`: 50, 100, 200, 500, 600, 700

**Critical:** `@apply` in `.css` files resolves tokens at PostCSS build time and hard-fails if a shade doesn't exist. JSX `className` references to missing tokens silently produce no CSS. If you add a new shade reference in a `.css` `@apply` rule, add the token to `tailwind.config.js` first.

Two non-standard utilities are defined manually in `src/index.css`:
- `text-2xs` — 0.625rem / 0.875rem line-height (used in Sidebar nav labels)
- `scrollbar-none` — hides scrollbars while preserving scroll functionality (used in FX ticker)

### Payment flow (multi-step state)

The payment journey crosses three routes via shared context state:

1. `/payments/new` — builds a `PaymentDraft` and calls `setPaymentDraft(draft)`, then navigates to `/payments/review`
2. `/payments/review` — reads `paymentDraft` from context; guards against `null` with an early return. **Important:** TypeScript does not propagate null-narrowing into async closure bodies — always capture `const draft = paymentDraft` after the null guard before using it in async functions.
3. `/payments/success` — receives confirmation data via React Router `location.state`; falls back to demo values if navigated to directly.

`clearPaymentDraft()` is called on success, cancellation, or navigation away.

### Auth personas (demo)

Three users in `src/data/users.json`:
- `BOIGC-ADMIN-001` — Rajesh Kumar, Admin (full access)
- `BOIGC-MAKER-001` — Priya Sharma, Maker (initiate only)
- `BOIGC-CHECKER-001` — Anil Verma, Checker (approve/reject only)

The `RoleSwitcher` in `TopBar` calls `switchRole()` to switch between them in the same browser session. OTP accepts any 6-digit input.

## Deployment

- **Live URL:** https://anonymous-shubh.github.io/boi-ibu-banking/
- **Vite base:** `/boi-ibu-banking/` (set in `vite.config.ts`) — required for GitHub Pages subpath hosting. Do not remove.
- **Deploy:** rebuild with `npm run build`, then `npx gh-pages -d dist --repo <repo-url>` to push to the `gh-pages` branch.
- The `vercel.json` at the repo root contains SPA rewrites as a fallback if the app is ever moved to Vercel.
