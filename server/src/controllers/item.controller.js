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

// Validation schema for querying wardrobe items
export const getItemsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  category: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim().toLowerCase() : undefined),
    z
      .enum(CATEGORIES, {
        errorMap: () => ({ message: `Invalid category. Allowed values: ${CATEGORIES.join(', ')}` }),
      })
      .optional()
  ),
  color: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val.toLowerCase() : undefined)),
  season: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim().toLowerCase() : undefined),
    z
      .enum(SEASONS, {
        errorMap: () => ({ message: `Invalid season. Allowed values: ${SEASONS.join(', ')}` }),
      })
      .optional()
  ),
  occasion: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim().toLowerCase() : undefined),
    z
      .enum(OCCASIONS, {
        errorMap: () => ({ message: `Invalid occasion. Allowed values: ${OCCASIONS.join(', ')}` }),
      })
      .optional()
  ),
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
 * Supports optional search, category, color, season, and occasion query filters.
 */
export const getItems = async (req, res, next) => {
  try {
    const validationResult = getItemsQuerySchema.safeParse(req.query);

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

    const { search, category, color, season, occasion } = validationResult.data;

    // Base filter: always filter strictly by logged-in user id
    const where = {
      userId: req.user.id,
    };

    if (category) {
      where.category = category;
    }

    if (color) {
      where.color = {
        equals: color,
        mode: 'insensitive',
      };
    }

    if (season) {
      where.season = season;
    }

    if (occasion) {
      where.occasion = occasion;
    }

    // search matches item name, fabric, and color (case-insensitive contains)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fabric: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
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
 * GET /api/items/filters
 * Returns distinct colors of the logged-in user's wardrobe items, sorted alphabetically.
 */
export const getItemFilters = async (req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        color: true,
      },
      distinct: ['color'],
    });

    const colors = items
      .map((item) => item.color)
      .filter((color) => typeof color === 'string' && color.trim().length > 0)
      .map((color) => color.trim().toLowerCase());

    const uniqueSortedColors = Array.from(new Set(colors)).sort((a, b) =>
      a.localeCompare(b)
    );

    return res.status(200).json({
      colors: uniqueSortedColors,
    });
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
