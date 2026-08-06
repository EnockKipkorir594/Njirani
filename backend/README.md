# Njirani API 
**Njirani** is a neighbourhood services platfom that connects residents of estates and gated communities with
trusted local service providers - plumbers, electrians, cleaners, house helps, painters and more all within their
immediate vicinity. 

This repository contains the **primary backend API** built with Node.js, Typescript, Epress, and prisma.It is 
designed as a learning-focused production-grade project that demonstrates full stack engineering skills from 
database design to deployment. 

## Table of Contents
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Databse Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Developmennt Workflow](#development-workflow)
- [Architecture Decisions](#architecture-decisions)


## Tech Stack 
| Layer | Technology | Purpose | 
|------|------|------|
| Runtime | Node.js 20+ | Server runtime |
| Language | Typescript 5.7+ | Type safety | 
| Framework | Express 5 | HTTP routing & middleware | 
| ORM | Prisma 7 | Database access & migrations |
| Database | PostreSQL 16 + PostGIS | Relational data & geospatial queries | 
| Cache / Queue | Redis 7 | caching, sessions, background jobs | 
| Auth | bcrypt + JWT | Password hashing & token-based auth | 


## Prerequisites 
Before you begin ensure you have the following installed: 
Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) v20 or higher
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/)

Verify your installations:

```bash
node --version    # v20.x.x or higher
docker --version  # 24.x or higher
docker compose version  # 2.x or higher

``` 


## Getting Started 
1. CLone the repository 
```bash 
git clone https://github.com/EnockKipkorir594/Njirani.git
cd njirani/backend

```

2.Install dependencies 
```bash 
npm install 
```
**Note** Prisma 7 requires the pg driver as a direct dependency for its adapter-based architecture. This is already included in package.json.

3. Start Infrastructure Services 
We use Docker Compose to run PostgreSQL (with PostGIS) and Redis locally:

```bash 
# From the project root (where docker-compose.yml lives)
cd ..
docker compose up -d
```
Verify the containers are healthy:
```bash 
docker compose ps
```
You should see:
```plain 
NAME               STATUS
njirani-postgres   healthy
njirani-redis      healthy

```
4. Configure Environment Variables 
Create a .env file in the /backend directory:
```bash 
cp .env.example .env

```
Edit .env with your values:
```env 
# Database
DATABASE_URL="postgresql://njirani:njirani_dev_pass@localhost:5432/njirani?schema=public"

# Auth (minimum 32 characters each)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-characters"

# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_URL="redis://localhost:6379"

# Frontend (for CORS)
FRONTEND_URL="http://localhost:3001"

```
Security: Never commit .env to version control. It is listed in .gitignore.

5. Setup the database 
Enable the PostGIS extension (required for geospatial features):
```bash 
psql postgresql://njirani:njirani_dev_pass@localhost:5432/njirani -c "CREATE EXTENSION IF NOT EXISTS postgis;"

```
Generate the Prisma client:
```bash 
npx prisma generate 

```
Run the initial migration to create all tables:
```bash 
npx prisma migrate dev --name init
```

verify the tables were created:
```bash 
psql postgresql://njirani:njirani_dev_pass@localhost:5432/njirani -c "\dt"

```
You should see: users, estates, service_categories, provider_profiles, bookings, reviews, payments, notifications.

6. Start the development Server
```bash 
npm run dev 

```

## Project Structure 
```plain 
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (committed)
│   └── migrations/            # Database migrations (committed)
├── src/
│   ├── config/
│   │   ├── env.ts             # Zod-validated environment variables
│   │   ├── database.ts        # Prisma client singleton
│   │   └── redis.ts           # Redis client (future use)
│   ├── modules/
│   │   └── auth/              # Auth module (controller, service, router, schema)
│   ├── utils/
│   │   ├── errors.ts          # Custom error classes
│   │   ├── response.ts        # Standardized API response factories
│   │   ├── jwt.ts             # JWT signing & verification
│   │   └── logger.ts          # Logging utility
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── auth.middleware.ts
│   ├── index.ts               # Express app entry point
│   └── types/                 # Shared TypeScript types
├── tests/                     # Test suites
├── docker-compose.yml         # Infrastructure (Postgres + Redis)
├── package.json
├── tsconfig.json
└── .env.example               # Environment variable template
```

## Environment Variables 
All environment variables are validated at boot time using Zod. If any required variable is missing or malformed, the server exits immediately with a clear error message.
| Variable | Required | Description | 
| ------ | ------ | ------ | 
| DATABASE_URL |	Yes	| PostgreSQL connection string |
| JWT_SECRET |	Yes	| Signing key for access tokens (min 32 chars) |
| JWT_REFRESH_SECRET |	Yes	| Signing key for refresh tokens (min 32 chars) |
| PORT	| Yes	| Server port (parsed as integer) |
| NODE_ENV |	No	 | development, production, or test (default: development) |
| REDIS_URL |	No	| Redis connection string |
| FRONTEND_URL	| No	| Frontend origin for CORS |


## Database Setup 

**Why PostGIS?**
Njirani is location-aware. Residents search for providers within a specific radius of their estate. PostGIS enables efficient geospatial queries (e.g., "find all plumbers within 5km") using native PostgreSQL geometry types.

**Migrations**
Migrations are version-controlled schema changes. They live in prisma/migrations/ and are committed to Git.
Create a new migration after schema changes:
```bash 
npx prisma migrate dev --name descriptive_name

```
Apply migrations in production:
```bash 
npx prisma migrate deploy
```
Open Prisma Studio (visual database editor):
```bash 
npx prisma studio
```

## API Endpoints 
**Health & Status**
| Method | Endpoint | Desciption | Auth | 
| ------ | ------ | ------ | ------|
| GET  | / | API status | public |
| GET | /health | Database connectivity check | public | 

**Authentication**
| Method | Endpoint | Description | Auth |
| POST | auth/register | Create a new user account | public | 
| POST | auth/login | Authenticate and receive tokens | public | 

**Response Format**
All API responses follow a consistent envolope. 
Success:
```JSON 
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

```
Error:
```JSON 
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  },
  "message": "Resource not found"
}

```
### User registration endpoint implementation notes
Endpoint : POST /auth/register 

files touched: auth.router.ts, auth.controller.ts, auth.schema.ts, auth.service.ts, index.ts 

**Architecture**
We used controller-service patter to keep HTTP  separate from business logic. 

| Layer | Responsibility | 
| ------ | ------ |
| Schema { auth.schema.ts} | Zod validation of the request body |
| Controller { auth.controller.ts } | Parses request, calls service, returns 201 created |
| Service { auth.service.ts } | Checks duplicates, hashes password, writes to database |
| Router { auth.router.ts } | Wires POST/register to the controller | 

**Validation (Zod)** 
The registerSchema enforces:
- name: string, 2-100 chars, trimmed
- email: valid format, lower cased automatically, trimmed
- phone: string(not a number), 10-15 chars, trimmed
- password: string, 8-128 chars
- role: enum | ADMIN | PROVIDER | RESIDENT

**Passowrd Security (bcrypt)**
- Hashing: bcrypt.hash(password, 12), -async non-blocking
- Storage: Only the hash enters the database never plaintext.
- Response: The destructures passwordHash out of the prisma result before returning it to
            the controller. The client never sees it.






## Development Workflow
**Daily Checklist**
- Ensure Docker containers are running: docker compose ps
- Ensure .env is configured
- Run the dev server: npm run dev
- Make changes, test with curl or Postman
- Type-check before committing: npx tsc --noEmit


Available Scripts
| Script |	Command | 	Purpose | 
| ------ | ------ | ------ |
| dev |	npm run dev	Start | development server with hot reload |
| build	| npm run build	 | Compile TypeScript to dist/ |
| start | npm start	| Run compiled production build |
| db:generate | npm run db:generate	| Generate Prisma client |
| db:migrate |	npm run db:migrate	| Create and apply migrations |
| db:studio	| npm run db:studio | Open Prisma  Studio |
| db:seed	| npm run db:seed	| Run database seed script |


## Architecture Decisions
### Why Prisma 7 with Driver Adapters?
Prisma 7 requires a driver adapter (e.g., @prisma/adapter-pg) to connect to PostgreSQL. This architecture delegates connection pooling to the native pg driver, resulting in smaller container images and faster cold starts compared to the legacy native engine binary.

### Why Zod for Environment Variables?
Environment variables are untyped strings. A missing JWT_SECRET or malformed DATABASE_URL can cause cryptic runtime errors. Zod validates every variable at boot time — if something is wrong, the server refuses to start and tells you exactly what needs fixing.

### Why the Singleton Pattern for PrismaClient?
The PrismaClient maintains a connection pool to the database. In development, nodemon and tsx hot-reload the server on every file change, which would create a new client (and new pool) each time. By attaching the client to globalThis, we reuse the same instance across reloads, preventing connection exhaustion.

### Why Custom Error Classes?
We distinguish between operational errors (expected, user-facing, like "email already taken") and programming errors (unexpected, like "database connection lost"). Operational errors return friendly HTTP responses. Programming errors are logged for investigation and return generic 500 messages to the client.

## Troubleshooting
**Invalid environment variables on startup**
Your .env file is missing or dotenv hasn't loaded before other imports. Ensure:
- .env exists in /backend/
- import 'dotenv/config' is the first line in src/index.ts

**Port 5432 already in use**
A local PostgreSQL service is running. Stop it:
```bash 
sudo systemctl stop postgresql 

```
Then restart Docker Compose.

**Prisma client not found**
```bash 
npx prisma generate
```

## License
ISC



