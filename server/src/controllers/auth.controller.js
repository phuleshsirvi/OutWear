import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../db.js';
import env from '../config/env.js';

// Precomputed 12-round bcrypt hash used to equalize execution time when a user does not exist
const DUMMY_HASH = '$2a$12$e8uq0e1t.4W6Gv7yY3fV3OBk3cZc58M8hR58w2Yv28P2C.wE1Xf9W';

// Cookie configuration options depending on NODE_ENV
const getCookieOptions = () => {
  const isProd = (env.NODE_ENV || process.env.NODE_ENV) === 'production';
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
};

const getClearCookieOptions = () => {
  const isProd = (env.NODE_ENV || process.env.NODE_ENV) === 'production';
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  };
};

// Helper to create 7-day JWT
const createToken = (userId) => {
  const secret = env.JWT_SECRET || process.env.JWT_SECRET || 'outwear_jwt_secret_dev_key';
  return jwt.sign({ id: userId, userId }, secret, {
    expiresIn: '7d',
  });
};

// Zod validation schema for user registration
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters'),
});

// Zod validation schema for user login
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(72, 'Password cannot exceed 72 characters'),
});

/**
 * POST /api/auth/register
 * Accepts name, email, password
 * Validates input, checks duplicate email, hashes password with bcrypt (cost factor 12),
 * saves with Prisma, sets httpOnly auth cookie, and returns id, name, and email only.
 */
export const register = async (req, res, next) => {
  try {
    // 1. Validate request body with Zod
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      return res.status(400).json({
        error: 'Validation failed',
        details: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { name, email, password } = validationResult.data;

    // 2. Reject duplicate email with clear 409 error
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'A user with this email already exists',
      });
    }

    // 3. Hash the password with bcryptjs at cost factor 12
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Save user with Prisma
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // 5. Create JWT and set httpOnly cookie
    const token = createToken(user.id);
    res.cookie('token', token, getCookieOptions());

    // 6. Return id, name, and email only (never return passwordHash)
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Accepts email, password
 * Validates input, lowercases email, verifies credentials against database or dummy hash,
 * sets httpOnly auth cookie, and returns id, name, and email only.
 */
export const login = async (req, res, next) => {
  try {
    // 1. Validate request body with Zod
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      return res.status(400).json({
        error: 'Validation failed',
        details: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { email, password } = validationResult.data;

    // 2. Find user by normalized email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Compare password with bcryptjs (use DUMMY_HASH if user not found to prevent timing-based user enumeration)
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // 4. Create JWT and set httpOnly cookie
    const token = createToken(user.id);
    res.cookie('token', token, getCookieOptions());

    // 5. Return id, name, and email only (never return passwordHash)
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clears the auth cookie with matching environment options and returns success
 */
export const logout = async (req, res) => {
  res.clearCookie('token', getClearCookieOptions());

  return res.status(200).json({
    message: 'Logged out successfully',
  });
};

/**
 * GET /api/auth/me
 * Protected route that returns the authenticated user (id, name, email)
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
  });
};
