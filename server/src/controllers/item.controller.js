import { z } from 'zod';
import prisma from '../db.js';
import { CATEGORIES, SEASONS, OCCASIONS } from '../constants/wardrobe.js';

// Preprocessing helper to trim and lowercase strings
const normalizedEnum = (values, label) =>
  z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
    z.enum(values, {
      errorMap: () => ({ message: `Invalid ${label}. Allowed values: ${values.join(', ')}` }),
    })
  );

// Validation schema for creating a wardrobe item
export const createItemSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required'),
  category: normalizedEnum(CATEGORIES, 'category'),
  color: z
    .string({ required_error: 'Color is required' })
    .trim()
    .min(1, 'Color is required')
    .toLowerCase(),
  season: normalizedEnum(SEASONS, 'season'),
  occasion: normalizedEnum(OCCASIONS, 'occasion'),
  fabric: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  price: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? null : Number(val)),
    z
      .number({ invalid_type_error: 'Price must be a number' })
      .min(0, 'Price must be greater than or equal to 0')
      .nullable()
      .optional()
  ),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.startsWith('https://res.cloudinary.com/'),
      { message: 'imageUrl must start with https://res.cloudinary.com/' }
    )
    .transform((val) => (val && val.length > 0 ? val : null)),
  imagePublicId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

/**
 * POST /api/items
 * Creates a new wardrobe item for the authenticated user.
 */
export const createItem = async (req, res, next) => {
  try {
    const validationResult = createItemSchema.safeParse(req.body);

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

    const {
      name,
      category,
      color,
      season,
      occasion,
      fabric,
      price,
      imageUrl,
      imagePublicId,
    } = validationResult.data;

    const item = await prisma.item.create({
      data: {
        userId: req.user.id,
        name,
        category,
        color,
        season,
        occasion,
        fabric,
        price,
        imageUrl,
        imagePublicId,
      },
    });

    return res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/items
 * Returns all wardrobe items belonging to the authenticated user, newest first.
 */
export const getItems = async (req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/items/:id
 * Returns a single wardrobe item by ID only if it belongs to the authenticated user.
 * Returns 404 if item does not exist or belongs to another user.
 */
export const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'Item not found',
      });
    }

    return res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};
