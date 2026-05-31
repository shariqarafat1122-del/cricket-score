# 🏏 Live Cricket Player Tracker

A production-ready React + TypeScript + Firebase application that tracks live cricket batsmen in real-time using the Cricbuzz API, stores player data in Firestore, and streams updates to the dashboard.

## ✨ Features

- **Live Polling** — Cricbuzz API fetched every 10 seconds
- **Firestore Sync** — Auto upsert batsmen; mark dismissed players as "out"
- **Realtime Dashboard** — `onSnapshot` listeners update UI instantly
- **Full Batting History** — No documents ever deleted; complete audit trail
- **Dark Premium UI** — JetBrains Mono font, cyan accents, animated live indicators
- **TypeScript** — Full type safety across all layers

## 🗂 Project Structure

```
src/
├── firebase.ts                    # Firebase app init
├── types/
│   └── cricket.ts                 # All TypeScript interfaces
├── services/
│   ├── pollingService.ts          # Cricbuzz API polling (10s interval)
│   └── firestoreService.ts        # Firestore CRUD + onSnapshot listeners
├── hooks/
│   └── useCricketTracker.ts       # React hooks (polling, realtime data)
└── components/
    └── PlayerTrackerPage.tsx      # Main dashboard UI
```

## 🚀 Quick Start

### 1. Clone and install

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database**
4. Go to Project Settings → Your apps → Add web app
5. Copy the config values

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your Firebase values in .env
```

### 4. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📊 Firestore Schema

### `live_players/{matchId}_{playerName}`
```json
{
  "matchId": "112000",
  "playerName": "V Kohli",
  "runs": 85,
  "balls": 72,
  "fours": 8,
  "sixes": 2,
  "status": "batting",
  "firstSeenAt": "<Timestamp>",
  "updatedAt": "<Timestamp>"
}
```

### `match_history/{matchId}_innings_{n}`
```json
{
  "matchId": "112000",
  "innings": 1,
  "players": [
    { "playerName": "...", "runs": 85, "balls": 72, "fours": 8, "sixes": 2, "status": "batting" }
  ]
}
```

## ⚠️ CORS Note

Cricbuzz blocks direct browser requests. The app uses `corsproxy.io` by default. For production:

1. Deploy a serverless proxy (Vercel/Cloudflare Worker)
2. Set `VITE_CORS_PROXY_URL` in your env

Or build a backend endpoint that calls Cricbuzz server-side.

## 🎨 Color System

| Token     | Hex       | Usage              |
|-----------|-----------|--------------------|
| Background| `#0B1020` | Page background    |
| Card      | `#151B2E` | Card surfaces      |
| Accent    | `#00E5FF` | Live indicators    |
| Success   | `#00C853` | Fours, positive SR |
| Danger    | `#FF1744` | Sixes, out status  |

## 🏗 How It Works

1. User enters a Cricbuzz match ID and clicks **Start Tracking**
2. `PollingService` fires every 10s → `fetchLivescore(matchId)`
3. Response is parsed → current batsmen extracted
4. `processBatsmen()` diffs current vs previous:
   - New batsman → `setDoc` with `firstSeenAt`
   - Existing batsman → `updateDoc` runs/balls/fours/sixes
   - Disappeared batsman → `updateDoc` `status: "out"`
5. `onSnapshot` listeners push Firestore changes to React state in real-time
