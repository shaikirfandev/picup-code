# 🎨 PicUp — Pinterest-Style Classified Products Platform

A production-ready full-stack application combining Pinterest-style visual discovery with a classified products marketplace. Features AI-powered image generation, real-time masonry feeds with virtualization, and a comprehensive admin dashboard.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)

---

## ✨ Features

### 🏠 User Features
- **Pinterest-Style Masonry Feed** — Responsive grid with infinite scroll (react-masonry-css + react-window virtualization)
- **Product Pins** — Upload images with product URLs, pricing, tags, and categories
- **AI Image Generation** — Generate images using Stability AI (SDXL) with multiple style presets
- **Save & Organize** — Save pins to custom boards, like, share, and comment
- **User Profiles** — Follow system, post history, bio, avatar, cover photo
- **Real-time Search** — Full-text search with filters (category, price range, sort)
- **Dark Mode** — System-aware theme toggle via `next-themes`

### 🔐 Authentication
- **JWT** — Access + refresh token strategy with auto-renewal
- **OAuth** — Google and GitHub social login via Passport.js
- **Role-based Access** — User / Moderator / Admin roles

### 🛡️ Admin Panel
- **Dashboard Analytics** — Users, posts, views, likes, saves, AI generations
- **User Management** — Search, ban/unban, role assignment
- **Content Moderation** — Post management, featured pins, bulk delete
- **Reports System** — Review, resolve, dismiss user reports
- **Category Management** — CRUD with icons and color coding
- **AI Logs** — Monitor generation activity and usage

### 🤖 AI Integration
- **Stability AI (SDXL)** — Text-to-image generation
- **Style Presets** — Photographic, Digital Art, Anime, Cinematic, etc.
- **Daily Limits** — Configurable per-user generation caps
- **Demo Mode** — Automatic fallback with placeholder images when no API key

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS 3.4 |
| **State** | Redux Toolkit, React-Redux, React Query |
| **Feed** | react-masonry-css, react-window (virtualization) |
| **Backend** | Node.js 20, Express.js 4 |
| **Database** | MongoDB 7 (Mongoose 8) |
| **Cache** | Redis 7 |
| **Auth** | JWT, Passport.js (Google, GitHub OAuth) |
| **Storage** | Cloudinary |
| **AI** | Stability AI API |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## 📁 Project Structure

```
picup/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js              # Express app entry
│       ├── config/
│       │   ├── db.js              # MongoDB connection
│       │   ├── cloudinary.js      # Cloudinary helpers
│       │   └── passport.js        # OAuth strategies
│       ├── models/
│       │   ├── User.js            # Auth, roles, AI limits
│       │   ├── Post.js            # Images, products, pricing
│       │   ├── Board.js           # Collections
│       │   ├── Comment.js         # Threaded comments
│       │   ├── Interaction.js     # Like, Save, Follow
│       │   ├── Category.js        # With icons & colors
│       │   ├── Report.js          # Moderation reports
│       │   ├── AIGeneration.js    # AI usage tracking
│       │   └── Notification.js    # User notifications
│       ├── middleware/
│       │   ├── auth.js            # JWT auth + token gen
│       │   ├── admin.js           # Role authorization
│       │   ├── upload.js          # Multer config
│       │   ├── rateLimiter.js     # Rate limiting
│       │   └── validate.js        # Request validation
│       ├── controllers/           # 10 controllers
│       ├── routes/                # 10 route files
│       ├── seeds/
│       │   └── seed.js            # Categories + demo data
│       └── utils/
│           ├── apiResponse.js     # Standardized responses
│           └── helpers.js         # Slug, sanitize, etc.
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx         # Root layout + Header
        │   ├── page.tsx           # Homepage feed
        │   ├── globals.css        # Tailwind + custom classes
        │   ├── providers.tsx      # Theme + auth providers
        │   ├── login/             # Auth pages
        │   ├── register/
        │   ├── auth/callback/     # OAuth callback
        │   ├── post/[id]/         # Post detail
        │   ├── create/            # Create pin (upload + AI)
        │   ├── profile/[username]/# User profile
        │   ├── search/            # Search with filters
        │   ├── explore/           # Browse by category
        │   ├── boards/            # User boards
        │   ├── saved/             # Saved pins
        │   ├── settings/          # Profile & password
        │   └── admin/             # Admin dashboard
        │       ├── layout.tsx     # Admin sidebar
        │       ├── page.tsx       # Analytics dashboard
        │       ├── users/         # User management
        │       ├── posts/         # Content management
        │       ├── reports/       # Report moderation
        │       ├── categories/    # Category CRUD
        │       └── ai/            # AI generation logs
        ├── components/
        │   ├── layout/Header.tsx
        │   ├── feed/
        │   │   ├── PostCard.tsx           # Pinterest pin card
        │   │   ├── MasonryFeed.tsx        # Masonry + infinite scroll
        │   │   └── VirtualizedMasonry.tsx # react-window version
        │   └── shared/Skeletons.tsx
        ├── hooks/index.ts         # useDebounce, useInfiniteScroll, etc.
        ├── lib/
        │   ├── api.ts             # Axios client + all API modules
        │   └── utils.ts           # Formatters, cn(), etc.
        ├── store/
        │   ├── index.ts           # Redux store configuration
        │   ├── hooks.ts           # Typed useAppDispatch / useAppSelector
        │   └── slices/
        │       ├── authSlice.ts   # Auth state + async thunks
        │       └── uiSlice.ts    # UI toggles
        └── types/index.ts         # TypeScript interfaces
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+ (local or Atlas)
- Redis (optional, for rate limiting/caching)

### 1. Clone & Install

```bash
git clone <repo-url> picup && cd picup

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
# Root level
cp .env.example .env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

Edit `.env` with your credentials:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Random secret for JWT signing |
| `CLOUDINARY_*` | Cloudinary account credentials |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth (optional) |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth (optional) |
| `STABILITY_API_KEY` | Stability AI key (optional — demo mode works without it) |

### 3. Seed Database

```bash
cd backend
node src/seeds/seed.js
```

This creates:
- **12 categories** (Fashion, Tech, Home, Art, Food, etc.)
- **Admin account**: `admin@picup.app` / `admin123`
- **3 demo users** with sample posts

### 4. Run Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev    # http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm run dev   # http://localhost:3000
```

---

## 🐳 Docker Deployment

```bash
# Start all services (MongoDB, Redis, Backend, Frontend)
docker compose up -d

# With Nginx reverse proxy (production)
docker compose --profile production up -d

# Seed the database
docker compose exec backend node src/seeds/seed.js

# View logs
docker compose logs -f

# Stop
docker compose down
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register with email/password |
| POST | `/auth/login` | Login, returns tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |
| GET | `/auth/google` | Google OAuth redirect |
| GET | `/auth/github` | GitHub OAuth redirect |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | Feed with pagination & filters |
| GET | `/posts/:id` | Post detail with related posts |
| POST | `/posts` | Create post (auth required) |
| PUT | `/posts/:id` | Update post (owner only) |
| DELETE | `/posts/:id` | Delete post (owner/admin) |
| POST | `/posts/:id/like` | Toggle like |
| POST | `/posts/:id/save` | Toggle save |
| GET | `/posts/saved` | Get saved posts |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/:username` | Get profile |
| PUT | `/users/profile` | Update profile |
| POST | `/users/:id/follow` | Follow user |
| DELETE | `/users/:id/follow` | Unfollow user |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search posts with filters |
| GET | `/search/trending` | Trending tags & posts |

### AI Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/generate` | Generate image from text |
| GET | `/ai/styles` | Available style presets |

### Admin (requires admin/moderator role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Platform analytics |
| GET | `/admin/users` | List users with search |
| PUT | `/admin/users/:id` | Update user (role, ban) |
| GET | `/admin/posts` | List all posts |
| DELETE | `/admin/posts/:id` | Delete any post |
| GET | `/admin/reports` | List reports |
| PUT | `/admin/reports/:id` | Resolve/dismiss report |
| CRUD | `/admin/categories` | Category management |
| GET | `/admin/ai/logs` | AI generation logs |

---

## 🎨 Design System

### Colors
- **Brand**: Rose-based primary (`#e11d48` → custom scale)
- **Surface**: Neutral gray scale for backgrounds/text
- **Accents**: Purple for AI, Green for success, Amber for warnings

### Components (Tailwind custom classes)
- `.btn-primary` / `.btn-secondary` / `.btn-ghost` — Button variants
- `.input-field` — Styled form inputs
- `.card` / `.glass-card` — Card containers
- `.pin-card` / `.pin-overlay` — Pinterest-style pin cards
- `.masonry-grid` — Masonry layout container
- `.skeleton` — Loading placeholder animation

### Responsive Breakpoints
| Columns | Screen |
|---------|--------|
| 2 | < 768px (mobile) |
| 3 | 768px–1024px (tablet) |
| 4 | 1024px–1280px (desktop) |
| 5 | > 1280px (large) |

---

## 🔧 Configuration

### AI Demo Mode
If `STABILITY_API_KEY` is not set, the AI generation endpoint returns placeholder images from `picsum.photos`. No setup required for testing.

### Cloudinary
Sign up at [cloudinary.com](https://cloudinary.com) for free tier (25GB storage, 25GB bandwidth). Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`.

### OAuth
1. **Google**: Create credentials at [console.cloud.google.com](https://console.cloud.google.com)
2. **GitHub**: Register app at [github.com/settings/developers](https://github.com/settings/developers)
3. Set callback URLs to `http://localhost:5000/api/auth/google/callback` and `/github/callback`

---

## 📜 License

MIT © PicUp
