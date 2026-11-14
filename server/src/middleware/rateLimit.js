import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP on login & register
 * Returns 429 with JSON message: "Too many attempts. Please try again later."
 * Skips successful requests so only failed login/register attempts are counted.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  statusCode: 429,
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Upload rate limiter: 30 per hour per user/IP on image uploads
 * Returns 429 with JSON error if exceeded.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  statusCode: 429,
  message: { error: 'Too many uploads. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Group by authenticated userId if present, otherwise by client IP
    if (req.user?.id) {
      return req.user.id;
    }
    return typeof ipKeyGenerator === 'function' ? ipKeyGenerator(req) : req.ip;
  },
});

/**
 * General API rate limiter: 300 requests per 15 minutes per IP on all other /api routes
 * Skips auth and upload endpoints which have dedicated stricter limits.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  statusCode: 429,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const originalUrl = req.originalUrl || req.url || '';
    // Skip routes with their own dedicated limiters
    return originalUrl.startsWith('/api/auth') || originalUrl.startsWith('/api/uploads');
  },
});

