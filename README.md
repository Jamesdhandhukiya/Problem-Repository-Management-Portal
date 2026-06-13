# Problem Repository & Analytics Portal

A production-ready web application for universities to manage programming and technical problems submitted by faculty, with role-based workflows, analytics dashboards, and reporting.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes & Server Actions |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| ORM | Prisma |
| Charts | Recharts |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

## Features

- **Role-based access**: Admin, Staff, Moderator, Student
- **Question lifecycle**: Draft → Submit → Review → Publish/Reject/Changes Required
- **Analytics dashboards** with Recharts for all roles
- **Global search** with filters and pagination
- **Reports**: PDF & Excel export (Admin)
- **Notifications**: In-app notification system
- **Audit logs**: Full activity tracking
- **Dark mode**, responsive layout, sidebar navigation

## Project Structure

```
src/
├── app/                    # App Router pages & API routes
│   ├── (auth)/             # Login, forgot/reset password
│   ├── (dashboard)/        # Role-based dashboards
│   ├── actions/            # Server Actions
│   └── api/                # REST API endpoints
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── dashboard/          # Layout, header, shared UI
│   ├── questions/          # Question management components
│   └── analytics/          # Chart components
├── lib/                    # Prisma, Supabase, auth utilities
├── services/               # Business logic layer
├── store/                  # Zustand stores
├── types/                  # TypeScript types
├── validations/            # Zod schemas
└── hooks/                  # Custom React hooks
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Seed data
supabase/
└── rls-policies.sql        # Row Level Security policies
```

## Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account ([supabase.com](https://supabase.com))
- Vercel account (for deployment)

## Setup Instructions

### 1. Clone and install

```bash
cd problem-repo-portal
npm install
```

### 2. Create Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Copy your **Project URL**, **anon key**, and **service role key** from Settings → API.
3. Copy your **Database connection string** from Settings → Database.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[your-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Configure Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`, `http://localhost:3000/reset-password`

Enable Email provider under Authentication → Providers.

### 5. Run database migrations

```bash
npm run db:migrate
```

When prompted, name the migration `init`.

### 6. Apply RLS policies (optional but recommended)

Run the SQL in `supabase/rls-policies.sql` in the Supabase SQL Editor.

### 7. Seed the database

```bash
npm run db:seed
```

Default accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | Admin@12345 |
| Staff | staff@university.edu | Staff@12345 |
| Moderator | moderator@university.edu | Mod@12345 |
| Student | student@university.edu | Student@12345 |

### 8. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any seed account.

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add all environment variables from `.env`.
4. Set `NEXT_PUBLIC_APP_URL` to your production URL.
5. Update Supabase Auth redirect URLs to include your Vercel domain.
6. Deploy.

Build command: `npm run build`  
Install command: `npm install`

## Role Permissions

| Feature | Admin | Staff | Moderator | Student |
|---------|-------|-------|-----------|---------|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Create questions | ❌ | ✅ | ❌ | ❌ |
| Review questions | ❌ | ❌ | ✅ | ❌ |
| Browse published | ✅ | ✅ | ✅ | ✅ |
| Bookmarks / Solved | ❌ | ❌ | ❌ | ✅ |
| Export reports | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search` | Global question search with filters |
| GET | `/api/notifications` | User notifications |
| PATCH | `/api/notifications/[id]/read` | Mark notification read |
| GET | `/api/reports/[type]?format=pdf\|xlsx` | Export reports (Admin) |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## License


