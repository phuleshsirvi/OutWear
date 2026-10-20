/**
 * Central error handling middleware for Express
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]:', err);

  // Prisma unique constraint violation (code P2002)
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A user with this email already exists',
    });
  }

  // Zod validation error fallback
  if (err.name === 'ZodError' || err.issues) {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      error: 'Validation failed',
      details: issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    error: message,
  });
};
