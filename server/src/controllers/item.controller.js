import { z } from 'zod';
import prisma from '../db.js';
import cloudinary from '../config/cloudinary.js';
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

// Update item schema (same fields as create)
export const updateItemSchema = createItemSchema;

// Validation schema for underused items query
export const underusedQuerySchema = z.object({
  days: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 30 : Number(val)),
    z.union(
      [z.literal(30), z.literal(60), z.literal(90)],
      { errorMap: () => ({ message: 'days must be one of: 30, 60, 90' }) }
    )
  ),
  category: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim().toLowerCase() : undefined),
    z
      .enum(CATEGORIES, {
        errorMap: () => ({ message: `Invalid category. Allowed values: ${CATEGORIES.join(', ')}` }),
      })
      .optional()
  ),
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

/**
 * PUT /api/items/:id
 * Updates an existing wardrobe item for the authenticated user.
 * Validates with Zod, cleans up old Cloudinary photo if replaced, and returns the updated item.
 */
export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Find item by id and userId (never allow editing another user's item)
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'Item not found',
      });
    }

    // 2. Validate input fields
    const validationResult = updateItemSchema.safeParse(req.body);

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

    // 3. If a new imagePublicId is sent and differs from the old one, delete old Cloudinary image
    if (
      existingItem.imagePublicId &&
      imagePublicId &&
      existingItem.imagePublicId !== imagePublicId
    ) {
      try {
        await cloudinary.uploader.destroy(existingItem.imagePublicId);
      } catch (cloudErr) {
        console.error('Failed to delete old image from Cloudinary:', cloudErr);
      }
    }

    // 4. Update the item in PostgreSQL
    const updatedItem = await prisma.item.update({
      where: {
        id,
      },
      data: {
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

    return res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/items/:id
 * Deletes a wardrobe item belonging to the authenticated user.
 * Cleans up associated OutfitItems, WearLogs, and Cloudinary photo.
 */
export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Find item by id and userId
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'Item not found',
      });
    }

    // 2. Remove associated WearLogs and OutfitItems (cascade safeguard)
    await prisma.wearLog.deleteMany({
      where: {
        itemId: id,
      },
    });

    await prisma.outfitItem.deleteMany({
      where: {
        itemId: id,
      },
    });

    // 3. Delete item from database
    await prisma.item.delete({
      where: {
        id,
      },
    });

    // 4. Delete image from Cloudinary if present (log failures, do not fail request)
    if (existingItem.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(existingItem.imagePublicId);
      } catch (cloudErr) {
        console.error('Failed to delete image from Cloudinary:', cloudErr);
      }
    }

    return res.status(200).json({
      message: 'Item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/items/underused
 * Returns the logged-in user's items that are either never worn (lastWornAt is null)
 * or last worn more than `days` days ago.
 *
 * Sort order:
 *  - Never worn first (sorted by createdAt DESC — newest added first among them)
 *  - Then by lastWornAt ASC (longest unworn / most neglected first)
 *
 * Each item includes: id, name, category, color, imageUrl, wearCount, lastWornAt, createdAt,
 *   daysSinceWorn (null if never worn), daysOwned (only for never-worn items)
 *
 * Also returns a summary: { totalItems, underusedCount, neverWornCount, percentUnused }
 */
export const getUnderused = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Validate query params
    const validationResult = underusedQuerySchema.safeParse({
      days: req.query.days,
      category: req.query.category,
    });

    if (!validationResult.success) {
      const issues = validationResult.error.issues || [];
      return res.status(400).json({
        error: 'Validation failed',
        message: issues[0]?.message || 'Invalid query parameters',
        details: issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { days, category } = validationResult.data;

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Build where clause
    const baseWhere = {
      userId,
      ...(category ? { category } : {}),
    };

    // Fetch ALL user items for the summary (with optional category filter)
    const allUserItems = await prisma.item.findMany({
      where: baseWhere,
      select: { id: true, lastWornAt: true },
    });

    const totalItems = allUserItems.length;

    // Fetch underused items: never worn OR last worn before cutoff
    const underusedItems = await prisma.item.findMany({
      where: {
        ...baseWhere,
        OR: [
          { lastWornAt: null },
          { lastWornAt: { lt: cutoffDate } },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        color: true,
        imageUrl: true,
        wearCount: true,
        lastWornAt: true,
        createdAt: true,
      },
    });

    // Annotate each item with computed fields
    const annotated = underusedItems.map((item) => {
      const isNeverWorn = item.lastWornAt === null;

      const daysSinceWorn = isNeverWorn
        ? null
        : Math.floor((now.getTime() - new Date(item.lastWornAt).getTime()) / (1000 * 60 * 60 * 24));

      const daysOwned = isNeverWorn
        ? Math.floor((now.getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.color,
        imageUrl: item.imageUrl,
        wearCount: item.wearCount,
        lastWornAt: item.lastWornAt,
        createdAt: item.createdAt,
        daysSinceWorn,
        ...(isNeverWorn ? { daysOwned } : {}),
      };
    });

    // Sort: never worn first (by createdAt DESC), then by lastWornAt ASC
    annotated.sort((a, b) => {
      const aIsNever = a.lastWornAt === null;
      const bIsNever = b.lastWornAt === null;

      if (aIsNever && bIsNever) {
        // Both never worn: newest added first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (aIsNever) return -1; // a (never worn) comes before b
      if (bIsNever) return 1;  // b (never worn) comes before a

      // Both have lastWornAt: longest unworn first (ascending)
      return new Date(a.lastWornAt).getTime() - new Date(b.lastWornAt).getTime();
    });

    const underusedCount = annotated.length;
    const neverWornCount = annotated.filter((i) => i.lastWornAt === null).length;
    const percentUnused = totalItems === 0 ? 0 : Math.round((underusedCount / totalItems) * 100);

    return res.status(200).json({
      summary: {
        totalItems,
        underusedCount,
        neverWornCount,
        percentUnused,
      },
      items: annotated,
    });
  } catch (error) {
    next(error);
  }
};
