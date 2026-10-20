import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../db.js';

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

/**
 * POST /api/auth/register
 * Accepts name, email, password
 * Validates input, checks for duplicate email, hashes password, saves user with Prisma,
 * and returns id, name, and email only.
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

    // 4. Save the user with Prisma
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

    // 5. Return id, name, and email only (never return passwordHash)
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};
