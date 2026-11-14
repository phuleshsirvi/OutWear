# OutWear 👗✨

**OutWear** is a modern, responsive full-stack smart wardrobe management and styling dashboard. Designed for personal and multi-user closet management, OutWear helps users catalog their clothes, plan and save cohesive outfits, track wear frequency, identify underused pieces, discover smart outfit suggestions, and prevent redundant purchases with intelligent duplicate detection.

---

## 🌟 Key Features

- **🔐 Robust Multi-User Authentication**:
  - Secure registration and login powered by `bcryptjs` (cost factor 12) and JWT stored in `httpOnly` cookies.
  - Protection against timing attacks for user enumeration via dummy bcrypt comparisons.
  - Automatic session restoration and unauthorized request redirection.

- **🧥 Wardrobe Catalog & Management**:
  - Add, edit, view, and delete clothes with rich metadata (name, category, color, season, occasion, fabric, price).
  - Floating glass search and filter bar with interactive category pills, color dropdowns, and removable active chips.
  - Real hex color swatches and status pills ("Never worn", "Rarely worn", "Worn N times").

- **☁️ Cloud Photo Storage**:
  - Drag-and-drop and file picker photo uploads directly processed to Cloudinary.
  - 5MB file size limits, WebP/JPEG/PNG type validation, and automated Cloudinary cleanup on item deletion or replacement.

- **✨ Outfit Builder & Visual Collages**:
  - Build outfits from 2 to 12 items with a sticky selection strip showing overlapping thumbnails.
  - Dynamic validation counter that turns green when minimum items are met.
  - Beautiful 2x2 visual collage cards with occasion badges and quick wear logging.

- **💡 Smart Style Suggestions**:
  - Generates recommended outfits using color harmony rules, season appropriateness, occasion matching, and wardrobe rotation.
  - Animated SVG circular Score Ring and pastel reason badges explaining why pieces pair well.
  - Interactive upcoming carousel with desktop controls and mobile touch swipe.

- **🛑 "Before You Buy" Duplicate Detection**:
  - Evaluates items before purchase against existing pieces in the user's wardrobe.
  - Instant **Go / Think / Skip** verdict banners with color similarity scores and percentage matches.

- **📅 Wear Tracking & History**:
  - One-click "Wore today" action with retroactive calendar date selector.
  - Protection against duplicate logs on the same calendar day.
  - Timeline view grouped by month with single-click Undo capability.

- **⏳ Underused Clothing Audit**:
  - Filter items unworn for 30, 60, or 90 days, or never worn.
  - Gradient progress indicator showing percentage of wardrobe left neglected.

- **📊 Wardrobe Analytics (Zero External Chart Libraries)**:
  - Top 4 KPI metric cards (Total items, Outfits, Total wears, Wardrobe valuation).
  - Pure SVG donut chart displaying wardrobe breakdown by color.
  - 30-day wear bar chart with interactive day/month tooltips and 7d/30d filter.
  - 5 ranking glass cards: Most worn, least worn, best value, worst value, and tied-up money.

- **🎨 Soft Glassmorphic Aesthetic**:
  - Built with Tailwind CSS v4, frosted glass cards (`backdrop-blur-xl`), soft lavender-to-mint gradient canvas, and responsive mobile bottom rail navigation.

- **🛡️ Production Hardening**:
  - Helmet security headers, compression, strict CORS origin controls, 100kb payload limits, rate limiting (auth, uploads, and API), and centralized error handling with `requestId` tracing.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, React Router 7 |
| **Backend** | Node.js, Express (ES Modules), Prisma ORM |
| **Database** | PostgreSQL (Supabase) with connection pooling and direct migrations |
| **Security** | Helmet, Express Rate Limit, Compression, Cookie Parser, Zod, BcryptJS |
| **Media Storage** | Cloudinary REST API |

---

## 📁 Repository Structure

```text
OutWear/
├── .env.example                # Backend environment configuration template
├── README.md                   # Complete project documentation
├── package.json                # Root package with concurrent dev scripts
├── client/                     # React 19 Frontend (Vite + Tailwind CSS v4)
│   ├── .env.example            # Client environment configuration template
│   ├── index.html              # Vite HTML entry point with favicon
│   ├── package.json            # Client dependencies and build scripts
│   ├── vite.config.js          # Vite config with Tailwind CSS plugin & dev proxy
│   └── src/
│       ├── main.jsx            # React root with ErrorBoundary mounting
│       ├── App.jsx             # Router, protected routes, and page title manager
│       ├── index.css           # Global Tailwind v4 design tokens and gradients
│       ├── api/                # API client with status code mapping and error handlers
│       ├── components/         # Reusable UI library (Glass cards, buttons, badges, modals)
│       ├── context/            # AuthContext and ThemeContext
│       ├── constants/          # Wardrobe colors, categories, occasions, and seasons
│       └── pages/              # Wardrobe, Outfits, Builder, Suggest, BeforeYouBuy, Stats, etc.
└── server/                     # Express Backend API
    ├── .env.example            # Server-specific template for credentials
    ├── package.json            # Server dependencies, prisma scripts, and audit tools
    ├── prisma/
    │   └── schema.prisma       # Database schema (User, Item, Outfit, OutfitItem, WearLog)
    └── src/
        ├── index.js            # Express application entry point with security middleware
        ├── db.js               # Prisma client singleton
        ├── config/
        │   ├── env.js          # Startup Zod environment validation
        │   └── cloudinary.js   # Cloudinary SDK configuration
        ├── controllers/        # Request controllers (Auth, Items, Outfits, Stats, etc.)
        ├── middleware/         # Auth, Upload, RateLimit, and Centralized Error Handling
        ├── routes/             # Express API routes
        └── utils/              # Color harmony and date normalization utilities
```

---

## ⚙️ Prerequisites

Before running OutWear, ensure you have the following installed and configured:

1. **Node.js**: v18.0.0 or higher (v24 LTS recommended)
2. **npm**: v9.0.0 or higher
3. **PostgreSQL Database**: [Supabase](https://supabase.com/) account (or local PostgreSQL)
4. **Cloudinary Account**: [Cloudinary](https://cloudinary.com/) account for image storage

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies

From the project root:

```bash
# Clone the repository
git clone https://github.com/your-username/OutWear.git
cd OutWear

# Install all workspace dependencies (root, server, and client)
npm run install:all
```

*(Or install individually: `npm install`, `npm install --prefix server`, `npm install --prefix client`)*

---

### 2. Configure Environment Variables

#### Backend (`/server/.env` or root `.env`)
Copy the template and configure your database and API credentials:

```bash
cp .env.example server/.env
```

Ensure the following variables are configured:
- **Supabase PostgreSQL**:
  - `DATABASE_URL`: Connection pooler URL (e.g. Supabase port `6543` with `?pgbouncer=true`).
  - `DIRECT_URL`: Direct database connection string (e.g. Supabase port `5432`) used by Prisma for migrations.
- **JWT**:
  - `JWT_SECRET`: A secure string of **at least 32 characters**.
- **Cloudinary**:
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

#### Frontend (`/client/.env`)
Copy the frontend environment template:

```bash
cp client/.env.example client/.env
```

Set `VITE_API_URL=http://localhost:4000/api` for local development.

---

### 3. Database Initialization & Prisma Setup

Run Prisma migrations to set up your tables in PostgreSQL:

```bash
# Generate Prisma Client
npm run prisma:generate --prefix server

# Run database migrations
npm run prisma:migrate --prefix server
```

---

### 4. Run the Application

Start both the backend API and frontend dev server simultaneously:

```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 🔑 Environment Variables Reference

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `NODE_ENV` | Optional | Application runtime environment (`development`, `production`, `test`) |
| `PORT` | Optional | Backend port (default `4000`) |
| `CLIENT_ORIGIN` | Optional | Allowed CORS origin URL(s) (comma-separated; default `http://localhost:5173`) |
| `DATABASE_URL` | **Yes** | PostgreSQL connection URL (with pooling for transaction endpoints) |
| `DIRECT_URL` | Optional | Direct PostgreSQL connection URL for Prisma schema migrations |
| `JWT_SECRET` | **Yes** | Secret key for signing auth tokens (minimum 32 characters) |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API access key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret key |
| `VITE_API_URL` | Optional | Frontend API base URL (default `http://localhost:4000/api`) |

---

## 📜 Available Scripts

| Command | Location | Description |
| :--- | :--- | :--- |
| `npm run dev` | Root | Starts both backend and frontend concurrently in dev mode |
| `npm run install:all` | Root | Installs dependencies in root, `/server`, and `/client` |
| `npm run start` | `/server` | Starts the Express server in production mode |
| `npm run dev` | `/server` | Starts the Express server with nodemon auto-reloading |
| `npm run prisma:generate` | `/server` | Regenerates the Prisma Client |
| `npm run prisma:migrate` | `/server` | Applies database schema migrations |
| `npm run prisma:studio` | `/server` | Opens Prisma Studio GUI in the browser |
| `npm run dev` | `/client` | Starts Vite local development server |
| `npm run build` | `/client` | Compiles production assets into `/client/dist` |
| `npm run lint` | `/client` | Runs Oxlint linter across client source code |

---

## 📸 Screenshots

*(Visual documentation placeholder — add application previews below)*

| Wardrobe Grid & Filter Bar | Outfit Builder Collage |
| :---: | :---: |
| *[Screenshot Placeholder: Wardrobe View]* | *[Screenshot Placeholder: Outfit Builder]* |

| Style Suggestions & Score Ring | "Before You Buy" Verdict |
| :---: | :---: |
| *[Screenshot Placeholder: Style Suggestions]* | *[Screenshot Placeholder: Before You Buy]* |

| Wardrobe Analytics & SVG Donut Chart | Wear Timeline & History |
| :---: | :---: |
| *[Screenshot Placeholder: Stats Dashboard]* | *[Screenshot Placeholder: History Timeline]* |

---

## 📄 License

This project is licensed under the MIT License.
