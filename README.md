# 🎬 WatchTogether — High-Performance Social Video & Real-Time Watch Party Platform

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-success?style=flat-square&logo=vercel)](https://watch-together-mauve.vercel.app)
[![Render Deployment](https://img.shields.io/badge/Backend-Render-blue?style=flat-square&logo=render)](https://watchtogether-backend.onrender.com)
[![LiveKit SFU](https://img.shields.io/badge/Media%20Engine-LiveKit%20SFU-violet?style=flat-square&logo=webrtc)](https://livekit.io)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

**WatchTogether** is a production-ready, full-stack social video streaming and real-time collaboration platform. It features synchronized video watch parties, multi-participant LiveKit SFU video calls with screen sharing, controlled video downloads tied to tiered user subscriptions, Razorpay payment processing with automated PDF invoicing, personalized IST time-based theme adaptation, location-aware security OTP verification, and multilingual comment translation with automated content moderation.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Installation Guide](#installation-guide)
- [Environment Variables](#environment-variables)
- [User Guide](#user-guide)
- [Watch Party Workflow](#watch-party-workflow)
- [Video Upload Guide](#video-upload-guide)
- [Authentication & Security](#authentication--security)
- [Real-Time Communication](#real-time-communication)
- [Deployment Guide](#deployment-guide)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)
- [Screenshots & UI Mockups](#screenshots--ui-mockups)
- [License](#license)
- [Developer & Submission Info](#developer--submission-info)

---

## 🌟 Project Overview

### What is WatchTogether?
WatchTogether is an integrated social platform designed to bridge the gap between traditional video streaming and interactive video conferencing. It enables users to watch platform-hosted or user-uploaded videos in real-time synchronization while engaging in audio/video calls, live text chat, and screen sharing with friends and peers.

### Why Was It Built?
Modern media consumption is increasingly social, yet traditional streaming platforms lack native, high-capacity group watch features. WatchTogether was developed as a comprehensive engineering showcase demonstrating how to combine **Selective Forwarding Unit (SFU) media routing**, **WebSocket event synchronization**, **Razorpay payment workflows**, and **automated content safety pipelines** into a single cohesive web application.

### Key Capabilities
- **Synchronized Group Playback**: Ultra-low latency frame and timestamp synchronization across all room participants.
- **High-Capacity SFU Video Calling**: Scalable LiveKit SFU media pipeline supporting up to 80–120 concurrent interactive video grid participants.
- **Monetized Download Quotas**: Tier-based download restrictions backed by server-side daily rate-limiting and automated Razorpay upgrades.
- **Adaptive Personalization**: Automatic light/dark theme shifting calculated against Indian Standard Time (10:00 AM – 12:00 PM IST) combined with user-driven manual overrides.
- **Multilingual Community Interaction**: 1-click comment translation powering global discussions alongside anti-abuse text filtering.

---

## ✨ Key Features

### 1. 🔐 Authentication & Device Security
- **Email OTP Registration**: Account creation requires 6-digit email OTP verification powered by Brevo HTTPS API.
- **JWT Session Security**: Secure JSON Web Token authentication with HTTP Bearer token headers and persistent session management.
- **New Device & Geolocation Security**: Detects login attempts from unverified cities or new user-agents, mandating 6-digit security OTP verification prior to granting access.

### 2. 🎥 Watch Party & Video Conference Engine
- **Dual Watch Party Modes**: Supports both **Uploaded Video Watch Parties** (synced media player + video call) and **Live Watch Parties** (Google Meet-style grid).
- **LiveKit SFU Integration**: Single-stream publish and adaptive multi-track subscription ensuring smooth performance without WebRTC Mesh P2P CPU bottlenecks.
- **Screen Sharing**: HD screen capture and stream broadcasting via `Track.Source.ScreenShare` with automatic camera restoration upon termination.
- **Comprehensive Call Controls**: Toggle microphone, camera on/off, leave call, view participant list, and inspect connection status.
- **Host Moderation Privileges**: Lock/unlock rooms, kick abusive participants, promote/demote room moderators, and transfer host ownership.
- **Session Recording**: Client-side `MediaRecorder` integration allowing room hosts to record live calls locally and download WebM files directly.

### 3. 📥 Controlled Video Downloads & Tier System
- **Plan-Based Quota Engine**:
  - **Free Tier**: 1 download per day.
  - **Bronze Tier (₹99)**: 5 downloads per day.
  - **Silver Tier (₹299)**: 15 downloads per day.
  - **Gold Tier (₹599)**: 100 downloads per day.
- **Daily Quota Reset**: Automatic UTC midnight reset tracking download timestamps per user.
- **Downloads Library**: Dedicated user profile dashboard displaying downloaded videos, sizes, timestamps, and active tier badges.
- **Server Enforcement**: API-level enforcement returning HTTP 403 Forbidden when quotas are exceeded.

### 4. 💳 Subscription Upgrades & Payment Processing
- **Razorpay Test Payment Integration**: Integrated Razorpay Checkout SDK supporting test credit cards, net banking, and UPI (`success@razorpay`).
- **Cryptographic Signature Verification**: Server-side HMAC SHA256 signature verification ensuring payment authenticity.
- **Automated Database Provisioning**: Instantly updates user subscription status, limits, and expiration dates upon payment verification.
- **PDF Invoice & Email Attachment**: Generates an official transaction invoice PDF using `pdfkit` and automatically dispatches it to the user's registered email address as an attached PDF file via Brevo HTTPS REST API.

### 5. 📺 Custom Video Player & Touch Gestures
- **Modern Controls**: Custom play/pause, volume slider, mute toggle, picture-in-picture, playback rate modifier (0.5x – 2.0x), and fullscreen mode.
- **Skip & Keyboard Controls**: Forward 10s (`L` / `→`) and Rewind 10s (`J` / `←`) buttons and hotkeys.
- **Mobile Touch Gestures**: Double-tap right side (+10s) and double-tap left side (-10s) with visual ripple feedback overlays.
- **Up-Next Auto-Play**: End-of-video overlay with a 5-second countdown timer and skip button.

### 6. 🕒 Time-Based Personalization & Themes
- **IST Time-Based Theme Shifting**: Automatically calculates Indian Standard Time (Asia/Kolkata). Applies **Light Theme** between 10:00 AM and 12:00 PM IST, defaulting to **Dark Theme** during all other hours.
- **Profile Theme Synchronization**: Manual preference override (`Auto`, `Light`, `Dark`) stored in MongoDB user profile and `localStorage`.

### 7. 🌐 Multilingual Moderated Comments
- **Multilingual Support & 1-Click Translation**: Post comments in any language and translate them into preferred target languages (English, Hindi, Spanish, French, German, Japanese) via the MyMemory Translation API.
- **Privacy-Safe Location Display**: Optional location toggle (`showLocation`) displaying city badges without compromising exact user coordinates.
- **Automated Content Moderation**: Filtering engine detecting profane words, spam pattern repetition, and excessive character spam.
- **Community Moderation**: Like, dislike, and report functionality. Reported comments are flagged for review (`Flagged for Review`) rather than auto-deleted.

---

## 🛠️ Technology Stack

### Frontend
- **Core Library**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 8
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS v4, `@tailwindcss/postcss`, `clsx`, `tailwind-merge`
- **Iconography**: Lucide React (`lucide-react`)
- **Real-Time Client**: Socket.IO Client v4 (`socket.io-client`)
- **SFU Client**: LiveKit Web SDK (`livekit-client`, `@livekit/components-react`, `@livekit/components-styles`)
- **HTTP Client**: Axios v1 (`axios`)

### Backend
- **Runtime Environment**: Node.js (v18+)
- **Application Framework**: Express.js v5 (`express`)
- **Real-Time Engine**: Socket.IO v4 (`socket.io`)
- **SFU Server SDK**: LiveKit Server SDK (`livekit-server-sdk`)
- **Database ODM**: Mongoose v9 (`mongoose`)
- **Security & Auth**: JSON Web Token (`jsonwebtoken`), bcryptjs (`bcryptjs`), Helmet (`helmet`), CORS (`cors`), Express Rate Limit (`express-rate-limit`)

### Database & Storage
- **Primary Database**: MongoDB Atlas (Cloud Managed NoSQL)
- **Media Asset Storage**: Cloudinary SDK (`cloudinary`, `multer`)

### Third-Party Services
- **SFU Media Server**: LiveKit Cloud / Open-Source LiveKit Server (`wss://demo-sfu.livekit.cloud`)
- **Payment Gateway**: Razorpay Test Mode API (`razorpay`)
- **Email Delivery Service**: Brevo HTTPS REST API (`https://api.brevo.com/v3/smtp/email`)
- **PDF Generation**: PDFKit (`pdfkit`)
- **Translation API**: MyMemory Free Translation REST API

---

## 📐 System Architecture

```
[ React 19 Frontend (Vercel) ]
     │
     ├─── HTTP REST API (Axios + Bearer Token) ───┐
     ├─── Socket.IO Event Bus (WS / WSS) ────────┤
     └─── LiveKit SFU Media Stream (WebRTC) ─────┼───┐
                                                 │   │
                                                 ▼   │
                              [ Express 5 Backend (Render) ]
                                 │       │       │       │
            ┌────────────────────┘       │       │       └───────────────────┐
            ▼                            ▼       ▼                           ▼
[ MongoDB Atlas ]             [ Cloudinary ]  [ Razorpay ]          [ Brevo Mail API ]
(User/Room/Media DB)          (Video Storage) (Payment Gateway)     (OTP & PDF Receipts)
                                                                             │
                                                                             ▼
                                                                  [ LiveKit SFU Cluster ]
                                                                (Selective Forwarding Unit)
```

### Data & Request Flow
1. **Authentication Flow**: User submits registration -> Node.js backend generates 6-digit OTP -> Dispatched via Brevo HTTPS API -> User inputs OTP -> Verified & issued JWT.
2. **Watch Party Join Flow**: Client connects to Node.js backend -> Socket.IO joins room channel -> REST API requests LiveKit AccessToken (`/api/v1/rooms/:roomId/token`) -> Client connects directly to LiveKit SFU node.
3. **Media Streaming Flow**: Video & audio tracks are published to LiveKit SFU -> LiveKit selectively forwards subscribed streams to all room participants without taxing the client CPU.
4. **Synchronization Flow**: Player play/pause/seek events are emitted over Socket.IO -> Broadcasted to room -> All video player instances update timestamp simultaneously.

---

## 📁 Project Structure

```
Watch Together/
├── backend/
│   ├── src/
│   │   ├── config/             # DB, Cloudinary, Razorpay, Subscription Plans
│   │   ├── constants/          # HTTP status codes
│   │   ├── controllers/        # Auth, Room, Video, Comment, Download, Subscription
│   │   ├── middleware/         # Auth JWT, Async Handlers, Error Handlers
│   │   ├── models/             # Mongoose Schemas (User, Room, Video, Comment, Payment, DownloadHistory)
│   │   ├── routes/             # REST Route definitions
│   │   ├── services/           # Email (Brevo), SMS, PDF Receipt generator
│   │   ├── socket/             # Socket.IO handlers (Watch Party, Chat, Video Sync, WebRTC relay)
│   │   ├── utils/              # ApiError, ApiResponse, Device Helper, Moderation Filter
│   │   └── app.js              # Express app setup & middleware pipeline
│   ├── server.js               # Entry point (HTTP server + Socket.IO initialization)
│   └── package.json            # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── layout/         # Navbar, Footer, Sidebar Drawer
│   │   │   ├── ui/             # Buttons, Inputs, Loaders, Modals
│   │   │   ├── video/          # Custom Video Player component
│   │   │   └── watch-party/    # Chat Panel, Controls, Participant Grid & List, Modals
│   │   ├── contexts/           # Auth, Socket, Theme Context Providers
│   │   ├── hooks/              # useRoom, useWebRTC, useRecording custom hooks
│   │   ├── pages/              # Home, WatchPartyRoom, VideoDetails, Profile, Downloads, Subscriptions
│   │   ├── services/           # Axios API instances & Service methods
│   │   ├── utils/              # Class Merger, Lightweight Toast Notification system
│   │   ├── App.jsx             # Main router & app root
│   │   └── main.jsx            # React entry point
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite build configuration
└── README.md                   # Project documentation
```

---

## 💻 Installation Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas Account**: Database connection string
- **Cloudinary Account**: Cloud name, API key, API secret

### 1. Clone Repository
```bash
git clone https://github.com/samit-ops/WatchTogether.git
cd "Watch Together"
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables
Create `.env` in `backend/` and `.env` in `frontend/` following the guidelines in the [Environment Variables](#environment-variables) section.

### 4. Run Development Servers

#### Start Backend Server
```bash
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000`*

#### Start Frontend Application
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

### 5. Production Build
```bash
cd frontend
npm run build
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable Name | Description | Example / Default |
|:---|:---|:---|
| `PORT` | Node server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `MONGODB_URI` | MongoDB Atlas connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `FRONTEND_URL` | Client URL for CORS policy | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `super_secret_jwt_key` |
| `JWT_EXPIRE` | JWT token expiration time | `30d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_api_secret` |
| `RAZORPAY_KEY_ID` | Razorpay Test Mode Key ID | `rzp_test_xxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Mode Secret | `xxxxxx` |
| `SMTP_HOST` | SMTP Host server | `smtp.gmail.com` / `smtp-relay.brevo.com` |
| `SMTP_PORT` | SMTP Server Port | `587` |
| `SMTP_USER` | Email address / Brevo API User | `your_email@domain.com` |
| `SMTP_PASS` | App password / Brevo SMTP key | `your_app_password` |
| `SMTP_FROM` | Sender address header | `"WatchTogether" <email@domain.com>` |
| `LIVEKIT_API_KEY` | LiveKit SFU API Key | `devkey` |
| `LIVEKIT_API_SECRET` | LiveKit SFU API Secret | `secret` |
| `LIVEKIT_URL` | LiveKit Server WebSocket URL | `wss://demo-sfu.livekit.cloud` |

### Frontend (`frontend/.env`)

| Variable Name | Description | Example / Default |
|:---|:---|:---|
| `VITE_API_URL` | Backend REST API Base Endpoint | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Backend Socket.IO Server Endpoint | `http://localhost:5000` |
| `VITE_LIVEKIT_URL` | LiveKit SFU WebSocket Server URL | `wss://demo-sfu.livekit.cloud` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Public Key ID for Checkout | `rzp_test_xxxxxx` |

---

## 📖 User Guide

### 1. User Registration & Security Verification
1. Click **Sign Up** on the top navigation bar.
2. Enter your Name, Email, Password, City, and 6-digit Pincode.
3. Submit the form to trigger the 6-digit Email OTP sent via Brevo.
4. Input the code in the OTP modal to activate your account.

### 2. Browsing & Searching Videos
1. Navigate to **Home** to view featured platform videos.
2. Use the search bar to filter videos by title, description, or category.

### 3. Watching Videos & Custom Player Controls
1. Click any video card to open `VideoDetails.jsx`.
2. Use player controls: Play/Pause, Volume, Fullscreen, Seek ±10s.
3. On mobile devices, double-tap the right side of the video to skip +10s or left side to rewind -10s.

### 4. Posting Multilingual Comments & Translating
1. Scroll to the comment section on any video page.
2. Type your comment and optionally toggle **Show my location**.
3. Click **Translate** below any comment and select a target language to view the instant translation.

### 5. Creating & Joining Watch Parties
1. Click **Watch Party** in the navbar.
2. Choose between **Uploaded Video Watch Party** or **Live Watch Party**.
3. Copy the generated invite link (`/watch-party/:roomId`) and send it to friends.
4. Turn on your microphone, camera, or share your screen using the control bar.
5. Chat in real-time using the right-hand Chat drawer.

### 6. Upgrading Subscriptions & Downloading Videos
1. Click **Subscriptions** in the navigation drawer.
2. Select Bronze, Silver, or Gold tier and click **Upgrade Plan**.
3. Complete test checkout via Razorpay (use test card or `success@razorpay`).
4. Once completed, your daily download limit will upgrade immediately, and an official transaction invoice will be sent directly to your registered email address with the attached PDF receipt file.
5. Click **Download** on any video page to save it. View all downloads under **Profile -> Downloads**.

---

## 🎥 Watch Party Workflow

```
[ Host Creates Room ] ──► [ Selects Type: Live or Video ] ──► [ Room ID Generated ]
                                                                       │
[ Participants Join via Invite Link ] ◄────────────────────────────────┘
                 │
                 ├──► [ REST API requests LiveKit Token ] ──► [ Connects to LiveKit SFU ]
                 │                                                   │
                 │                                                   ├── Video Grid Stream
                 │                                                   ├── Audio Track
                 │                                                   └── Screen Sharing
                 │
                 └──► [ Connects to Socket.IO ] ─────────────► [ Real-time State Bus ]
                                                                     │
                                                                     ├── Sync Play/Pause/Seek
                                                                     ├── Live Room Chat
                                                                     └── Participant Roster
```

### Video Playback Synchronization
- In **Uploaded Video Watch Parties**, whenever a host plays, pauses, or seeks the video player, a Socket.IO event (`play`, `pause`, `seek`) is emitted with current playback timestamp.
- Subscribed client players catch the event and align their `currentTime` within <200ms delta.

### Host Moderation Privileges
- **Lock Room**: Host can lock the meeting room to prevent new users from joining.
- **Member Management**: Host can promote users to Moderator, demote them back to Guest, or kick them from the room.
- **Ownership Transfer**: Host can transfer host ownership to any participant.

---

## 📤 Video Upload Guide

Platform users can upload videos to build their library and host watch parties.

### Supported Video Specifications
- **Supported Formats**: `.mp4`, `.webm`, `.mov`, `.mkv`
- **Supported Aspect Ratios**: 16:9 (Widescreen), 9:16 (Vertical)

### Upload Restrictions
> [!IMPORTANT]
> **Maximum File Size Limit**: The maximum allowable video upload size is **100 MB** per video file. This restriction is enforced due to the maximum file upload limits of the **Cloudinary Free Developer Tier**.

---

## 🛡️ Authentication & Security

### Email OTP Verification
- Powered by the **Brevo HTTPS REST API** (`https://api.brevo.com/v3/smtp/email`).
- Dispatches a secure 6-digit numeric verification code valid for 10 minutes.
- **Quota Limit**: ~300 verification emails/day available under the Brevo Free Tier.

### Mobile SMS OTP Notice
> [!NOTE]
> **Mobile SMS OTP is intentionally disabled** in production. SMS telecommunication gateways (e.g. Twilio, Fast2SMS) require paid subscriptions and registered DLT entity approvals. The system seamlessly falls back to Email OTP.

---

## 📡 Real-Time Communication

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REAL-TIME COMMUNICATION ENGINE                  │
├───────────────────────────────────┬────────────────────────────────────┤
│           SOCKET.IO               │            LIVEKIT SFU             │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Room Join & Roster State Sync   │ • High-Capacity Video Grid Stream  │
│ • Live Text Messaging & Chat      │ • Spatial Audio Stream Routing     │
│ • Playback Sync (Play/Pause/Seek) │ • HD Screen Sharing                │
│ • User Typing Indicators          │ • Adaptive Bitrate Subscription    │
│ • Host Permissions & Kick Events  │ • Selective Track Subscriptions    │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel)
1. Import repository into Vercel Dashboard.
2. Select Framework Preset: **Vite**.
3. Add Environment Variables:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api/v1`
   - `VITE_SOCKET_URL` = `https://your-backend.onrender.com`
   - `VITE_LIVEKIT_URL` = `wss://demo-sfu.livekit.cloud`
   - `VITE_RAZORPAY_KEY_ID` = `rzp_test_xxxxxx`
4. Click **Deploy**.

### Backend Deployment (Render)
1. Create a new **Web Service** on Render.
2. Set Build Command: `cd backend && npm install`
3. Set Start Command: `cd backend && npm start`
4. Add Environment Variables listed in [Backend Environment Variables](#backend-env).
5. Click **Create Web Service**.

---

## ⚠️ Known Limitations

- **Email Delivery Quota**: Email OTP delivery is bound by the **Brevo Free Plan quota (~300 emails/day)**.
- **Mobile SMS OTP**: Disabled due to paid carrier gateway costs.
- **Video Upload Size**: Video uploads are limited to **100 MB** due to **Cloudinary Free Tier restrictions**.
- **Browser Media Permissions**: Camera, Microphone, and Screen Sharing require explicit user browser permissions and HTTPS connection context.

---

## 🔮 Future Enhancements

- **Commercial Mobile SMS OTP**: Integration with Twilio/Plivo for SMS authentication.
- **Adaptive Bitrate Streaming (HLS/DASH)**: Automatic video transcoding for variable bandwidth conditions.
- **Cloud Session Recording**: Server-side LiveKit Egress recording saved directly to S3/Cloudinary storage.
- **AI Sentiment & Moderation**: Real-time AI toxicity screening on live chat messages using OpenAI/Gemini models.

---

## 🖼️ Screenshots & UI Mockups

| Feature | Mockup Placeholder |
|:---|:---|
| **Landing Page** | `![Landing Page](docs/screenshots/landing_page.png)` |
| **Authentication** | `![Authentication & OTP](docs/screenshots/auth_otp.png)` |
| **Video Platform** | `![Video Platform](docs/screenshots/video_platform.png)` |
| **Watch Party Grid** | `![Watch Party Grid](docs/screenshots/watch_party_grid.png)` |
| **Live Meeting Call** | `![Live Meeting Call](docs/screenshots/live_meeting.png)` |
| **Custom Player** | `![Custom Player](docs/screenshots/custom_player.png)` |
| **Multilingual Comments**| `![Multilingual Comments](docs/screenshots/comments.png)` |
| **User Profile & Downloads**| `![Downloads Dashboard](docs/screenshots/downloads.png)` |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer & Submission Info

- **Developer**: Samit Kumar
- **Project Name**: WatchTogether — High-Performance Social Video & Watch Party Platform
- **Submission Purpose**: Full-Stack Software Engineering Internship Project Submission
- **GitHub Repository**: [https://github.com/samit-ops/WatchTogether](https://github.com/samit-ops/WatchTogether)
- **Live Demo (Frontend)**: [https://watch-together-mauve.vercel.app](https://watch-together-mauve.vercel.app)
- **Live API (Backend)**: [https://watchtogether-backend.onrender.com](https://watchtogether-backend.onrender.com)

