<p align="center">
  <img src="frontend/public/favicon.png" alt="NanoAlias Logo" width="80" />
</p>

<h1 align="center">NanoAlias</h1>
<p align="center"><strong>Shorten smarter. Track deeper. Stay secure.</strong></p>

<p align="center">
  A production-grade, full-stack URL shortener built on the MERN stack with Redis caching, real-time analytics, and enterprise-level security.
</p>

---

## Features

| Category | Highlights |
|---|---|
| **Authentication** | Email/password with OTP verification, Google OAuth 2.0, forgot/reset password flow |
| **URL Shortening** | Custom aliases, auto-generated short codes via nanoid |
| **Burn After Reading** | One-time-use links that self-destruct after a single visit |
| **Password-Protected Links** | Secure any short URL behind a password — unlock page included |
| **Analytics Dashboard** | Click tracking, geo-location (GeoIP), device/browser parsing (UA Parser), interactive Recharts graphs |
| **QR Code Generator** | Generate, customise, and download QR codes for any short link |
| **Admin Panel** | Role-based access control — manage users, view all links, toggle URL status |
| **Redis Caching** | High-performance redirect resolution with Redis-backed rate limiting |
| **Dark Mode UI** | Sleek, modern interface built with Tailwind CSS |

---

## Tech Stack

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)

### DevOps
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

---

## Security Measures

The backend implements a layered, production-grade security pipeline:

```
Request
  → helmet()              – Secure HTTP headers (X-Frame-Options, HSTS, etc.)
  → cors()                – Strict origin, methods & headers allowlist
  → express.json()        – Body parsing
  → mongoSanitize()       – Block NoSQL injection ($gt, $eq operators)
  → xssSanitizer          – Strip <script> tags & malicious HTML
  → strictLimiter          – 10 req / 15 min on auth & URL creation
  → globalLimiter          – 100 req / 15 min on all /api routes
  → Route Handlers
  → Global Error Handler   – Mongoose-aware catch-all (CastError, 11000, ValidationError)
```

| Package | Purpose |
|---|---|
| `helmet` | Sets secure HTTP response headers |
| `cors` | Restricts cross-origin requests to the frontend URL |
| `express-rate-limit` | Global + strict per-route rate limiting |
| `rate-limit-redis` | Redis-backed rate limiter for URL creation |
| `express-mongo-sanitize` | Strips MongoDB query operators from user input |
| `xss` (custom middleware) | Sanitises all string inputs against XSS payloads |
| `bcryptjs` | Hashes passwords with salt rounds |
| `jsonwebtoken` | Stateless JWT authentication |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRE` | Token expiration (e.g. `7d`) |
| `SMTP_HOST` | SMTP mail server host |
| `SMTP_PORT` | SMTP mail server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `EMAIL_USER` | "From" email address |
| `EMAIL_PASS` | Email account password |
| `CLIENT_URL` | Frontend URL (e.g. `https://your-app.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `https://your-api.onrender.com/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |

---

## Local Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Redis](https://redis.io/) (local or cloud)
- [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/NanoAlias.git
cd NanoAlias
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

```bash
cp .env.example .env
# Open .env and fill in your values
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 5. Configure frontend environment

```bash
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
```

### 6. Start the development servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The frontend will be available at **http://localhost:5173** and the backend API at **http://localhost:5000**.

---

## Project Structure

```
NanoAlias/
├── backend/
│   ├── config/          # DB & Redis connection
│   ├── controllers/     # Route handlers
│   ├── middlewares/      # Auth, rate limiter, error handler, sanitizers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Email, analytics, QR code services
│   ├── utils/           # AppError, catchAsync helpers
│   └── server.js        # Application entry point
│
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Route-level page components
│       └── store/       # Redux Toolkit + RTK Query slices
│
└── README.md
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---