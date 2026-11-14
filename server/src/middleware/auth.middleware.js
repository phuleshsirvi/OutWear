import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import env from '../config/env.js';

/**
 * Authentication middleware
 * Reads token from httpOnly cookie (or Bearer header),
 * verifies token, loads user from database, and attaches to req.user.
 * Returns 401 if token is missing, invalid, or user no longer exists.
 */
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Read token from cookie (or Bearer token in Authorization header)
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing',
      });
    }

    // 2. Verify token
    const JWT_SECRET = env.JWT_SECRET || process.env.JWT_SECRET || 'outwear_jwt_secret_dev_key';

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token payload',
      });
    }

    // 3. Load user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User no longer exists',
      });
    }

    // 4. Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
