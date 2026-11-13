# @trackecom/web

Seller app. Next.js App Router, Arabic (RTL), French and English.

## Run

```sh
pnpm --filter @trackecom/ui build   # the web app uses the built design system
pnpm --filter @trackecom/web dev    # http://localhost:3000 -> /fr, /ar or /en from the browser language
```

`NEXT_PUBLIC_API_URL` points at the gateway (default `http://localhost:4000`).

## Conventions

- **Components** come from `@trackecom/ui` only. Icons from `lucide-react`.
- **RTL**: logical Tailwind classes only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `border-s`). ESLint rejects `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`.
- **Translations**: one file per feature in `messages/{ar,fr,en}/<feature>.json`, listed in `i18n/namespaces.ts`.
- **Menu**: each feature adds `config/nav/<feature>.ts` and one line in `config/nav/index.ts`.
- **Pages**: seller screens live in `app/[locale]/(app)/<feature>/` and get the shell for free.
- **Data**: `apiRequest({ path, schema })` with a schema from `@trackecom/contracts`, inside TanStack Query hooks. Never send `storeId`; the gateway takes it from the session.
- **Formatting**: `lib/format.ts` (Latin digits, DZD without decimals, Africa/Algiers time zone).
