# Fit Rave — Summer Wellbeing App

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.16.0-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

A modern, mobile-first web application designed for a company's **Fit Rave** event. Employees can browse sports/wellbeing activities, choose quota-limited activities, and track their selection status. It also includes an administrator dashboard to manage schedules, employees, and activities.

---

## 🌟 Key Features

### 👤 Employee/Participant Flow
* **Seamless Splash & Login**: Simple entry using employee credentials.
* **Home Dashboard**: Quick overview of the event summary and primary calls-to-action (CTA).
* **Explore Activities**: 
  * **Segmented Activities**: Limited quota, requires active selection (e.g., Running, Fitness, Aqua Yoga, Zumba). Single booking slot event-wide.
  * **Open Activities**: Unlimited quota, informational and non-blocking (e.g., Swimming, Badminton, Volleyball).
* **Smart Activity Selection**:
  * Real-time slot and remaining-quota indicators.
  * Atomic slot switching (releases old activity slot and secures the new one in one single operation).
  * Strict registration deadline enforcement.
* **My Activities**: A persistent "proof of status" page summarizing the employee's confirmed choices and marked open activities.
* **Event Schedule & Dresscode**: Clear schedule details for Day 1 and Day 2 with custom dresscode suggestions.

### 🔑 Admin Flow
* **Activity Management**: Track activity quotas, locations, and category allocations.
* **Employee Management**: Monitor participant registrations, search, and manage list details.
* **Schedule Control**: View and coordinate agendas.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript
* **Styling**: Tailwind CSS v4, `@base-ui/react`, Shadcn UI (Radix)
* **State Management & Caching**: TanStack React Query v5
* **Animations**: Motion (Framer Motion) for page transitions and micro-interactions
* **Backend Database**: Firebase Firestore
* **Scripting**: TSX for Firebase Firestore seeding

---

## 📂 Project Structure

```bash
src/
├── app/                  # Next.js App Router folders
│   ├── (admin)/          # Admin-only dashboard layouts and pages
│   ├── (app)/            # Employee app main views (explore, home, my-activities, profile, schedule)
│   ├── api/              # API route handlers
│   ├── login/            # Authentication login screen
│   ├── globals.css       # Core Tailwind CSS styles and custom themes
│   ├── layout.tsx        # Base App Layout
│   └── providers.tsx     # Context & client query providers
├── components/           # Generic / reusable UI components (shadcn components)
├── features/             # Feature-based modular structure
│   ├── activities/       # Activities explore list, data hooks, and schemas
│   ├── admin/            # Admin-related components and operations
│   ├── auth/             # Employee login status, hooks, and context
│   ├── event/            # Schedule agenda types and hooks
│   └── selection/        # Slot booking, cancel selection, and state updates
└── lib/                  # Helper modules (Firebase config, database clients)
```

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) and `npm` installed.

### 2. Environment Setup
Clone the `.env.example` file and save it as `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Firebase credentials in `.env.local`:

```env
# Firebase Client Configuration (Safe for browser/client-side execution)
NEXT_PUBLIC_FIREBASE_API_KEY=your_client_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK Configuration (Server-only secrets, never expose to client)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPemPrivateKeyDetailsHere\n-----END PRIVATE KEY-----\n"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Database
Populate your Firestore database with the initial event, activities, and employee mock data:
```bash
npm run seed
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📦 Production Build

To build the application for production deployment:
```bash
npm run build
npm run start
```
