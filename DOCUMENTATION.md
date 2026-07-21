# Inn — Product & Functionality Guide

**Inn** is a multi-brand social media content calendar. One workspace for planning posts, inviting a team, tracking status, and getting reminded before something goes live.

It runs as:

| Surface | How you use it |
|---|---|
| **Website** | Expo web (local or deployed static export) |
| **Phone (trial)** | [Expo Go](https://expo.dev/go) on iOS / Android |
| **API** | Node.js + Express + MongoDB Atlas |

---

## Table of contents

1. [What you can do](#1-what-you-can-do)
2. [Roles & permissions](#2-roles--permissions)
3. [Screens & flows](#3-screens--flows)
4. [Posts, statuses & calendar](#4-posts-statuses--calendar)
5. [Invites & email](#5-invites--email)
6. [Reminders & alerts](#6-reminders--alerts)
7. [Tech stack](#7-tech-stack)
8. [API reference](#8-api-reference)
9. [Environment variables](#9-environment-variables)
10. [Run locally](#10-run-locally)
11. [Deploy](#11-deploy)
12. [Optional / not finished yet](#12-optional--not-finished-yet)

---

## 1. What you can do

### Accounts
- Sign up with **name, email, password** (password min 6 characters)
- Log in / log out
- Edit **display name** on Profile (email is read-only)
- Optional **Continue with Google** (only if Google client IDs are configured)

### Projects (brands)
- Create a project with **name**, **color**, and **platforms** (Instagram, LinkedIn, YouTube, X)
- See all your projects on the home screen
- Open a project calendar
- Edit brand settings (name, description, platforms, categories, content types, alert emails)
- Delete a project (**owner only**)

### Calendar
- Switch **Day / Week / Month**
- Jump months with prev/next or the month–year picker
- Tap a day to see that day’s posts
- Filter by **platform**, **status**, or **content type**
- Create, edit, or delete posts (editors and above)

### Posts
Each post can include:
- Title, schedule date & time
- Platforms, content type, category, status
- Caption, hashtags, notes
- Published URL
- Basic insights: **reach**, **likes**, **views**

Default content types: Reel, Post, Carousel, Story, Short, Video, Thread  
Default categories: Educational, Promotional, Behind the Scenes, Testimonial/UGC, Announcement, Engagement, Trend/Meme

### Team
- Invite people by **email** with role **admin / editor / viewer**
- Copy invite link (works even when email sending is off)
- Accept invite after signing up / logging in with that email
- Change member roles or revoke access (admin+)
- Resend a pending invite

### Alerts
- Project **alert emails** (comma-separated list in Settings)
- Automatic reminder ~**30 minutes** before a post that is **ready** or **scheduled**
- Reminder goes out by email (when Resend is configured) and push (when device tokens are registered)

---

## 2. Roles & permissions

| Action | Viewer | Editor | Admin | Owner |
|---|:---:|:---:|:---:|:---:|
| View calendar, posts, members, settings | ✓ | ✓ | ✓ | ✓ |
| Create / edit / delete posts | | ✓ | ✓ | ✓ |
| Invite / manage members | | | ✓ | ✓ |
| Edit project settings | | | ✓ | ✓ |
| Delete project | | | | ✓ |

Notes:
- There is only one **owner** (the creator). Owner role cannot be reassigned or removed via the members UI.
- New invites cannot use the `owner` role.
- Memberships are either **pending** (invite not accepted) or **active**.

---

## 3. Screens & flows

| Screen | Path | Purpose |
|---|---|---|
| Login | `/(auth)/login` | Email/password (+ Google if configured) |
| Register | `/(auth)/register` | Create account |
| Projects home | `/(app)` | List projects, create new, open profile |
| Profile | `/(app)/profile` | Edit name, log out |
| New project | `/(app)/project/new` | Create brand calendar |
| Calendar | `/(app)/project/[id]` | Day / week / month + filters + post sheet |
| Members | `/(app)/project/[id]/members` | Invites & team (also opened via **Share**) |
| Settings | `/(app)/project/[id]/settings` | Brand details & alert emails |
| Accept invite | `/invite/[token]` | Join a project after invite |

**Auth gate:** unauthenticated users are sent to login; after login, pending invite tokens stored as `smc_pending_invite` are honored.

---

## 4. Posts, statuses & calendar

### Statuses (and card colors)

| Status | Meaning (typical use) |
|---|---|
| `idea` | Early thought |
| `draft` | Default for new posts |
| `ready` | Ready to go live (gets reminders) |
| `scheduled` | Locked to a time (gets reminders) |
| `posted` | Already published |
| `archived` | No longer active |

### Calendar behavior
- Weeks start on **Monday**
- **Month:** grid with dots / type chips; tap day → day sheet
- **Week:** hour columns 08:00–18:00 on wider screens; on narrow phones (`<720px`) week uses an agenda list
- **Day:** agenda for that date
- **Filters** modal scopes the loaded posts
- **Share** opens the Members screen (invite teammates)

### Permissions on posts
- **Editor+** can create/update/delete
- **Viewer** can open the sheet read-only

---

## 5. Invites & email

1. Admin/owner enters email + role → API creates membership.
2. If that email **already has an Inn account**, they are added as **active** immediately.
3. If not, membership stays **pending** with an invite token. Link format:

   `{APP_URL}/invite/{token}`

4. Invitee opens the link, signs up / logs in with the **same email**, and the membership becomes **active**.
5. Pending invites also auto-activate on register / login / Google if the email matches.

### Email sending
| Config | Behavior |
|---|---|
| `RESEND_API_KEY` set | Real invite / reminder emails via Resend |
| Not set | Messages are **logged in the API console**; UI shows “Email invites: OFF” and still lets you **copy the invite link** or open a `mailto:` draft |

---

## 6. Reminders & alerts

- A cron job runs **every minute**.
- It looks for posts whose `scheduledAt` is about **`REMINDER_WINDOW_MINUTES`** ahead (default **30**), status **`ready`** or **`scheduled`**.
- Each post is reminded **once** (tracked in `ReminderLog`).
- Recipients: project `alertEmails`, plus other active members (email), and Expo push tokens when present.

---

## 7. Tech stack

```
socialmediacalander/
├── apps/api/           # Express API (@smc/api)
├── apps/mobile/        # Expo app — web + native (@smc/mobile)
├── packages/shared/    # Shared roles, platforms, statuses, colors
└── README.md           # Quick start
```

| Layer | Technology |
|---|---|
| App | Expo 57, Expo Router, React Native / React Native Web, TanStack Query, Zustand, date-fns, DM Sans |
| API | Express, Mongoose, Zod, JWT, bcrypt, helmet, cors, node-cron, Resend, Google Auth, Expo Server SDK |
| Database | MongoDB Atlas (cloud). If `MONGODB_URI` is a placeholder or `USE_MEMORY_DB=1`, an in-memory Mongo is used (data resets on restart) |
| Auth storage | SecureStore (native) / AsyncStorage (web) — keys `smc_token`, `smc_user` |

**Brand colors (UI):** lime `#C8F53A`, blue `#2B5BFF`, black background.

---

## 8. API reference

Base URL (local): `http://localhost:4000`  
Auth header: `Authorization: Bearer <jwt>` (7-day expiry)

| Method | Path | Who | Purpose |
|---|---|---|---|
| `GET` | `/health` | public | Health check |
| `POST` | `/auth/register` | public | Sign up |
| `POST` | `/auth/login` | public | Log in |
| `POST` | `/auth/google` | public | Google idToken login |
| `GET` | `/auth/me` | user | Current user |
| `PATCH` | `/auth/me` | user | Update name |
| `POST` | `/auth/push-token` | user | Register Expo push token |
| `GET` | `/projects` | user | List my projects |
| `POST` | `/projects` | user | Create project (caller = owner) |
| `GET` | `/projects/:id` | member | Get project |
| `PATCH` | `/projects/:id` | admin+ | Update project |
| `DELETE` | `/projects/:id` | owner | Delete project |
| `GET` | `/projects/:id/members` | member | List members |
| `POST` | `/projects/:id/members/invites` | admin+ | Invite by email |
| `POST` | `/projects/:id/members/:memberId/resend` | admin+ | Resend invite |
| `PATCH` | `/projects/:id/members/:memberId` | admin+ | Change role |
| `DELETE` | `/projects/:id/members/:memberId` | admin+ | Revoke member |
| `GET` | `/projects/:id/posts` | member | List posts (`from`, `to`, `platform`, `status`, `type`, `assignee`) |
| `POST` | `/projects/:id/posts` | editor+ | Create post |
| `PATCH` | `/projects/:id/posts/:postId` | editor+ | Update post |
| `DELETE` | `/projects/:id/posts/:postId` | editor+ | Delete post |
| `POST` | `/invites/:token/accept` | user | Accept invite |

---

## 9. Environment variables

### API — `apps/api/.env`

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no | Default `4000` |
| `MONGODB_URI` | yes (prod) | Atlas connection string |
| `JWT_SECRET` | yes (prod) | Signs session tokens |
| `APP_URL` | yes (invites) | Invite link base, e.g. `http://localhost:8081` |
| `CORS_ORIGIN` | optional | Comma-separated origins |
| `GOOGLE_CLIENT_ID` | optional | Enables Google login on API |
| `RESEND_API_KEY` | optional | Enables real email |
| `EMAIL_FROM` | optional | From address for Resend |
| `REMINDER_WINDOW_MINUTES` | optional | Default `30` |
| `USE_MEMORY_DB` | optional | `1` = in-memory Mongo |

### App — `apps/mobile/.env`

| Variable | Required | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | for phone | Laptop LAN IP, e.g. `http://10.10.26.104:4000` — **not** `localhost` on a real device |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | optional | Shows Google button |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | optional | |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | optional | |

---

## 10. Run locally

```bash
# Root
npm install

# Terminal 1 — API
cd apps/api
cp .env.example .env   # set MONGODB_URI + JWT_SECRET
npm run dev -w @smc/api
# → http://localhost:4000/health

# Terminal 2 — App
cd apps/mobile
# For phone: EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000
npx expo start
```

| Goal | Action |
|---|---|
| Website | Press `w` in Expo, or open the printed localhost URL |
| Phone | Install Expo Go → same Wi‑Fi → scan QR (or enter `exp://YOUR_LAN_IP:8081`) |
| Both via root | `npm run dev` (if configured) |

Phone and laptop must share Wi‑Fi. Keep the API running while using the app.

---

## 11. Deploy

No Docker. Recommended split:

| Piece | Where |
|---|---|
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) |
| API | Railway / Render / Fly.io |
| Website | `npx expo export -p web` → deploy `apps/mobile/dist` to Vercel / Netlify / Cloudflare Pages |
| Mobile trial | Expo Go against your hosted API (`EXPO_PUBLIC_API_URL`) |

On the API host set at least: `MONGODB_URI`, `JWT_SECRET`, `APP_URL` (your web URL), `CORS_ORIGIN`. Add `RESEND_API_KEY` / `GOOGLE_CLIENT_ID` when you want those features.

Store builds (App Store / Play Store) need a later **EAS Build** / store submission step; v1 trial is Expo Go.

---

## 12. Optional / not finished yet

| Item | Status |
|---|---|
| Resend email | Optional — without key, console log + copy invite link |
| Google login | Optional — needs API + Expo Google env vars |
| Push notifications | API + cron ready; **app does not yet register** push tokens via `/auth/push-token` |
| Seed script | Referenced in package scripts; seed file may be missing |
| Assignee on posts | In API/model; not in the post UI |
| Approval status | In model; not in the post UI |
| Full insights (impressions, comments, shares, saves, clicks) | In API; UI edits reach / likes / views |
| Project logo / color edit after create | Color on create; logo API-only |

---

## Quick constants

```text
Roles:        owner | admin | editor | viewer
Platforms:    instagram | linkedin | youtube | x
Statuses:     idea | draft | ready | scheduled | posted | archived
API port:     4000
JWT lifetime: 7 days
Reminders:    ~30 minutes before ready/scheduled posts
```

For a short setup cheat sheet, see [README.md](./README.md).
