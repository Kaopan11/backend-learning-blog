# Backend Learning Blog API

> Express.js REST API for a personal learning blog — authentication, posts CRUD, profile updates, and image uploads powered by Supabase Auth, PostgreSQL, and Storage.

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-blue.svg)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20DB%20%7C%20Storage-3FCF8E.svg)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](./package.json)

**Production:** [https://backend-learning-blog.vercel.app](https://backend-learning-blog.vercel.app)

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Overview](#-database-overview)
- [Deployment](#-deployment)
- [Related Projects](#-related-projects)
- [Author](#-author)

---

## Features

- User registration and login with **Supabase Auth**
- JWT Bearer token authentication (`protectUser` / `protectAdmin`)
- Get current user profile and reset password
- Update profile (name, username, profile picture upload)
- Posts CRUD with pagination, category filter, and keyword search
- Create posts with **multipart image upload** to Supabase Storage (admin only)
- Input validation middleware for JSON post bodies
- CORS configured for local and production frontend origins
- Deployed as a serverless Node app on **Vercel**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js (ES Modules) |
| **Framework** | Express 5 |
| **Database** | PostgreSQL (`pg` connection pool) via Supabase |
| **Authentication** | Supabase Auth (`@supabase/supabase-js`) |
| **File storage** | Supabase Storage + Multer (memory storage) |
| **Config** | `dotenv` |
| **Dev server** | Nodemon |
| **Hosting** | Vercel (`@vercel/node`) |

---

## Project Structure

```text
server/
├── app.js                      # App entry — CORS, routes, listen
├── package.json
├── vercel.json                 # Vercel serverless config
├── middlewares/
│   ├── protectUser.js          # Require valid Bearer token
│   ├── protectAdmin.js         # Require token + role = admin
│   └── postValidation.js       # Validate JSON post body
├── routes/
│   ├── auth.js                 # Auth & profile endpoints
│   └── posts.js                # Posts CRUD + image upload
└── utils/
    ├── db.js                   # PostgreSQL pool
    ├── supabase.js             # Supabase clients
    └── upload.js               # Multer memory storage
```

---

## Getting Started

### Prerequisites

- Node.js **18+**
- A [Supabase](https://supabase.com/) project with:
  - PostgreSQL tables (`users`, `posts`, `categories`, `statuses`, …)
  - Auth enabled (email confirmation can be disabled for local learning)
  - Public Storage bucket (default name: `my-learning-blog`)

### Installation

```bash
git clone https://github.com/Kaopan11/backend-learning-blog.git
cd backend-learning-blog/server
npm install
```

### Run locally

1. Create a `.env` file in `server/` (see [Environment Variables](#-environment-variables)).
2. Start the server:

```bash
npm start
```

Server runs at **http://localhost:4000** (or `PORT` from `.env`).

Quick check:

```bash
curl http://localhost:4000/health
# → { "message": "OK" }
```

---

## Environment Variables

Create a `.env` file (gitignored). **Do not commit secrets.**

| Variable | Required | Description |
|----------|----------|-------------|
| `CONNECTION_STRING` | Yes | PostgreSQL connection URI (prefer Supabase **Session pooler** for Vercel) |
| `SUPABASE_URL` | Yes | Supabase project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Yes | Supabase **anon public** API key |
| `SUPABASE_STORAGE_BUCKET` | No | Storage bucket name (default: `my-learning-blog`) |
| `PORT` | No | Local port (default: `4000`) |

Example (placeholders only):

```env
CONNECTION_STRING=postgresql://postgres.xxxx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_STORAGE_BUCKET=my-learning-blog
PORT=4000
```

> Tip: URL-encode special characters in the DB password (e.g. `$` → `%24`).

---

## API Reference

Base URL (local): `http://localhost:4000`  
Base URL (production): `https://backend-learning-blog.vercel.app`

Unless noted, JSON request bodies use `Content-Type: application/json`.  
Upload endpoints use `multipart/form-data` with file field name **`imageFile`**.

### Health & misc

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | — | Server status message |
| `GET` | `/health` | — | Health check `{ "message": "OK" }` |
| `GET` | `/profiles` | — | Legacy mock profile |
| `POST` | `/assignments` | — | Legacy JSON create-post (same logic as early posts create) |

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Register user (Supabase Auth + `users` row, default `role: user`) |
| `POST` | `/auth/login` | — | Login → `{ access_token }` |
| `GET` | `/auth/get-user` | Bearer | Current user profile |
| `PUT` | `/auth/reset-password` | Bearer | Change password (`oldPassword`, `newPassword`) |
| `PUT` | `/auth/profile` | Bearer (`protectUser`) | Update `name` / `username` / profile image (FormData) |

**Register body example:**

```json
{
  "email": "user@example.com",
  "password": "yourSecurePassword123",
  "username": "username01",
  "name": "Display Name"
}
```

**Login body example:**

```json
{
  "email": "user@example.com",
  "password": "yourSecurePassword123"
}
```

**Profile update (FormData):** `name`, `username`, `imageFile` (all optional, but at least one required).

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/posts` | — | List posts (`page`, `limit`, `category`, `keyword`) |
| `GET` | `/posts/:postId` | — | Get single post |
| `POST` | `/posts` | Bearer **admin** + FormData | Create post + upload image to Storage |
| `PUT` | `/posts/:postId` | — | Update post (JSON + validation) |
| `DELETE` | `/posts/:postId` | — | Delete post |

**Create post (FormData):**

| Field | Type | Notes |
|-------|------|--------|
| `title` | text | Required |
| `category_id` | text | e.g. `1` Cat, `2` Inspiration, `3` General |
| `description` | text | Required |
| `content` | text | Required |
| `status_id` | text | e.g. `1` Draft, `2` Published |
| `imageFile` | file | Required image |

### Auth headers

```http
Authorization: Bearer <access_token>
```

| Middleware | Rule |
|------------|------|
| `protectUser` | Any logged-in user |
| `protectAdmin` | Logged-in user with `users.role = admin` |

---

## Database Overview

Schema lives in Supabase PostgreSQL (no migration files in this repo). Main tables used by the API:

| Table | Purpose |
|-------|---------|
| `users` | Profile data (`id` = Supabase Auth UUID, `username`, `name`, `profile_pic`, `role`) |
| `posts` | Blog posts (`title`, `image`, `category_id`, `description`, `content`, `status_id`, …) |
| `categories` | Post categories |
| `statuses` | Draft / publish statuses |

Storage layout:

- Posts: `my-learning-blog/posts/...`
- Profiles: `my-learning-blog/profiles/...`

---

## Deployment

This project deploys to **Vercel** via `vercel.json` (builds `app.js` with `@vercel/node`).

1. Connect the GitHub repo to Vercel.
2. Set the same environment variables as local (Production + Preview).
3. Use a **Session pooler** `CONNECTION_STRING` (not the direct `db.*.supabase.co` host) to avoid IPv6/`ENOTFOUND` issues on Vercel.
4. Redeploy after changing env vars.
5. Verify: `GET https://backend-learning-blog.vercel.app/health`

---

## Related Projects

| Project | Role | URL |
|---------|------|-----|
| **backend-learning-blog** (this repo) | REST API | [backend-learning-blog.vercel.app](https://backend-learning-blog.vercel.app) |
| **kaopan-learning-blog** | React frontend | [kaopan-learning-blog.vercel.app](https://kaopan-learning-blog.vercel.app) |

---

## Author

**Peerawat (Kaopan)** — [Kaopan11](https://github.com/Kaopan11)

Built as part of a backend learning curriculum (Express + Supabase + Vercel).

---

## License

ISC (see `package.json`).
