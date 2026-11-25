# Skill Atlas

A personal learning-roadmap web app. Track ~90 skills across programming, DSA, CS core, frontend, backend, cloud, AI, quant and career, see what's unlocked, and generate a week-by-week study plan for a career path.

- **/atlas**: interactive skill graph (React Flow). Columns are domains, edges are prerequisites. Click a node for its subtopics checklist, resources, notes and a "build this" project.
- **/dashboard**: overall progress, recommended next skills, progress by domain and path, weekly streak, activity heatmap and a recruiting countdown.
- **/plan**: a week-by-week plan for the selected path, built from a topological sort of the remaining skills, each skill's estimated hours and your hours-per-week setting.

Progress is stored in your browser (localStorage). Use **Export** / **Import** in the header to back it up as JSON.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · [@xyflow/react](https://reactflow.dev) · Vitest

## Local setup

Requires Node.js 20+ (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run build`     | Production build                   |
| `npm run lint`      | ESLint                             |
| `npm run typecheck` | TypeScript (`tsc --noEmit`)        |
| `npm test`          | Unit tests (Vitest)                |

CI (`.github/workflows/ci.yml`) runs lint, typecheck and tests on every pull request.

## Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel, click **Add New → Project** and import the repo.
3. Keep the detected defaults (framework: Next.js, build command `next build`). No environment variables are needed.
4. Click **Deploy**. Every push to `main` deploys to production, and every PR gets a preview URL.

Or from the CLI: `npx vercel` (preview) and `npx vercel --prod`.

## Adding or editing a skill

All content lives in typed data files. No UI code changes are needed.

1. Open `src/data/skills.ts` and add an object to `SKILLS`:

   ```ts
   {
     id: "rust",                       // unique, kebab-case, never rename once in use
     name: "Rust",
     domain: "programming",            // one of DOMAINS
     description: "Memory-safe systems programming.",
     subtopics: ["Ownership and borrowing", "Traits", "Error handling", "Cargo"],
     prerequisites: ["functions-oop"], // skill ids that must be completed first
     estimatedHours: 40,
     project: "Write a grep clone in Rust.",
     resources: [
       { title: "The Rust Book", url: "https://doc.rust-lang.org/book/", level: "beginner", type: "book" },
     ],
   },
   ```

2. Add its id to any career path in `src/data/paths.ts`.
3. Run `npm test`. The data tests check for unknown ids, duplicate ids and prerequisite cycles.

Notes:

- A skill is **completed** when all of its subtopics are checked, and **unlocked** when all of its prerequisites are completed.
- Progress is saved per subtopic name, so renaming a subtopic resets that one checkbox.
- Each skill's column position is computed automatically from its domain and prerequisite depth.

## Storage

The UI talks to storage only through the `ProgressStore` interface in `src/lib/storage/types.ts`:

```ts
interface ProgressStore {
  load(): Promise<ProgressState>;
  save(state: ProgressState): Promise<void>;
  clear(): Promise<void>;
}
```

`LocalStorageStore` is the v1 implementation. To move to Supabase, implement `ProgressStore` (for example, one row per user holding the `ProgressState` JSON) and return it from `createProgressStore()` in `src/lib/storage/index.ts`.

## Project structure

```
src/
  app/            atlas, dashboard and plan routes
  components/     ProgressProvider (state + persistence), Nav, shared UI, atlas graph and side panel
  data/           skills.ts, paths.ts, types.ts  ← edit content here
  lib/            progress (unlock + %), graph (topological sort), plan, activity (streak, heatmap, countdown), storage
```
