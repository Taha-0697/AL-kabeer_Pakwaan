# Al-Kabeer Pakwaan & Catering – Web Portal

A production-grade web portal for managing a catering business: event bookings, payments, dual-store inventory, cash book, crockery, employees and role-based access. Built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma ORM and JWT authentication. It replicates and extends the features of the Android mobile application.

---

## Features

- **JWT Authentication & RBAC**: stateless tokens (signed with `jose`) mapped from Firebase Auth, with 7 roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `BOOKING_STAFF`, `ACCOUNTS_STAFF`, `INVENTORY_STAFF`, `VIEWER`.
- **Dual Inventory Management**
  - **Super Store (Warehouse)**: central stock and restock logging.
  - **Sub Store (Kitchen)**: operational stock fed only through Super Store transfers, with auto-deduction based on recipe yield.
- **Event Bookings & Payments**: full order workflow with auto-generated receipt numbers, transport fee formulas (per-km rate and petrol efficiency), sales tax (GST), crockery assignment and labour allocation.
- **Menu & Recipes**: dishes, recipes and multi-meat variant pricing.
- **Cash Book**: cash in / cash out ledger with real-time balance.
- **Crockery Tracking**: utensil stock and event recovery logging.
- **Employees & Users**: staff directory, attendance, salaries and access control.
- **Dashboard**: real-time KPIs and charts.
- **Local Photo Storage**: uploads are saved to `public/uploads/` and referenced by relative web paths.
- **Dual Database Support**: Neon PostgreSQL and SQL Server (SSMS) through Prisma.
- **OpenAPI 3.0 Spec**: available at `/api/openapi` or `/openapi.json`.
- **Modular Architecture**: Atomic Design components, kept to a maximum of 100 lines per file.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma |
| Database | Neon PostgreSQL / SQL Server |
| Auth | JWT (`jose`), Firebase Auth mapping |
| Validation | Zod |
| CI/CD | GitHub Actions |

---

## Project Structure

```
AL-kabeer_Pakwaan/
├── .github/workflows/     # CI/CD pipelines
├── app/                   # App Router pages & REST API route handlers
│   ├── api/               # Auth, Bookings, Inventory, OpenAPI
│   ├── bookings/          # Booking list & new order form
│   ├── inventory/         # Super Store & Sub Store management
│   ├── cashbook/          # Cash In / Cash Out ledger
│   ├── menu/              # Dishes, recipes, variant prices
│   ├── clients/           # Customer directory & spending metrics
│   ├── crockery/          # Utensil stock & event recovery
│   ├── employees/         # Staff, attendance & salaries
│   ├── users/             # Access control & RBAC permissions
│   ├── settings/business/ # Transport rates, petrol formulas, tax config
│   ├── login/             # Authentication page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard (KPIs & charts)
├── components/            # Atomic component library
│   ├── ui/                # Button, Input, Card, Badge, Modal, StatCard
│   ├── layout/            # Sidebar, Header, PageContainer
│   ├── auth/              # LoginForm
│   ├── dashboard/         # KpiGrid, RecentBookingsTable
│   ├── bookings/          # BookingListTable, NewOrderForm, PaymentModal
│   └── inventory/         # InventoryTable, TransferModal
├── lib/                   # Business logic
│   ├── auth/jwt.ts        # JWT signing & verification
│   ├── db/index.ts        # Prisma client & health check
│   ├── storage/index.ts   # Local file upload handler
│   ├── validations/       # Zod schemas
│   └── config.ts          # Central configuration
├── prisma/
│   ├── schema.prisma      # Data models
│   └── seed.ts            # Seeder (Super Admin, menu, stock, clients)
├── public/
│   └── openapi.json       # OpenAPI 3.0 specification
├── scripts/               # Utility scripts
├── middleware.ts          # Route protection
├── .env.example           # Environment variable template
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- A Neon PostgreSQL or SQL Server database

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/Taha-0697/AL-kabeer_Pakwaan.git
   cd AL-kabeer_Pakwaan
```

2. **Install dependencies**
```bash
   npm install
```

3. **Configure environment variables**
```bash
   cp .env.example .env
```
   Open `.env` and fill in your database connection string and secrets.

4. **Set up the database and seed data**
```bash
   npx prisma db push
   npx ts-node prisma/seed.ts
```

5. **Start the development server**
```bash
   npm run dev
```

6. Open [http://localhost:3000/login](http://localhost:3000/login).

### Default Login (development only)

| Field | Value |
| :--- | :--- |
| Email | `admin@alkabeer.com` |
| Password | `admin123` |

> ⚠️ Change this password immediately in any non-local environment.

---

## API Documentation

The OpenAPI 3.0 specification is served at:

- `/api/openapi`
- `/openapi.json`

---

## Roles

| Role | Purpose |
| :--- | :--- |
| `SUPER_ADMIN` | Full system access |
| `ADMIN` | Administration |
| `MANAGER` | Operations management |
| `BOOKING_STAFF` | Event bookings |
| `ACCOUNTS_STAFF` | Payments & cash book |
| `INVENTORY_STAFF` | Stock management |
| `VIEWER` | Read-only access |

---

## Author

**Taha** – [@Taha-0697](https://github.com/Taha-0697)