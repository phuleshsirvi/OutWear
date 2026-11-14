import crypto from 'crypto';

/**
 * Central error handling middleware for Express
 * - Sanitizes errors to prevent leaking internal database schemas, SQL, or file paths.
 * - Categorizes Zod, Multer, Prisma, and JSON parse errors into proper HTTP status codes.
 * - Logs full stack traces server-side with a unique requestId.
 * - Returns requestId to the client for support tracing.
 * - Includes stack trace in responses only in development mode.
 */
export const errorHandler = (err, req, res, next) => {
  const requestId = req.id || crypto.randomUUID();
  const isDev = process.env.NODE_ENV !== 'production';

  // Server-side logging with requestId
  console.error(`[Error ${requestId}] ${req.method} ${req.originalUrl || req.url}:`, err);

  // CORS forbidden origin
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Not allowed by CORS',
      requestId,
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  // 1. Malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      requestId,
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  // 2. Zod validation error
  if (err.name === 'ZodError' || Array.isArray(err.issues)) {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      error: 'Validation failed',
      details: issues.map((e) => ({
        field: e.path.join('.') || 'root',
        message: e.message,
      })),
      requestId,
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  // 3. Multer and file upload errors
  if (err.name === 'MulterError' || err.code === 'INVALID_FILE_TYPE') {
    let message = err.message || 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum allowed size is 5 MB';
    }
    return res.status(400).json({
      error: message,
      requestId,
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  // 4. Prisma known request errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this value already exists',
      requestId,
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      requestId,
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  // Prisma connection issues -> 503
  const isPrismaConnectionError =
    err.name === 'PrismaClientInitializationError' ||
    ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'].includes(err.code);

  if (isPrismaConnectionError) {
    return res.status(503).json({
      error: 'Something went wrong. Please try again.',
      requestId,
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  // Any other Prisma error (Validation, Rust panic, KnownRequest, etc.) -> 500
  const isPrismaOtherError =
    err.name?.startsWith('Prisma') ||
    Boolean(err.clientVersion) ||
    (typeof err.code === 'string' && err.code.startsWith('P'));

  if (isPrismaOtherError) {
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
      requestId,
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  // 5. Custom application status codes
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;

  // For 500+ errors, never leak internal implementation messages
  const clientMessage = isServerError
    ? 'Something went wrong. Please try again.'
    : err.message || 'Something went wrong. Please try again.';

  return res.status(statusCode).json({
    error: clientMessage,
    requestId,
    ...(isDev ? { stack: err.stack } : {}),
  });
};

export default errorHandler;
