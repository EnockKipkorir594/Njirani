import rateLimit from 'express-rate-limit';

// ─── General rate limiter ─────────────────────────────────────
// Applied to all routes. Prevents flooding.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-* headers
});

// ─── Auth rate limiter ────────────────────────────────────────
// Stricter — auth endpoints (login, register, refresh) are
// expensive (bcrypt hashing on register/login). Prevents
// brute-force password attacks and credential stuffing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts (optional)
});