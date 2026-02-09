# Solo Training Log

A web app to track workouts, build training plans, and view progress. Built for localhost first with a production-ready architecture.

## Features

- **Auth**: Sign up / log in with email and password
- **Exercise inventory**: Browse 40+ seeded exercises (strength, cardio, Zone 2, pilates) with instructions. Add custom exercises.
- **Templates**: Create session templates (e.g. "Push Day A", "Zone 2 Ride") and add exercises with defaults.
- **Sessions**: Start a session from a template or from scratch. Log strength sets (reps/weight) or cardio/Zone 2 (duration/RPE).
- **Progress**: View charts and recent PRs per exercise.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js Route Handlers (REST)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (Credentials)
- **Validation**: Zod
- **UI**: Radix UI primitives + custom components
- **Charts**: Recharts

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Database

Uses **SQLite** by default (no PostgreSQL or Docker required). The `.env` file is preconfigured with `DATABASE_URL="file:./dev.db"`.

### 3. Configure environment

Copy the example env file and set your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/solo_training_log"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 4. Run migrations and seed

```bash
npm run db:setup
```

Or step by step:
```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed exercise library |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:push` | Push schema without migrations |

## Flow

1. **Sign up** → Create an account
2. **Exercises** → Browse the library (or add custom exercises)
3. **Templates** → Create a template, add exercises, set defaults
4. **Sessions** → Start a session from a template or scratch, log your work
5. **Progress** → Click an exercise name to see charts and PRs

## Data Model

- **User**: id, email, passwordHash, name
- **Exercise**: name, category, equipment[], muscles[], instructions (ownerId null = global)
- **SessionTemplate**: title, category, exercises (TemplateExercise)
- **Session**: title, category, date, exercises (SessionExercise)
- **SetLog**: reps, weight, unit, durationSec, rpe (reused for strength and cardio)

## Future (v2)

- iOS and Android apps
- Google OAuth
- More complex periodization
