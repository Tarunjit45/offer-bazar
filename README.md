<div align="center">
  <img width="1200" height="auto" alt="OfferBazar Banner" src="/logo.jpeg" style="border-radius: 100px; margin-bottom: 20px;" />
  
  # 🚀 OfferBazar
  ### India's #1 Premium Site for Amazon Loot Alerts, Flipkart Price Errors & Curated Deals
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

---

## 🌟 Overview
**OfferBazar** is a high-performance web platform designed to aggregate and display the most urgent and valuable deals across major Indian e-commerce sites. Built with a focus on speed, aesthetics, and user engagement, it serves as a central hub for "Loot Lovers."

## ✨ Key Features

### 🛒 Dynamic Deal Discovery
- **Compact UI/UX**: Ultra-compact card design maximizing information density without visual clutter.
- **Categorized Browsing**: Products are grouped by categories (Fashion, Electronics, etc.) in smooth horizontal scrollable rows.
- **Segment Zones**: Dedicated sections for **Loot Zone** (Critical deals), **Coupon Deals**, and **Best Offers**.
- **Interactive BUY NOW**: Premium hover effects on product cards to drive user action.

### 🛡️ Powerful Admin Engine
- **Deal Management**: Securely add, edit, or delete deals instantly via a dedicated Admin Panel.
- **Pencil Edit Mode**: Admins can edit any posted deal directly, with fields pre-filled for convenience.
- **Intelligent Scraping**: Automatic title, price, and image extraction from product URLs.
- **Local Compression**: Images are compressed locally to Base64 to keep storage lightweight and efficient.

### ⏳ Automation & Reliability
- **Auto-Expiry System**: Every deal automatically expires 2 months after posting.
- **Silent Cleanup**: Background maintenance routine that permanently deletes expired deals when admins visit the site.
- **Real-time Sync**: Powered by Firestore `onSnapshot` for instant deal updates without page refreshes.

## 🛠️ Technical Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS.
- **Backend/DB**: Google Firebase (Firestore, Auth, Analytics).
- **Icons**: Lucide React.
- **Scraping**: Node-based worker for metadata extraction.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- A [Firebase Project](https://console.firebase.google.com/) configured.

### Local Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/confluxdotai-bot/offer-bazar.git
   cd offer-bazar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` or update `src/lib/firebase.ts` with your Firebase configuration.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📱 Community
Join our community for instant alerts:
- [Telegram Channel](https://t.me/offerbazaarofficial01)
- [WhatsApp Channel](https://whatsapp.com/channel/0029VbBTx0y2f3EDHnwLHJ3q)

---

<div align="center">
  <p>&copy; 2026 OfferBazar | Built for the Deal Hunters of India</p>
</div>
