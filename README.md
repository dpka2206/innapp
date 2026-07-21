# Inn

Multi-brand social content calendar — **web + Expo Go (mobile trial)** — with projects, invites/roles, status-colored calendar cards, insights, and 30-min email/push reminders.

**Full product & functionality guide:** [DOCUMENTATION.md](./DOCUMENTATION.md)

## Stack

- **App:** Expo (React Native) — iOS, Android via Expo Go, and Web
- **API:** Node.js + Express
- **DB:** MongoDB Atlas (cloud — no Docker)

## What you deploy (no Docker)

| Piece | Where |
|---|---|
| MongoDB | [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster |
| API | Railway / Render / Fly.io |
| Web | Vercel / Netlify / Cloudflare Pages (`npx expo export -p web`) |
| Mobile trial | Expo Go app + `npx expo start` QR code |

## 1. MongoDB Atlas

1. Create a free cluster
2. Database Access → create user
3. Network Access → allow `0.0.0.0/0` (or your API host IPs)
4. Connect → copy the `mongodb+srv://...` URI

## 2. API locally

```bash
cd apps/api
cp .env.example .env
# paste MONGODB_URI and set JWT_SECRET
npm install   # from repo root is fine: npm install
npm run dev -w @smc/api
```

API: `http://localhost:4000/health`

## 3. App (web + Expo Go trial)

```bash
cd apps/mobile
# For phone use your laptop LAN IP (not localhost):
# EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000
# EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...   # only if using Google login

npm run start -w @smc/mobile
```

- Press `w` for **website** (localhost)
- Scan the QR with **Expo Go** on your phone (same Wi‑Fi; set `EXPO_PUBLIC_API_URL` to your computer’s LAN IP)

Install Expo Go: [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 4. Production (website link)

1. Deploy API to Railway/Render with Atlas `MONGODB_URI`, `JWT_SECRET`, `APP_URL`, `CORS_ORIGIN`, optional `RESEND_API_KEY`
2. Set mobile `EXPO_PUBLIC_API_URL` to that API URL
3. Export web: `cd apps/mobile && npx expo export -p web`
4. Deploy the `dist/` folder to Vercel/Netlify — that gives you the **website link**

Google login and Resend email are optional for trial; without Resend, invite/reminder emails log to the API console.

## Roles

Owner / Admin / Editor / Viewer — see [DOCUMENTATION.md](./DOCUMENTATION.md#2-roles--permissions).

## Project layout

```
apps/api         backend
apps/mobile      Expo web + native
packages/shared  shared constants
DOCUMENTATION.md full features & API guide
```
