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
- [Authorization and Authentication](#authorization-authentication)
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
| ------ | ------ | ------ | ------ |
| POST | auth/register | Create a new user account | public | 
| POST | auth/login | Authenticate and receive tokens | public | 
| GET | auth/me | authenticate user using bearer token | protected | 
| GET | auth/admin-only | authenticates and authorizes user based on their role | protected |
| POST | auth/refresh | refreshes exipired access token (token rotation) | protected | 

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


### Login Endpoint - User Authentication and JWT session management 
Endpoint:: POST /auth/login 
The login endpoint authenticates existing users and establishes a secure session. 
User submits email and password. The API validates the request, locates the user, verifies the password 
using bcrypt, and - if authentication succeeds - issues a pair of signed JWTs. 

- Access token - short-lived and used to authenticate API requests. 
- Refresh token - long-lived and used to obtain acess token without requiring the use to login again. 

The implementation keeps authentication responsibilities separated across the schema, controller, service, and JWT utility layers. 

### Refresh Token Endpoint 
**The problem it solves**

Access tokens are intentionally short-lived — typically 15 minutes to 8 hours. A short lifespan limits the damage if a token is stolen. But short-lived tokens create a poor user experience if users are logged out constantly.

Refresh tokens solve this. They are long-lived tokens (7-30 days) used only to obtain new access tokens. The user stays logged in. The access token stays short-lived. Both goals are achieved simultaneously.

**Why a valid token is not enough**

When a refresh token arrives, the server does not just verify the signature. It also checks the database. A valid token proves the token has not expired or been tampered with — it does not prove the user still exists or still has the same role.

```plain 
Token is valid
        ↓
Does the user still exist in the database?
    ├── No  → 401 — account deleted or suspended
    └── Yes → Has the user's role changed?
                └── Always build new payload from database
                    (never trust the old token's role)

```
**Refresh Token Rotation** 
Every time a refresh token is used, the server issues a brand new refresh token and the old one is invalidated. This is called refresh token rotation.

```plain 
Client sends refresh token A
        ↓
Server verifies A — valid
        ↓
Server issues:
    - New access token
    - New refresh token B
        ↓
Refresh token A is now dead
Client stores refresh token B

```
**Why this matters for security:** If an attacker steals refresh token A, they can use it once before the legitimate user's next request invalidates it. The attack window closes automatically with every legitimate use.

**Why two separate secrets**

The access token and refresh token are signed with different secrets (JWT_SECRET and JWT_REFRESH_SECRET). This means:

- A stolen access token cannot be used to generate a new refresh token
- A stolen refresh token cannot be used as an access token
- Rotating one secret does not invalidate the other

**How authentication, authorization (RBAC) and refresh tokens work together**
```plain 
1. User logs in
        ↓
   Server issues:
   - Access token  (short-lived: 8h)
   - Refresh token (long-lived: 7d)

2. Client makes authenticated requests
        ↓
   Authorization: Bearer <access_token>
        ↓
   authenticate middleware verifies signature
        ↓
   requireRole middleware checks permission
        ↓
   Route handler runs

3. Access token expires
        ↓
   Server returns 401 "Token has expired"
        ↓
   Client sends refresh token to POST /auth/refresh
        ↓
   Server verifies refresh token
        ↓
   Server issues new access token + new refresh token
        ↓
   Client retries original request with new access token

4. User logs out
        ↓
   Client discards both tokens

  ```
**Route protection in practice**
```TypeScript
// Public routes — no middleware
router.post('/auth/register', registerHandler)
router.post('/auth/login',    loginHandler)
router.post('/auth/refresh',  refreshHandler)

// Authenticated — any logged in user
router.get('/auth/me', authenticate, meHandler)

// Role-specific
router.post('/bids',     authenticate, requireRole([UserRole.PROVIDER]), createBidHandler)
router.get('/admin',     authenticate, requireRole([UserRole.ADMIN]),    adminHandler)
router.post('/bookings', authenticate, requireRole([UserRole.RESIDENT]), createBookingHandler)

// Multiple roles allowed
router.get('/notifications', authenticate, requireRole([UserRole.RESIDENT, UserRole.PROVIDER]), notificationsHandler)

```
**API Reference**
POST /api/auth/refresh

Exchanges a valid refresh token for a new access token and refresh token.

Request body:
```json 
{
    "refreshToken": "eyJhbGci..."
}
```
Success response — 200 OK:
```json
{
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
        "accessToken": "eyJhbGci...",
        "refreshToken": "eyJhbGci...",
        "user": {
            "id": "uuid",
            "email": "enock@njirani.co.ke",
            "role": "RESIDENT"
        }
    }
}
```
Error responses:
| Status | Message | Cause | 
| ------ | ------ | ------ |
| 400 | Refresh token is required | No token in request body | 
| 401 | Invalid or expired refresh token | Token failed verification | 
| 401 | User no longer exists | User deleted after token issued |

GET /api/auth/me
Returns the currently authenticated user. Requires a valid access token.
```Http 
Authorization: Bearer <access_token>
```
Success response — 200 OK:
```json 
{
    "success": true,
    "user": {
        "userId": "uuid",
        "role": "RESIDENT"
    }
}
```
**Testing**
Authentication middleware test cases
```plain
✅ Valid token                     → 200
✅ No Authorization header         → 401
✅ Missing Bearer prefix           → 401
✅ Malformed token                 → 401
✅ Tampered token (changed chars)  → 401
✅ Expired token                   → 401 "Token has expired"
```

RBAC test cases
```plain 
✅ Correct role accessing route    → 200
✅ Wrong role accessing route      → 403 Forbidden
✅ No token accessing role route   → 401 Unauthorized
✅ Multiple allowed roles — match  → 200
✅ Multiple allowed roles — no match → 403
```

Refresh token test cases
```plain
✅ Valid refresh token             → 200 + new tokens
✅ Expired refresh token           → 401
✅ Malformed refresh token         → 401
✅ Tampered refresh token          → 401
✅ Missing refresh token in body   → 400
✅ Token for deleted user          → 401 "User no longer exists"
```
## Authentication and Authorization 
### Authentication Middleware, RBAC & Refresh Tokens 

Overview

This section  covers three foundational security features implemented in the Njirani backend:

- Authentication Middleware — verifying who is making a request
- Role-Based Access Control (RBAC) — verifying what they are allowed to do

These  features work together as a complete authentication system. Every protected route in Njirani passes through authentication and authorisation before any business logic runs.

**Why these features matter** 
Without authentication and authorisation, any user could access any route. A resident could trigger a payout. A provider could read another provider's private data. An anonymous request could delete a booking.

Authentication answers: who are you? Authorisation answers: are you allowed to do this?

Both questions must be answered on every protected request — in that order.

**Authentication vs Authorization** 
These two components are frequently confused.They are not the same thing.
| Concept | Question | Example |
| ------ | ------ | ------ |
| Authentication | Who are you ? | Verifying a JWT signature | 
| Authorization |  What are you allowed to do ? | CChecking if a RESIDENT can access an admin route | 

A request can be authenticated but not authorised. A RESIDENT sending a valid JWT to an admin-only route is authenticated — we know who they are — but not authorised — they do not have permission.

**Authentication Middleware** 
**What it does**
The authenticate middleware intercepts every request to a protected route before the route handler runs. It extracts the JWT from the Authorization header, verifies the signature and expiry, and attaches the decoded user payload to req.user.

**Why it is implemented as middleware**
Middleware runs once before the route handler. This means authentication logic lives in one place — not duplicated across every controller. Every route that needs authentication simply adds authenticate to its middleware chain.

**How a request flows through it** 
```plain 
Incoming request
        ↓
Extract Authorization header
        ↓
Does it start with "Bearer"?
    ├── No  → 401 Unauthorized
    └── Yes → Extract token
                ↓
           jwt.verify(token, JWT_SECRET)
                ↓
           Valid?
            ├── No  → 401 Invalid or expired token
            └── Yes → Attach decoded payload to req.user
                            ↓
                       Call next() → route handler runs

```
**Why we distinguish expired vs invalid tokens** 
```TypeScript
if (error instanceof jwt.TokenExpiredError) {
    return next(new UnauthorizedError('Token has expired'))
}
return next(new UnauthorizedError('Invalid token'))

```
The distinction matters for the client. An expired token means the client should use the refresh token to get a new access token. An invalid token means the client should redirect to login. Different errors — different client behaviour.

### Role-Based Access Control (RBAC)
**What it does**
The requireRole middleware checks whether the authenticated user's role is permitted to access a specific route. It runs after authenticate — meaning the user is already verified before roles are checked.

**Why RBAC** 
Njirani has three user types with different permissions:

| Role | Permissions | 
| ------ | ------ |
| RESIDENT | Post service requests, view bids, make payments, leave reviews |
| PROVIDER | View service requests, submit bids, receive payments | 
| ADMIN | Full access - manage estates, users, and all platform data | 

Without RBAC, a resident could access provider-only routes or worse — admin routes. Every sensitive route is locked to specific roles.

**Why require Role is a factory function**
requireRole returns a middleware function rather than being a middleware function itself. This pattern is called a middleware factory — it lets you configure the middleware differently per route.

```TypeScript 
// Each route declares its own allowed roles
router.get('/admin-only',   authenticate, requireRole([UserRole.ADMIN]),              handler)
router.post('/bids',        authenticate, requireRole([UserRole.PROVIDER]),            handler)
router.get('/my-bookings',  authenticate, requireRole([UserRole.RESIDENT]),            handler)
router.get('/dashboard',    authenticate, requireRole([UserRole.ADMIN, UserRole.PROVIDER]), handler)

```
**Why 401 and 403 are different responses**
```plain 
401 Unauthorized → the request has no valid identity
                   (no token, expired token, invalid token)

403 Forbidden    → the request has a valid identity
                   but is not permitted to access this resource
                   (wrong role)


```
Returning 401 when you mean 403 — or vice versa — is a common junior mistake. The distinction matters for clients handling errors and for security auditing.

**How it flows**
```plain 
req.user exists?
    ├── No  → 401 Unauthorized
    └── Yes → Is req.user.role in allowedRoles?
                ├── No  → 403 Forbidden
                └── Yes → next() → route handler runs

```

🏗️ **Architecture**

| Layer | File | Responsibility | 
| ------ | ------ | ------ | 
| Schema | auth.schema.ts | Validates { email, password } using Zod  |
| Controller | auth.controller.ts | Validates the request body, calls the authentication service, and returns 200 OK. |
| Service | auth.service.ts | Finds the user, compares the password, and signs the tokens. |
| JWT Utility | utils/jwt.ts | Signs and verifies JWTs using secrets provided through env.ts |

**Design principle**

The endpoint follows a simple separation of concerns:
```plain
Request
   │
   ▼
Schema Validation
   │
   ▼
Controller
   │
   ▼
Authentication Service
   │
   ├── Find User
   ├── Verify Password
   └── Issue Tokens
   │
   ▼
JWT Utility
   │
   ▼
Response
```
🔑 **JWT Token Design**
THe endpoint issues two different tokens because they serve different purposes.

| Token | Secret | Expiry | Payload | Purpose | 
| ------ | ------ | ------ | ------ | ------ |
| Access | JWT_SECRET | 15 minutes | { userId, role} | Authenticate API requests | 
| Refresh | JWT_REFRESH_SECRET | 7 days | { userId, role} | Obtain new access tokens without re-login | 

**Security decisions** 
- Tokens contain only userId and role 
- No email, password hash, or personal data is stored inside the JWT payload.
- JWT_SECRET and JWT_REFRESH_SECRET are intentionally separate.
- Compromising one secret does not automatically compromise the other token type.
- Both secrets are validated at application startup through Zod in env.ts.
- Each JWT secret must contain a minimum of 32 characters.

**Rule of thumb**: JWTs are signed, not encrypted. Treat their payload as readable by anyone who possesses the token.

🔄 **Login Flow**
```plain
POST /auth/login
        │
        ▼
Validate request with Zod
(email format + non-empty password)
        │
        ▼
Find user by email
        │
        ├─────────────── User not found ───────────────► 401
        │                                                "Invalid credentials"
        ▼
bcrypt.compare(inputPassword, storedHash)
        │
        ├─────────────── Password mismatch ────────────► 401
        │                                                "Invalid credentials"
        ▼
Remove passwordHash from user object
        │
        ▼
Sign access token (15m)
        │
        ▼
Sign refresh token (7d)
        │
        ▼
Return 200 OK
{ user, accessToken, refreshToken }

```

🛡️ **Security: Identical Authentication Errors**

Both of the following situations return the same response:

The user does not exist.

The supplied password is incorrect.
```JSON
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  },
  "message": "Invalid credentials"
}
```
**Why this matters**

Returning different messages such as:

"Email not found"

and:

"Wrong password"

can allow an attacker to determine which email addresses are registered.

The endpoint therefore deliberately uses Invalid credentials for both cases.

🧪 **Testing**

1. **Successful Login**

Request
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"password123"}'
```
Expected Response
```JSON
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Test",
      "email": "test@email.com",
      "phone": "0712345678",
      "role": "RESIDENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```
2. **Invalid Credentials**

Request
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@email.com","password":"wrongpassword"}'
```
Expected Response
```JSON
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
}
  "message": "Invalid credentials"
}
```

3. **Inspecting a JWT**

For development and debugging, the access token can be decoded using jwt.io.

The payload can be inspected there, but the signature will appear invalid because the tool does not know the application's private JWT secret.

Important: Never paste real production tokens or secrets into third-party tools.


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



