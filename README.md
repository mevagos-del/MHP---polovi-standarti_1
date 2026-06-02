# Польові стандарти / Field Standards

Production-oriented PWA MVP for monthly planning of sales team field activities.

## Architecture Solution

The app uses React, Vite, TypeScript, PWA shell caching, `xlsx` for Excel dictionary import, CSV export, and a localStorage repository layer. UI components talk to services/repositories instead of direct storage calls, so the first backend migration can replace local repositories with Supabase repositories.

## User Stories

- As a field team user, I select my sales channel and employee name to enter monthly activity plans.
- As a field team user, I can see current previous plans for my channel + employee pair before saving a future plan.
- As an admin, I unlock the admin panel with a demo PIN, import dictionaries from Excel, export current plans and change log, and filter records.

## MVP Scope

- Demo dictionaries only, importable from Excel.
- localStorage/mock data layer.
- Current plans and change log with versioning.
- PWA install support and basic offline shell caching.
- Supabase-ready schema and repository boundary.

## Key User Scenarios

1. Select channel.
2. Search and select employee from the selected channel.
3. Select planning month.
4. Enter values for audits/store checks, administrative days, negotiations.
5. Save a new plan or confirm update of an existing plan.
6. Review current plans for the selected channel + employee.

## Key Admin Scenarios

1. Open `Адмін-панель`.
2. Enter demo PIN `2468`.
3. Import `Field Standards - Dictionaries.xlsx`.
4. Export current plans or change log for a selected month.
5. Filter current records by month, channel, and employee.

The demo PIN is only a lightweight MVP gate. It is not production security. Production should use Supabase Auth, Microsoft SSO, or another proper authentication provider.

## File Structure

```text
src/
  app/
  components/
  data/
  features/
    admin/
    dictionaries/
    history/
    planning/
  services/
    export/
    plans/
    storage/
    supabase/
  storage/
  types/
  utils/
public/
  manifest.json
  service-worker.js
  icons/
supabase/
  schema.sql
```

## Local Run

```bash
npm install
npm run dev
npm run build
```

## Vercel Deploy

1. Push the repository to GitHub.
2. Create a new Vercel project from the repository.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.

## PWA Update Troubleshooting

The service worker uses network-first navigation and does not permanently cache `index.html` or Vite hashed JS/CSS assets. This prevents installed PWAs from loading old `index-*.js` or `index-*.css` files after a Vercel redeploy.

If a user still sees a blank screen from an older installed PWA version, perform a one-time cleanup:

1. Open the site in Chrome or Edge.
2. Open DevTools -> Application.
3. Go to Service Workers and click `Unregister`.
4. Go to Storage and click `Clear site data`.
5. Close and reopen the PWA or reinstall it from the updated site.

Alternative quick cleanup:

1. Open browser settings.
2. Find Site settings / All sites.
3. Search for the deployed Vercel domain.
4. Clear storage for that site.
5. Reopen the app.

Vercel update test:

1. Deploy the app to Vercel.
2. Open the site normally and install the PWA.
3. Make another deployment.
4. Reopen the installed PWA.
5. Confirm the app loads without a blank screen.
6. In DevTools Network, confirm there are no 404 requests for old `index-*.js` or `index-*.css` files.

## Future Supabase Environment Variables

Do not commit real values. Future production setup can use:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Supabase Setup

1. Create a new project in Supabase.
2. Open `SQL Editor`.
3. Paste and run [supabase/schema.sql](supabase/schema.sql).
4. Open `Project Settings` -> `API`.
5. Copy the Project URL and anon public key.
6. Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

7. Fill in:

```text
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

8. Restart the dev server.

When both variables exist, the app uses Supabase. When either variable is missing, the app automatically falls back to localStorage demo mode and shows:

```text
Демо-режим: дані зберігаються локально в браузері.
```

## Vercel Environment Variables

In Vercel, add the same variables in `Project Settings` -> `Environment Variables`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Redeploy after adding or changing them.

## Supabase Mode Test

1. Configure `.env`.
2. Run `npm run dev`.
3. Unlock `Адмін-панель` with demo PIN `2468`.
4. Import `Field Standards - Dictionaries.xlsx`.
5. Create a new plan.
6. Create the same channel + employee + month again and confirm update.
7. Check Supabase tables:
   - `current_plans` has one row for the unique key with incremented version.
   - `change_log` has multiple versions, only the latest has `is_current = true`.
8. Export current plans and change log for the selected month.

## localStorage Fallback Test

1. Remove or rename `.env`.
2. Restart the dev server.
3. Confirm the demo-mode note is visible.
4. Repeat plan creation, update, dictionary import, and exports.
5. Confirm data persists only in the current browser.

## Security Notes

The Admin PIN is only a lightweight MVP access gate and is not production security.
Production rollout must use Supabase Auth, Microsoft SSO, or another real authentication provider.

RLS is not enabled by the MVP schema. Before using real data, enable Row Level Security and add policies for dictionaries, current plans, and change log access.

## Dictionary Excel Format

File name: `Field Standards - Dictionaries.xlsx`.

Required sheets:

- `Channels`: `channelCode`, `channelName`, `isActive`
- `Users`: `fullName`, `channelCode`, `isActive`
- `Months`: `monthName`, `monthCode`, `isActive`

Rows with `isActive` not equal to `TRUE` are ignored. `Users.channelCode` must exist in `Channels`.

## QA Checklist

- Channel is required.
- Employee field is disabled before channel selection.
- Employee search filters only selected channel users.
- Free text employee value cannot be saved.
- Activity values accept only integers >= 0.
- New plan creates version 1 and change log record `Створено`.
- Duplicate key prompts for update and increments version.
- Cancelled duplicate update does not save changes.
- History shows current plans for selected channel + employee.
- Admin PIN `2468` unlocks panel.
- Wrong PIN shows `Невірний PIN-код`.
- Excel import validates sheets and columns.
- CSV exports use UTF-8 BOM and semicolon separator.
- PWA manifest is available.
- Production build completes.
- localStorage demo mode works without `.env`.
- Supabase mode works when both env variables are configured.
- First plan creation inserts `current_plans` and `change_log`.
- Repeated plan update increments version and updates latest change log state.
- Admin current plans export reads the active storage mode.
- Admin change log export reads the active storage mode.
- Dictionary import updates Supabase dictionaries without deleting planning history.
- Dictionary import still works in localStorage fallback mode.
- Vercel deployment works with configured env variables.
