import { z } from 'zod';
import prisma from '../db.js';
import { OCCASIONS } from '../constants/wardrobe.js';

// Preprocessing helper to normalize occasion enum
const normalizedOccasion = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() ? val.trim().toLowerCase() : undefined),
  z
    .enum(OCCASIONS, {
      errorMap: () => ({ message: `Invalid occasion. Allowed values: ${OCCASIONS.join(', ')}` }),
    })
    .optional()
    .nullable()
);

// Validation schema for creating or updating an outfit
export const createOutfitSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be between 2 and 60 characters')
    .max(60, 'Name must be between 2 and 60 characters'),
  occasion: normalizedOccasion,
  itemIds: z
    .array(z.string({ required_error: 'Item IDs are required' }).min(1, 'Invalid item ID'), {
      required_error: 'Item IDs are required',
    })
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Item IDs must be unique',
    })
    .refine((ids) => ids.length >= 2 && ids.length <= 12, {
      message: 'An outfit must contain between 2 and 12 items',
    }),
});

/**
 * Format outfit object to flatten outfitItems into an array of items
 * (id, name, category, color, imageUrl) and itemIds.
 */
export function formatOutfit(outfit) {
  const items = outfit.outfitItems
    ? outfit.outfitItems.map((oi) => oi.item).filter(Boolean)
    : [];

  return {
    id: outfit.id,
    userId: outfit.userId,
    name: outfit.name,
    occasion: outfit.occasion || null,
    createdAt: outfit.createdAt,
    items,
    itemIds: items.map((i) => i.id),
  };
}

/**
 * Common item select projection
 */
const ITEM_SELECT = {
  id: true,
  name: true,
  category: true,
  color: true,
  imageUrl: true,
};

/**
 * POST /api/outfits
 * Creates a new outfit with 2 to 12 items in a single Prisma transaction.
 * Verifies that all items belong to the logged-in user.
 */
export const createOutfit = async (req, res, next) => {
  try {
    const validationResult = createOutfitSchema.safeParse(req.body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      return res.status(400).json({
        error: 'Validation failed',
        message: issues[0]?.message || 'Validation failed',
        details: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { name, occasion, itemIds } = validationResult.data;
    const userId = req.user.id;

    // Verify that EVERY item id belongs to the logged-in user
    const existingItems = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        userId,
      },
      select: { id: true },
    });

    if (existingItems.length !== itemIds.length) {
      return res.status(400).json({
        error: 'One or more items were not found',
        message: 'One or more items were not found',
      });
    }

    // Create the outfit and its OutfitItem rows in a single Prisma transaction
    const newOutfit = await prisma.$transaction(async (tx) => {
      return tx.outfit.create({
        data: {
          userId,
          name,
          occasion: occasion || null,
          outfitItems: {
            create: itemIds.map((itemId) => ({
              userId,
              itemId,
            })),
          },
        },
        include: {
          outfitItems: {
            include: {
              item: {
                select: ITEM_SELECT,
              },
            },
          },
        },
      });
    });

    return res.status(201).json(formatOutfit(newOutfit));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/outfits
 * Returns only the logged-in user's outfits, newest first,
 * each with its items (id, name, category, color, imageUrl).
 */
export const getOutfits = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const outfits = await prisma.outfit.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        outfitItems: {
          include: {
            item: {
              select: ITEM_SELECT,
            },
          },
        },
      },
    });

    const formatted = outfits.map(formatOutfit);
    return res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/outfits/:id
 * Returns one outfit with items, belonging to the logged-in user.
 * Returns 404 if not found or belongs to another user.
 */
export const getOutfitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const outfit = await prisma.outfit.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        outfitItems: {
          include: {
            item: {
              select: ITEM_SELECT,
            },
          },
        },
      },
    });

    if (!outfit) {
      return res.status(404).json({
        error: 'Outfit not found',
        message: 'Outfit not found',
      });
    }

    return res.status(200).json(formatOutfit(outfit));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/outfits/:id
 * Updates an outfit's name, occasion, and replaces its item list in a transaction.
 * Returns 404 if not found or belongs to another user.
 */
export const updateOutfit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Verify outfit exists and belongs to logged-in user
    const existingOutfit = await prisma.outfit.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingOutfit) {
      return res.status(404).json({
        error: 'Outfit not found',
        message: 'Outfit not found',
      });
    }

    // 2. Validate input fields
    const validationResult = createOutfitSchema.safeParse(req.body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      return res.status(400).json({
        error: 'Validation failed',
        message: issues[0]?.message || 'Validation failed',
        details: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { name, occasion, itemIds } = validationResult.data;

    // 3. Verify that EVERY item belongs to the logged-in user
    const existingItems = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        userId,
      },
      select: { id: true },
    });

    if (existingItems.length !== itemIds.length) {
      return res.status(400).json({
        error: 'One or more items were not found',
        message: 'One or more items were not found',
      });
    }

    // 4. Replace the item list in a transaction
    const updatedOutfit = await prisma.$transaction(async (tx) => {
      // Remove previous outfit item associations
      await tx.outfitItem.deleteMany({
        where: {
          outfitId: id,
        },
      });

      // Update outfit details and create new outfit item associations
      return tx.outfit.update({
        where: { id },
        data: {
          name,
          occasion: occasion || null,
          outfitItems: {
            create: itemIds.map((itemId) => ({
              userId,
              itemId,
            })),
          },
        },
        include: {
          outfitItems: {
            include: {
              item: {
                select: ITEM_SELECT,
              },
            },
          },
        },
      });
    });

    return res.status(200).json(formatOutfit(updatedOutfit));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/outfits/:id
 * Deletes an outfit for the logged-in user.
 * Deleting an outfit removes OutfitItem join rows but does NOT delete the items themselves.
 */
export const deleteOutfit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingOutfit = await prisma.outfit.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingOutfit) {
      return res.status(404).json({
        error: 'Outfit not found',
        message: 'Outfit not found',
      });
    }

    await prisma.$transaction(async (tx) => {
      // Delete join table rows
      await tx.outfitItem.deleteMany({
        where: {
          outfitId: id,
        },
      });

      // Delete outfit (Item records remain completely intact)
      await tx.outfit.delete({
        where: {
          id,
        },
      });
    });

    return res.status(200).json({
      message: 'Outfit deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

