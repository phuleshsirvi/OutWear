# OutWear 👗

OutWear is a modern, responsive full-stack smart wardrobe management web application designed for multiple users. It enables users to catalog, organize, and curate their clothing collections and plan outfits smartly.

---

## 🏗️ Project Architecture & Tech Stack

- **Client (`/client`)**:
  - [React](https://react.dev/) (v19) scaffolded with [Vite](https://vite.dev/)
  - [Tailwind CSS](https://tailwindcss.com/) (v4) for responsive styling
  - Configured with a local dev proxy to the backend API (`/api` -> `http://localhost:4000`)
- **Server (`/server`)**:
  - [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) (ES Modules)
  - [CORS](https://github.com/expressjs/cors) & [dotenv](https://github.com/motdotla/dotenv)
  - [nodemon](https://nodemon.io/) for auto-reloading during development
  - Listens on **Port 4000** (avoiding macOS port 5000 AirPlay Receiver conflicts)
- **Database & Auth (Upcoming)**:
  - PostgreSQL with Prisma ORM
  - Multi-user authentication & JWT authorization

---

## 📁 Repository Structure & File Overview

```text
OutWear/
├── .env.example         # Template for environment variables (PORT, DATABASE_URL, JWT_SECRET)
├── .gitignore           # Ignores node_modules, .env, dist, build, and temporary files
├── package.json         # Root scripts to orchestrate client and server concurrently
├── README.md            # Project documentation, architecture overview, and run instructions
├── client/              # React frontend application
│   ├── index.html       # Vite HTML entry point
│   ├── package.json     # Client dependencies (React, Vite, Tailwind CSS)
│   ├── vite.config.js   # Vite configuration with Tailwind CSS plugin & backend proxy
│   └── src/
│       ├── App.jsx      # Initial responsive starter component & health check monitor
│       ├── index.css    # Tailwind CSS entry stylesheet (@import "tailwindcss")
│       └── main.jsx     # React DOM entry point
└── server/              # Express backend API
    ├── package.json     # Server dependencies (Express, CORS, dotenv, nodemon)
    └── src/
        └── index.js     # Server entry point with GET /api/health on port 4000
```

### File Breakdown

- **`.gitignore`**: Excludes dependencies (`node_modules`), secrets (`.env`), and build outputs (`dist`, `build`) from Git tracking.
- **`.env.example`**: Documents required environment variables with placeholder values (`PORT`, `DATABASE_URL`, `JWT_SECRET`).
- **`package.json`**: Root configuration containing the `dev` script powered by `concurrently` to run both frontend and backend dev environments with one command.
- **`client/vite.config.js`**: Vite configuration containing `@tailwindcss/vite` and a development reverse proxy routing `/api` calls to `http://localhost:4000`.
- **`client/src/index.css`**: Global stylesheet importing Tailwind CSS v4.
- **`client/src/App.jsx`**: Responsive starter view verifying Tailwind CSS styles and testing backend connectivity via `/api/health`.
- **`server/package.json`**: Configures the server as an ES Module with start and nodemon dev scripts.
- **`server/src/index.js`**: Express server setup including CORS middleware, environment configuration, and the `GET /api/health` route running on port 4000.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended; developed with Node v24)
- [npm](https://www.npmjs.com/) (v9+)

### 1. Installation

Install dependencies across the workspace:

```bash
# Install root dependencies (concurrently)
npm install

# Install client dependencies (React, Vite, Tailwind CSS)
npm install --prefix client

# Install server dependencies (Express, CORS, dotenv, nodemon)
npm install --prefix server
```

*(Alternatively, use the convenience script `npm run install:all`)*

### 2. Environment Setup

Create an environment file from the example template:

```bash
cp .env.example .env
```

Default settings in `.env.example`:
- `PORT=4000`
- `DATABASE_URL="postgresql://username:password@localhost:5432/outwear_db?schema=public"`
- `JWT_SECRET=your_jwt_secret_key_here`

---

## 💻 Running the Application

### Run Client and Server Together (Recommended)

From the project root directory, run:

```bash
npm run dev
```

This starts:
- **Backend API**: `http://localhost:4000` (Health check at `http://localhost:4000/api/health`)
- **Frontend App**: `http://localhost:5173` (proxies `/api` requests to port 4000)

### Run Individually

**Backend Server only:**
```bash
npm run dev --prefix server
# or: cd server && npm run dev
```

**Frontend Client only:**
```bash
npm run dev --prefix client
# or: cd client && npm run dev
```

---

## 🔍 Verifying the Setup

1. Open [http://localhost:4000/api/health](http://localhost:4000/api/health) in your browser or curl it:
   ```bash
   curl http://localhost:4000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "message": "OutWear server is healthy",
     "timestamp": "...",
     "port": 4000
   }
   ```

2. Open [http://localhost:5173](http://localhost:5173) in your browser to view the client. It will automatically ping the backend health endpoint and display green status badges.
