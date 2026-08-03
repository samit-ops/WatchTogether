# 🎬 Watch Together — Next-Gen Social Video Platform

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-success?style=flat-square&logo=vercel)](https://watch-together-mauve.vercel.app)
[![Render Deployment](https://img.shields.io/badge/Backend-Render-blue?style=flat-square&logo=render)](https://watchtogether-backend.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

**Watch Together** is a full-stack social video streaming platform featuring real-time synchronized Watch Parties, WebRTC video calling, controlled video downloads with plan tiers, Razorpay payment integration, dynamic IST time-based themes, new device security OTP verification, and AI-powered multilingual comment translation with anti-abuse moderation.

---

## 🌟 Comprehensive Feature Verification (6 Tasks)

### 1. 🎥 Real-Time Watch Party & WebRTC Video Calls
- **Synchronized Video Playback**: Socket.IO room synchronization keeps play, pause, seek, and playback speed 100% in sync across all participants.
- **Multi-Party WebRTC Video/Audio Calling**: Real-time peer-to-peer audio and video calls during watch party sessions.
- **In-Session Chat**: Live messaging drawer with instant system join/leave notifications.
- **Screen Sharing**: Dynamic screen sharing with seamless RTCPeerConnection track replacement.
- **Call Controls**: Mute/Unmute Mic, Camera On/Off, Leave Room, and Participant List drawer.
- **Host Moderation Privileges**: Lock/Unlock room, Kick users, Promote/Demote moderators, and Transfer host role.
- **Local Session Recording**: Built-in MediaRecorder integration allowing hosts to record sessions and download WebM video files locally.

---

### 2. 📥 Controlled Video Downloads with Plan Tier Restrictions
- **Daily Download Limits**:
  - **Free Tier**: 1 download per day.
  - **Bronze Tier (₹199)**: 5 downloads per day.
  - **Silver Tier (₹499)**: 15 downloads per day.
  - **Gold Tier (₹999)**: Unlimited downloads.
- **Daily Limit Auto-Reset**: Daily limits automatically reset at midnight.
- **Downloads Library**: Dedicated `/downloads` dashboard listing video details, download timestamp, file size, and plan tier badge.
- **Bypass Prevention**: Server-side API enforcement returns HTTP 403 when daily download quotas are exceeded.

---

### 3. 💳 Subscription Upgrades & Razorpay Test Payment Integration
- **Plan Matrix**: Free, Bronze (₹199), Silver (₹499), and Gold (₹999) plans.
- **Razorpay Integration**: Integrated Razorpay Checkout SDK with test mode order creation and HMAC SHA256 signature verification.
- **Automated Database Upgrades**: Payment verification automatically updates user plan tier, status, and expiration date in MongoDB.
- **PDF Invoice & Confirmation Email**: Generates an official PDF receipt using `pdfkit` and dispatches it via Brevo HTTPS REST API to the user's registered email.

---

### 4. 📺 Custom Video Player & Touch Gestures
- **Modern Playback Controls**: Custom HTML5 video player with Play/Pause, volume slider, mute toggle, fullscreen toggle, speed adjustment (0.5x – 2.0x), looping, and Picture-in-Picture.
- **10s Skip & Keyboard Shortcuts**: -10s Rewind and +10s Forward controls. Keyboard shortcuts: `Space`, `K`, `J`, `L`, `F`, `M`, and Arrow keys.
- **Mobile Touch Gestures**: Double-tap right (+10s) and double-tap left (-10s) with visual ripple overlay.
- **Timeline & Next Video Auto-Play**: Progress bar, duration formatting, buffer loader, and 5-second countdown overlay for up-next videos.

---

### 5. 🕒 Personalization, Time-Based Themes & Security OTP
- **Auto Light/Dark Theme Switching**: Automatically applies **Light Theme** between **10:00 AM and 12:00 PM IST**, and defaults to **Dark Theme** for all other hours.
- **Manual Theme Override**: Persistent theme toggle (`Auto`, `Light`, `Dark`) saved in `localStorage` and user database profile.
- **City & Region Detection**: IP-based geolocation (`geoip-lite`) and browser geolocation.
- **New City/Device Security OTP**: Detects login attempts from new cities or devices and triggers 6-digit OTP email verification via Brevo HTTPS REST API.

---

### 6. 🌐 Multilingual Comments & Moderation Safety
- **Instant Translation Engine**: Translate comments into 6+ languages (English, Hindi, Spanish, French, German, Japanese) using the MyMemory Translation API.
- **Privacy-Safe Location**: Optional "Show my location" toggle displaying city badges while respecting user privacy choices.
- **Anti-Abuse & Anti-Spam Filter**: Automated filter blocks profane language, repetitive spam patterns, and excessive special characters.
- **Reactions & Moderation Reports**: Like and Dislike reactions. Reporting flags comments for review (`Flagged for Review`) instead of auto-deleting.
- **Real-Time Comment Sync**: Real-time comment addition, updates, and deletions powered by Socket.IO.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Socket.IO Client, WebRTC.
- **Backend**: Node.js, Express.js (Trust Proxy configured), MongoDB Atlas (Mongoose), Socket.IO.
- **Email & PDF Engine**: Brevo HTTPS REST API (`https://api.brevo.com/v3/smtp/email`), PDFKit.
- **Payment Gateway**: Razorpay Test Mode API.
- **Deployments**: Vercel (Frontend), Render (Backend).

---

## 📖 User Manual & How to Use

### 1. Account Registration & Security OTP
1. Click **Sign up** in the navbar and enter your name, email, and password.
2. An OTP verification modal will appear on screen.
3. Check your email for the 6-digit verification code sent via Brevo.
4. Enter the 6 digits to verify your account and proceed to login.

### 2. Creating or Joining a Watch Party
1. Click **Watch Party** in the top navigation bar.
2. Select a video and click **Create Watch Party**.
3. Share the generated room link with your friends.
4. Turn on your microphone or camera, use the live chat drawer, or share your screen.
5. The room host can control playback synchronization, lock the room, promote moderators, or record the session.

### 3. Upgrading Your Subscription Plan
1. Navigate to **Subscription Plans** (`/subscriptions`).
2. Select **Bronze**, **Silver**, or **Gold** and click **Upgrade Plan**.
3. Complete the payment using Razorpay Test Mode (Use test cards or UPI ID `success@razorpay`).
4. Upon successful payment, your account will be upgraded immediately, and a PDF receipt invoice will be sent to your email.

### 4. Downloading Videos
1. Open any video and click the **Download** button below the video player.
2. Free users can download 1 video per day. Upgrade to Bronze, Silver, or Gold for higher daily quotas.
3. View all your downloaded videos anytime under **Downloads** (`/downloads`).

### 5. Using Multilingual Comments
1. Scroll down to the comment section of any video.
2. Type your comment and optionally check **Show my location**.
3. To translate any comment into your preferred language, click **Translate** next to the comment and pick your language from the dropdown menu.

---

## 📄 License
This project is licensed under the MIT License.
