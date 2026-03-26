# Backend Addendum for BabyTracker

Saved on 2026-03-25.

## Recommended stack

- Backend: Node.js + Fastify + TypeScript + Zod + OpenAPI
- Database: PostgreSQL 16
- Object storage: S3-compatible storage
  - local: MinIO
  - prod: AWS S3 or Cloudflare R2
- Cache/queue: Redis only in phase 2

Why this fits the current project:

- The frontend is TypeScript and already has `@tanstack/react-query`, but no real API client yet.
- The app currently stores most domain data through a local CRUD layer in `src/lib/crud.ts`.
- The data model is relational: users, families, babies, settings, events, vaccinations, milestones, photos, chat.

Key code anchors:

- `src/lib/crud.ts`
- `src/lib/storageKeys.ts`
- `src/lib/seedData.ts`
- `src/App.tsx`
- `src/pages/Settings.tsx`
- `src/pages/tracking/EventDetail.tsx`
- `src/pages/Stats.tsx`
- `src/pages/tracking/Calendar.tsx`
- `src/pages/social/Chat.tsx`
- `src/pages/media/PhotoDiary.tsx`
- `src/pages/media/PdfReport.tsx`

## Why PostgreSQL

- Better than Mongo for this project because the domain is relational.
- Works well for:
  - per-child ownership
  - date range queries
  - reporting
  - filtering by type and subtype
  - export jobs
  - chat and household membership
- Use JSONB only where the frontend is still inconsistent, especially event payloads.

## First schema to build

1. `users`
- `id`, `email`, `password_hash`, `display_name`, `avatar_url`, `created_at`

2. `households`
- `id`, `name`, `owner_user_id`

3. `household_members`
- `id`, `household_id`, `user_id`, `role`, `status`

4. `children`
- `id`, `household_id`, `name`, `birth_date`, `gender`, `avatar_url`, `active_flag`

5. `child_settings`
- `child_id`
- `show_solid_mode`
- `show_walk`
- `show_mood`
- `tracked_features`
- `units`
- `theme_override`
- `language_override`

6. `events`
- `id`, `child_id`, `created_by_user_id`
- `type`, `subtype`, `title`, `description`
- `timestamp`, `duration_min`
- `favorite`
- `payload_jsonb`
- `created_at`, `updated_at`

7. `vaccinations`
- `id`, `child_id`, `name`, `scheduled_date`, `completed_date`, `status`, `notes`

8. `milestones`
- `id`, `child_id`, `title`, `emoji`, `category`, `completed`, `date`, `photo_url`

9. `temperature_readings`
- `id`, `child_id`, `value`, `timestamp`, `notes`

10. `allergen_entries`
- `id`, `child_id`, `food`, `reaction`, `date`, `notes`

11. `photos`
- `id`, `child_id`, `uploaded_by_user_id`
- `object_key`, `public_url`
- `caption`, `event_id`, `taken_at`
- `tags_jsonb`

12. `chat_rooms`
- `id`, `household_id`, `kind`, `title`

13. `chat_messages`
- `id`, `room_id`, `sender_user_id`, `text`, `event_ref_jsonb`, `created_at`

14. `reminders`
- `id`, `child_id`, `type`, `title`, `rule_jsonb`, `next_fire_at`, `enabled`

15. `exports`
- `id`, `child_id`, `requested_by_user_id`, `format`, `status`, `object_key`, `created_at`

Practical note:

- For v1, mirror the current frontend storage model instead of over-normalizing.
- The frontend already splits data into `events`, `milestones`, `vaccinations`, `temperature`, `allergens`, `photos`.
- That makes migration easier because `src/lib/crud.ts` can be replaced module by module.

## Endpoints to build first

### Auth

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/me`

### Children and settings

- `GET /v1/children`
- `POST /v1/children`
- `PATCH /v1/children/:id`
- `GET /v1/children/:id/settings`
- `PUT /v1/children/:id/settings`

### Timeline and health data

- `GET /v1/children/:id/events?from=&to=&type=&subtype=&favorite=`
- `POST /v1/children/:id/events`
- `PATCH /v1/events/:id`
- `DELETE /v1/events/:id`
- `GET /v1/children/:id/vaccinations`
- `POST /v1/children/:id/vaccinations`
- `PATCH /v1/vaccinations/:id`
- `GET /v1/children/:id/milestones`
- `PATCH /v1/milestones/:id`
- `GET /v1/children/:id/temperature`
- `POST /v1/children/:id/temperature`
- `GET /v1/children/:id/allergens`
- `POST /v1/children/:id/allergens`

### Media, chat, export

- `POST /v1/photos/presign`
- `POST /v1/children/:id/photos`
- `GET /v1/children/:id/photos`
- `GET /v1/households/:id/chat/rooms`
- `GET /v1/chat/rooms/:id/messages`
- `POST /v1/chat/rooms/:id/messages`
- `POST /v1/children/:id/exports`
- `GET /v1/exports/:id`
- `POST /v1/children/:id/imports/local-bootstrap`

## Hosts

### Local

- Frontend: `http://localhost:8081`
- API: `http://localhost:8787`
- Postgres: `localhost:5432`
- MinIO: `http://localhost:9000`
- Redis: `localhost:6379`

### Dev

- Frontend: `https://dev.babytrack.app`
- API: `https://api-dev.babytrack.app`
- CDN: `https://cdn-dev.babytrack.app`

### Stage

- Frontend: `https://staging.babytrack.app`
- API: `https://api-staging.babytrack.app`
- CDN: `https://cdn-staging.babytrack.app`

### Prod

- Frontend: `https://babytrack.app`
- API: `https://api.babytrack.app`
- CDN: `https://cdn.babytrack.app`

Never expose publicly:

- Postgres
- Redis
- internal object storage endpoints
- worker hosts

## Env vars

### Frontend

- `VITE_API_URL`
- `VITE_ASSETS_URL`
- `VITE_ENV`
- `VITE_SENTRY_DSN`

### Backend

- `NODE_ENV`
- `PORT`
- `APP_BASE_URL`
- `CORS_ORIGINS`
- `DATABASE_URL`
- `REDIS_URL`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `COOKIE_DOMAIN`
- `COOKIE_SECURE`
- `EXPORT_BUCKET`
- `MAX_UPLOAD_MB`

## Migration from localStorage

Do not replace everything in one shot.

### Phase 1

- Keep the current frontend UI.
- Replace `src/lib/crud.ts` with an API-backed adapter that preserves the same shape:
  - `eventsDB`
  - `milestonesDB`
  - `vaccinationsDB`
  - `temperatureDB`
  - `allergensDB`
  - `photosDB`

This is realistic because many screens already depend on that layer:

- `src/components/Timeline.tsx`
- `src/pages/Stats.tsx`
- `src/pages/media/PdfReport.tsx`
- `src/pages/tracking/EventDetail.tsx`
- `src/components/QuickActions.tsx`

### Phase 2

- Add one-time migration endpoint:
  - `POST /v1/children/:id/imports/local-bootstrap`
- Send current local storage payload to the server and mark migration version.

Migrate these keys first:

- profile and auth:
  - `authToken`
  - `onboarded`
  - `babyName`
  - `birthDate`
  - `gender`
  - `userName`
  - `userEmail`
  - `userAvatar`
  - `trackedFeatures`
- CRUD stores:
  - `babytrack_events`
  - `babytrack_milestones`
  - `babytrack_vaccinations`
  - `babytrack_temperature`
  - `babytrack_allergens`
  - `babytrack_photos`
- settings:
  - `babytrack_show_solid`
  - `babytrack_show_walk`
  - `babytrack_show_mood`
- med history:
  - `babytrack_med_history`
- chat:
  - `babytrack_chat_*`

Timer state can be dropped during migration if needed.

### Phase 3

- Frontend reads server first.
- Local cache becomes only a persistence layer for offline mode.
- Stop treating raw localStorage as source of truth.

## Risks and constraints

### Auth

- Current auth is fake and stored in localStorage:
  - `src/pages/auth/Login.tsx`
  - `src/pages/auth/Register.tsx`
  - `src/lib/seedData.ts`
- Real backend should use:
  - short-lived access token in memory
  - refresh token in `httpOnly` cookie

### File uploads

- `PhotoDiary` is currently mock-only in `src/pages/media/PhotoDiary.tsx`.
- Real uploads should use presigned URLs.
- Do not send image files through the app server for every upload unless absolutely necessary.

### Export and import

- Current export and import live in `src/pages/Settings.tsx`.
- Current PDF and CSV generation live in `src/pages/media/PdfReport.tsx`.
- On backend, export should become a server job with schema validation and downloadable artifact.

### Offline-first

- The current UX is local-first everywhere.
- If the backend is added without local cache, optimistic writes, and sync, the product will feel worse immediately.
- Use React Query cache plus persistent storage on the client.

### Chat

- Current chat is localStorage-only in `src/pages/social/Chat.tsx`.
- For v1, REST plus polling is enough.
- Add WebSocket or SSE only after the data model is stable.

### Existing data inconsistency

- `temperature` is split between timeline-style events and a separate temperature store.
- `calendar` currently ignores real event data.
- `stats` mixes real counts with fake charts.
- Backend v1 should mirror frontend storage enough to unblock migration, then clean this up in v2.

## Recommended order of implementation

1. Auth
2. Children and profile
3. Child settings
4. Events
5. Vaccinations, milestones, temperature, allergens
6. Export and import
7. Photos
8. Chat
9. Reminders and realtime

## Minimal first milestone

If only one backend milestone is planned, build this first:

- auth
- children and profile
- child settings
- events
- vaccinations
- milestones
- temperature
- allergens
- import and export

That is enough to replace the current local CRUD core without touching the whole UI at once.
