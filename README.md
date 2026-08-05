# ROOMIO — Apartment Management System

> A modern, all-in-one apartment management platform integrating a web dashboard with LINE OA for seamless communication between property managers, tenants, and staff.

🌐 **Live Demo:** [roomio-apt.vercel.app](https://roomio-apt.vercel.app)

---

## Overview

Roomio simplifies property management by centralizing everything in one place — tenant records, room status, utility tracking, billing, maintenance, cleaning schedules, parcel notifications, and staff management. Communication with tenants and staff happens through LINE Official Account (LINE OA), making it accessible without requiring a separate app.

---

## Features

### 🏢 For Property Owners / Managers (Web Dashboard)
- **Dashboard** — Overview of occupancy, revenue, expenses, overdue payments, and recent activity
- **Building & Room Management** — Add buildings and rooms, track availability and room status
- **Tenant Management** — Manage tenant profiles, lease dates, deposits, and LINE contact linking
- **Utility Usage** — Input monthly meter readings per room; electricity and water tracked separately
- **Billing System** — Auto-generate monthly bills and send them to tenants via LINE OA; track payment status with receipt verification via EasySlip API
- **Staff Management** — Add and manage housekeepers, technicians, and general staff
- **Cleaning Schedule** — Create cleaning schedules, assign housekeepers, manage time slots
- **Maintenance Requests** — View and track maintenance tickets submitted by tenants
- **Parcel Management** — Log parcel arrivals and notify tenants automatically via LINE OA
- **Announcements** — Broadcast messages to all tenants through LINE OA
- **Settings** — Configure apartment utility rates, bank payment details, LINE credentials, and account info

### 📱 For Tenants (via LINE OA)
- View tenancy details and room information
- Book cleaning and maintenance services
- Pay bills and upload payment slips
- Track parcel delivery status
- Receive real-time announcements from management

### 🛠️ For Housekeepers & Technicians (via LINE OA)
- View daily work schedule and assigned tasks
- Update task/work status in real time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind CSS, Material UI |
| Backend | Next.js API Routes, Serverless Functions |
| Auth | NextAuth.js |
| Database | MongoDB (via Mongoose) |
| File Storage | AWS S3 |
| Messaging | LINE Messaging API |
| Payment Verification | EasySlip API |
| Deployment | Vercel |
| Package Manager | Bun |

---

## System Architecture

```
Tenants / Staff
    │
    ▼
LINE OA ──────────────────────────────────┐
                                          │
Owner / Manager                           ▼
    │                          Frontend (Next.js on Vercel)
    ▼                               │
Website ──────────────────────► Backend (API Routes + NextAuth)
                                    │              │
                              MongoDB          AWS S3
                                          │
                              External Services:
                              LINE API Messaging
                              EasySlip
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- MongoDB Atlas account (or local MongoDB)
- AWS S3 bucket
- LINE Developer account with a Messaging API channel and LINE Login channel
- EasySlip API key

### Installation

```bash
git clone https://github.com/ncwjsp/roomio.git
cd roomio
bun install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name

# EasySlip
SLIP_ACCESS_TOKEN=your_easyslip_api_key
```

### Running Locally

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## LINE Configuration

After registering an account on Roomio, you'll be prompted to configure LINE OA integration:

1. Create a [LINE Developer](https://developers.line.biz/) account
2. Create a **Messaging API** channel — copy the **Channel Access Token** and **Channel Secret**
3. Create a **LINE Login** channel and add LIFF apps for each feature (Cleaning, Maintenance, Parcels, Payment, Announcement, TenantInfo, Schedule, Tasks)
4. Paste the credentials and LIFF IDs into the Roomio registration page
5. Set your Roomio webhook URL in the LINE Developer console:
   ```
   https://roomio-apt.vercel.app/api/line?id=<your_landlord_id>
   ```

---

## Project Structure

```
roomio/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Backend API endpoints
│   └── (pages)/          # Frontend pages
├── components/           # Reusable React components
├── models/               # Mongoose database models
├── lib/                  # Utility functions and config
└── public/               # Static assets
```

---

## Authors

| Name | Student ID |
|---|---|
| Nueachai Wijitsopon | 6510449 |
| Wattanan Jiratriluk | 6520214 |
| Wai Phyo Oo | 6520213 |

**Advisor:** Asst. Prof. Dr. Thanachai Thumthawatworn  
**Institution:** Assumption University of Thailand — Vincent Mary School of Science and Technology  
**Course:** CSX 3010 Senior Project 1 (2/2024)

---

## License

This project was developed as part of a senior capstone course at Assumption University of Thailand.

This repository is licensed under the MIT License, which permits reuse, modification, and distribution of the code, provided that proper credit is given to the original authors.

> Note: Usage of this project may be subject to additional university policies or intellectual property regulations.
