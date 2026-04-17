# MediConnect - Patient & Doctor Portal

## Overview

A secure patient-doctor communication platform built with React + Vite frontend and Express 5 backend. Features Clerk authentication, role-based access (patient/doctor), and a PostgreSQL database.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/patient-portal/)
- **API framework**: Express 5 (artifacts/api-server/)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (via setupClerkWhitelabelAuth)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

1. **Authentication** - Two account types: patient and doctor (Clerk)
2. **Home Screen** - Role-based dashboards with profile bar and 2x2 preview grid
3. **Messages** - Secure patient-doctor messaging with conversation threads
4. **Calendar** - Appointment scheduling (patients request, doctors manage slots/accept/decline)
5. **Vitals Log** - Patient vitals tracking with critical range detection; doctor critical alerts
6. **Medications** - Doctor prescribes medications; patients view current/past meds

## Security

- All routes require Clerk authentication
- Doctors can only access data for their assigned patients
- Role-based access control at API level
- Session-based auth via Clerk middleware

## Database Schema

- `users` — User profiles (patients and doctors)
- `doctor_patients` — Doctor-patient relationships
- `messages` — Direct messages between users
- `appointment_slots` — Doctor available time slots
- `appointments` — Appointment requests (pending/accepted/declined)
- `vital_logs` — Patient vital sign records with critical detection
- `medications` — Prescribed medications (current and past)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/patient-portal run dev` — run frontend locally

## Vital Ranges (Critical Detection)

- Heart Rate: < 40 or > 130 bpm → critical
- Respiration Rate: < 8 or > 30 breaths/min → critical
- Systolic BP: < 90 or > 180 mmHg → critical
- Diastolic BP: < 60 or > 120 mmHg → critical
- SpO2: < 92% → critical
