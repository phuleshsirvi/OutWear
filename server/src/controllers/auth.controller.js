import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../db.js';

// Cookie configuration options
const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
});

// Helper to create 7-day JWT
const createToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'outwear_jwt_secret_dev_key';
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
    .min(8, 'Password must be at least 8 characters'),
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
    .min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Accepts name, email, password
 * Validates input, checks duplicate email, hashes password, saves with Prisma,
 * sets httpOnly auth cookie, and returns id, name, and email only.
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

    // 3. Hash the password with bcryptjs
    const salt = await bcrypt.genSalt(10);
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

    // 6. Return id, name, and email only
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
 * Validates input, lowercases email, verifies credentials with bcryptjs,
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

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        message: 'Invalid email or password',
      });
    }

    // 3. Compare password with bcryptjs
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password',
        message: 'Invalid email or password',
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
 * Clears the auth cookie and returns a success message
 */
export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

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
