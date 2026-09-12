# 🌾 MandiMitra - Smart Crop Procurement & AI Assistant Platform

An intelligent, multilingual crop procurement platform designed to streamline agricultural produce operations, multi-crop slot booking, quality grading, and farmer assistance across India.

## 🚀 Key Features

- **🌾 Multi-Crop Booking & Shared Token Series**:
  - Book slots for single or multiple crops (Wheat, Paddy, Mustard, Maize, etc.) under a single unified token (e.g., `#BHO-113`).
  - Automatic collision-free token generation per procurement centre.
- **🤖 MandiMitra AI Voice & Chat Assistant**:
  - **Dual Engine**: Google Gemini 2.5 Flash API integration with automatic fallback to a deterministic smart rule engine (zero API key needed).
  - **9 Grounded Tools**: Real-time token tracking, queue rank, centre wait times, MSP pricing, weighbridge data, DBT payment status, and dispute logging with zero hallucination.
  - **Voice Messaging Suite**: Microphone recording (`MediaRecorder` API) with custom audio message bubble player, Speech-to-Text dictation, and auto-speak voice responses.
  - **Multilingual Support**: Real-time UI and voice localization in Hindi (हिंदी), Bengali (বাংলা), and English.
- **🏢 Official Procurement Portal**:
  - Verification & QC grading, weighbridge gross/tare recording, multi-crop batch inspection, and DBT payment dispatch.
  - Official cancellation with validated audit reasons (invalid info, quality mismatch, no-show) with instant live alerts to farmers.
- **🧑‍🌾 Farmer Self-Service**:
  - Live token tracker with visual step progression, queue countdown, estimated wait time, and farmer-side cancellation.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org) + React 19
- **Styling**: Tailwind CSS 4 + Lucide Icons
- **Database & ORM**: PostgreSQL + Prisma ORM
- **AI & NLP**: Google Gemini 2.5 Flash REST API + Web Speech API (STT/TTS) + Web Audio MediaRecorder

---

## ⚙️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your PostgreSQL `DATABASE_URL` and optionally provide `GEMINI_API_KEY`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_procurement?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Google Gemini API Key for AI Assistant (fallback engine works out-of-the-box)
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3. Run Database Migrations
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

```bash
npm run build
npm run start
```
