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

## Future Supabase Environment Variables

Do not commit real values. Future production setup can use:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

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
