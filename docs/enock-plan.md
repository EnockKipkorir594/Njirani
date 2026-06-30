# Attachment to Final Year: Your Game Plan

This sounds good. I like that you're already backend-biased, that's a real strength, not a limitation. The goal between now and final year is simple: come out **T-shaped**. Deep in backend, broad enough to be dangerous everywhere else, with **one serious project** and clean engineering habits to prove it. That combination is what makes an employer pick you over fifty other graduates with the same transcript.

Here's how I'd think about it, in order.

---

## The North Star: one serious, real project

Everything else hangs off this. Pick one real product and build it across the whole year, continuously adding features, fixes and improvements. Not ten abandoned tutorials, one real thing.

- **Kitu locally relevant ndio i-stand out.** Can be fintech, a management system, logistics, etc. Solve a problem you actually see around you.
- **Wire in as many real integrations as you can:** Daraja API for M-Pesa, SMS, email alerts (Gmail SMTP works), WhatsApp API, and so on. The point is to expose you to many different integration styles.
- **Add one AI feature** using an LLM API (Claude, GPT). Natural-language search, smart categorization, a support assistant, something. In 2026 a backend dev who can wire in AI cleanly stands out, and it's easier than people think.
- **Structure it as a GitHub monorepo:** `/backend` (your FastAPI/Django API), `/frontend` (web), and later `/mobile`. Open source it, write a clean README, keep commits regular. By 4th year, this repo is your story.

As you build it, layer in the four pillars below.

---

## Pillar 1: Go deep on backend

This is your home turf, so this is where you should be strongest. Move from "I can use the framework" to "I can ship something that survives production."

- **Testing:** pytest, fixtures, aim for real coverage. Untested code reads as junior code.
- **Async and performance:** async FastAPI, Redis for caching, Celery/RQ for background jobs (emails, reports, payment callbacks). Understand a message broker (Redis, or RabbitMQ/Kafka at least conceptually) for event-driven work.
- **API craft:** proper pagination, filtering, rate-limiting, versioning, consistent error responses. (Look up "REST API design best practices".)
- **Auth done right:** JWT/OAuth2, refresh tokens, role-based access. You've touched this, go deeper.
- **Security as a habit:** you've already started here. Build on it with OWASP Top 10 awareness, secrets in env vars or Secret Manager (never in code), dependency scanning (Dependabot, Trivy), and HTTPS everywhere.
- **Database depth:** indexing, query optimization (`EXPLAIN ANALYZE`), migrations (Alembic), connection pooling. Schema design you have; now make it fast.
- **System design basics:** how caching, queues, load balancing, read replicas and indexes fit together. Even a rough grasp makes you reason better about your own app and is gold in interviews.
- **One typed/compiled language** for range and credibility. Go is the sweet spot for backend, and it pairs beautifully with the infra stuff later. Optional but high-leverage.

---

## Pillar 2: Add breadth, become fullstack

You don't need to be a frontend expert. You just need to not be helpless outside the API. That's what "fullstack" really means on a CV.

- **TypeScript and Node** (Express or NestJS): massive job market, and TS makes you better everywhere. Build one service in Node so you can honestly claim it.
- **Frontend:** React, Next.js and Tailwind, enough to build the web client for your own project. Since you're consuming your own APIs, it's the best way to learn both sides at once.
- **Where mobile fits:** treat it as the mobile client of your flagship project, not a separate journey. Easiest path is Flutter or React Native, one codebase that hits your existing API. That gives you a killer end-to-end story: "I built the backend, web and mobile for this product." Only go native Android (Kotlin) if you fall in love with mobile, otherwise don't spread thin.

---

## Pillar 3: Engineering craft (the "DevOps-lite" that boosts every dev)

You're right not to dive into the full DevOps rabbit hole, that's a separate career. But this slice of it makes you a far stronger developer and is exactly what teams expect.

- **Git and GitHub mastery:** branching, clean PRs, code review, conventional commits. Non-negotiable.
- **CI/CD with GitHub Actions:** every push runs your tests and linting, builds your Docker image, and auto-deploys. This is the "release automation" you mentioned, and it's app-focused, not infra-heavy.
- **Linux fluency:** live in the terminal. Processes, permissions, networking basics, systemd, logs, shell scripting. Deep Linux understanding pays off in every engineering role forever.
- **Docker** (you have the basics), then add docker-compose to run your whole stack (API, DB, Redis) with one command.
- **Testing and QA mindset:** automated tests in CI, basic load testing.
- **Observability:** structured logging, error tracking with Sentry, basic APM/monitoring. Knowing why prod broke is a senior trait you can start building now.

### Cloud-native on GCP free tier

You get $300 of credit for 90 days, and you can open with another email later to keep going. Do these in order; each is about a weekend, and it stays free.

1. **Cloud Run (start here):** deploy your Docker container serverless. Scales to zero, generous always-free tier (around 2M requests/month), and it's exactly how modern teams ship containers. Wire it to GitHub Actions so a push auto-deploys. This is your first real public URL.
2. **Cloud SQL (managed Postgres):** move your DB off your laptop onto a managed cloud database. Learn connections, backups, and how `DATABASE_URL` wiring works in production. (For free Postgres, Neon or Supabase pair perfectly with Cloud Run.)
3. **Serverless / Cloud Functions:** event-driven bits with no server to babysit, like processing an M-Pesa callback, resizing an upload, or sending a scheduled report.
4. **Kubernetes:** learn it locally first with kind or minikube (free), pods, deployments, services, configmaps. Then push the same app to GKE Autopilot to feel real orchestration. Get the mental model, don't move in; it's a strong CV signal and the foundation of serious infra.
5. **Monitoring (Prometheus and Grafana):** expose a `/metrics` endpoint from FastAPI, scrape it with Prometheus, build Grafana dashboards for requests, latency and errors. Run both in docker-compose locally first, then graduate to Kubernetes-hosted or VM-hosted, or Google Managed Prometheus, or Grafana Cloud's free tier.

### Domain and everything-as-code (the capstone that ties it together)

- **Get your own domain (around $10/year from Cloudflare):** they also offer a lot of free services worth exploring in detail.
- **Run all DNS in Cloudflare (free):** point records at your GCP setup, `A`/`AAAA` to a load balancer, `CNAME` to Cloud Run, subdomains like `api.yourapp.com`, `app.yourapp.com`, `grafana.yourapp.com`. Free SSL, CDN and DDoS protection come along for free. You can also delegate a sub-domain to Google Cloud DNS and manage your entire GCP free-tier deployment from there.
- **Free Cloudflare wins worth grabbing:**
  - **Email Routing:** a professional `you@yourdomain.com` that forwards to Gmail (free). Put it on every application.
  - **Cloudflare Tunnel:** expose your localhost over public HTTPS with no public IP. Perfect for testing M-Pesa Daraja callbacks during dev, since Daraja needs a reachable HTTPS endpoint.
  - **Pages** for free static frontend hosting, and **R2** for S3-compatible object storage with no egress fees.
- **Infrastructure as Code (Terraform):** stop clicking in the GCP console. Define Cloud Run, Cloud SQL, buckets, IAM, the load balancer and DNS in code. Keep state in a GCS bucket backend, learn variables and modules, and always run `plan` before `apply`. IaC is one of the highest-paid, most in-demand skills out there, and having it on a real project as a student is a serious edge.
- **Then automate the whole stack (GitOps):** the end state is that you push to GitHub and a pipeline runs the tests, builds the image, pushes it to Artifact Registry, then applies Terraform and deploys to Cloud Run, with zero manual steps. Use GitHub Actions with Workload Identity Federation (keyless auth to GCP, no service-account JSON keys lying around) and Secret Manager for secrets. Everything reproducible from code, nothing living only in someone's head.

One warning, since it's your money: Cloud Run and Cloud Functions are genuinely always-free, but GKE and Cloud SQL start billing once the credit runs out. Set a budget alert on day one, keep `terraform destroy` handy, and tear down what you're not using.

---

## Pillar 4: Be visible, interview-ready, and easy to work with

Skills nobody can see don't get you hired. Run this in parallel through 4th year.

- **Green GitHub:** commit often. A busy, real profile beats a perfect-looking CV.
- **DSA prep:** a couple of problems a week on https://leetcode.com/. You will sit coding interviews, don't let that be the thing that trips you.
- **Write often:** short technical posts (Dev.to, Medium or LinkedIn) on things you build. "How I integrated M-Pesa with FastAPI" will literally show up on Google and market you while you sleep.
- **Open source:** fix a few small issues in projects you use. Real PRs are real proof.
- **Work like a teammate:** standups, reading tickets, writing clear PR descriptions, asking good questions, giving and taking code review. This is half of what employers are really buying.
- **LinkedIn and networking:** post your progress, connect with engineers, join local dev communities. A lot of jobs here come through people, not portals.

---

## Roughly how to sequence it

You can't do all of this at once, so here's the rough order:

- **During attachment (now):** crush whatever real work they give you, and on the side lock in Git, Linux, testing, and start the project.
- **First half of 4th year:** build the project's backend properly, deploy it on Cloud Run with a managed database, add CI/CD, and put a simple frontend on it.
- **Second half:** add the breadth (TypeScript, maybe mobile), the IaC and GitOps automation, monitoring, and the AI feature. Ramp up DSA and start applying early, don't wait for final semester.
- **By graduation:** one real product live on your own domain, a green GitHub, a few posts, and enough prep to walk into interviews calm.

---

One rule above all: depth beats collecting. Don't half-learn ten things. Own backend, ship one real fullstack product on your own domain, and you're already ahead of most of your class. Pick the project this week, even if it's just the idea and an empty repo. Momentum is the whole game, and I'm right here for any step. Tukae kazi.
