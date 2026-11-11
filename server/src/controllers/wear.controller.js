import prisma from '../db.js';

/**
 * Validates and parses wear date:
 * - Must be a valid date
 * - Must not be in the future
 * - Must not be older than 1 year
 * Default to current date and time if omitted
 */
function parseAndValidateWearDate(dateInput) {
  if (!dateInput) {
    return new Date();
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const err = new Error('Invalid date format. Expected an ISO date string');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  // 5 minute grace period for small client/server clock drift
  const maxFuture = new Date(now.getTime() + 5 * 60 * 1000);
  if (d > maxFuture) {
    const err = new Error('Wear date cannot be in the future');
    err.status = 400;
    throw err;
  }

  const oneYearAgo = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);
  oneYearAgo.setHours(0, 0, 0, 0);
  if (d < oneYearAgo) {
    const err = new Error('Wear date cannot be older than 1 year');
    err.status = 400;
    throw err;
  }

  return d;
}

/**
 * Helper to compute the calendar day start and end timestamps
 */
function getCalendarDayBounds(date) {
  const d = new Date(date);

  // UTC bounds
  const startOfDay = new Date(d);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(d);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

/**
 * POST /api/wear/item/:itemId
 * Logs wear for a single wardrobe item on a specific calendar day.
 * Prevents double logging for the same calendar day (409 Conflict).
 * Updates wearCount and advances lastWornAt if targetDate >= current lastWornAt.
 */
export const logItemWear = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // 1. Validate date
    const targetDate = parseAndValidateWearDate(req.body?.date);
    const { startOfDay, endOfDay } = getCalendarDayBounds(targetDate);

    // 2. Find item by id and userId (else 404)
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'Item not found',
      });
    }

    // 3. Prevent accidental double logging for the same calendar day
    const existingLog = await prisma.wearLog.findFirst({
      where: {
        userId,
        itemId,
        wornAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingLog) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Already logged for this day',
      });
    }

    // 4. In ONE Prisma transaction: create WearLog, increment wearCount, update lastWornAt
    const updatedItem = await prisma.$transaction(async (tx) => {
      // Create WearLog
      await tx.wearLog.create({
        data: {
          userId,
          itemId,
          wornAt: targetDate,
        },
      });

      // Advance lastWornAt to targetDate only if it does not move lastWornAt backwards
      const currentLastWorn = item.lastWornAt ? new Date(item.lastWornAt) : null;
      const newLastWornAt =
        currentLastWorn && currentLastWorn > targetDate ? currentLastWorn : targetDate;

      return tx.item.update({
        where: { id: itemId },
        data: {
          wearCount: { increment: 1 },
          lastWornAt: newLastWornAt,
        },
      });
    });

    return res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/wear/outfit/:outfitId
 * Logs wear for an outfit and each of its constituent items.
 * Prevents double logging for the outfit on the same calendar day (409 Conflict).
 * In ONE Prisma transaction creates outfit log and item logs, updates wearCounts and lastWornAt.
 */
export const logOutfitWear = async (req, res, next) => {
  try {
    const { outfitId } = req.params;
    const userId = req.user.id;

    // 1. Validate date
    const targetDate = parseAndValidateWearDate(req.body?.date);
    const { startOfDay, endOfDay } = getCalendarDayBounds(targetDate);

    // 2. Find outfit with items by id and userId (else 404)
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        userId,
      },
      include: {
        outfitItems: {
          include: {
            item: true,
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

    // 3. Prevent accidental double logging for the outfit on the same calendar day
    const existingLog = await prisma.wearLog.findFirst({
      where: {
        userId,
        outfitId,
        wornAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingLog) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Already logged for this day',
      });
    }

    // 4. In ONE Prisma transaction: create outfit log, item logs, update items
    const resultOutfit = await prisma.$transaction(async (tx) => {
      // Create WearLog row for the outfit
      await tx.wearLog.create({
        data: {
          userId,
          outfitId,
          itemId: null,
          wornAt: targetDate,
        },
      });

      const items = outfit.outfitItems.map((oi) => oi.item).filter(Boolean);

      // For every item in the outfit, create its own WearLog row and update wear stats
      for (const item of items) {
        await tx.wearLog.create({
          data: {
            userId,
            itemId: item.id,
            outfitId,
            wornAt: targetDate,
          },
        });

        const currentLastWorn = item.lastWornAt ? new Date(item.lastWornAt) : null;
        const newLastWornAt =
          currentLastWorn && currentLastWorn > targetDate ? currentLastWorn : targetDate;

        await tx.item.update({
          where: { id: item.id },
          data: {
            wearCount: { increment: 1 },
            lastWornAt: newLastWornAt,
          },
        });
      }

      // Return refreshed outfit with updated items
      return tx.outfit.findUnique({
        where: { id: outfitId },
        include: {
          outfitItems: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  color: true,
                  imageUrl: true,
                  wearCount: true,
                  lastWornAt: true,
                },
              },
            },
          },
        },
      });
    });

    const items = resultOutfit.outfitItems
      ? resultOutfit.outfitItems.map((oi) => oi.item).filter(Boolean)
      : [];

    return res.status(200).json({
      id: resultOutfit.id,
      userId: resultOutfit.userId,
      name: resultOutfit.name,
      occasion: resultOutfit.occasion,
      createdAt: resultOutfit.createdAt,
      items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wear/history?limit=30
 * Retrieves recent wear logs for the authenticated user, newest first.
 * Validates limit (1-100, default 30).
 * Formats each entry with name, photo, date, and item/outfit details.
 */
export const getWearHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Validate limit parameter (1-100, default 30)
    let limit = 30;
    if (req.query.limit !== undefined) {
      const parsed = parseInt(req.query.limit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Limit must be an integer between 1 and 100',
        });
      }
      limit = parsed;
    }

    // Query distinct primary wear events:
    // - Standalone item wear: itemId is set and outfitId is null
    // - Outfit wear: outfitId is set and itemId is null
    const logs = await prisma.wearLog.findMany({
      where: {
        userId,
        OR: [
          { outfitId: { not: null }, itemId: null },
          { itemId: { not: null }, outfitId: null },
        ],
      },
      orderBy: {
        wornAt: 'desc',
      },
      take: limit,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            color: true,
            imageUrl: true,
          },
        },
        outfit: {
          include: {
            outfitItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    color: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const formattedLogs = logs.map((log) => {
      if (log.outfit) {
        const outfitItems = log.outfit.outfitItems
          ? log.outfit.outfitItems.map((oi) => oi.item).filter(Boolean)
          : [];
        const photo =
          outfitItems.find((i) => i.imageUrl)?.imageUrl || null;

        return {
          id: log.id,
          type: 'outfit',
          outfitId: log.outfit.id,
          name: log.outfit.name,
          occasion: log.outfit.occasion || null,
          photo,
          imageUrl: photo,
          date: log.wornAt,
          wornAt: log.wornAt,
          itemCount: outfitItems.length,
          items: outfitItems,
        };
      }

      const photo = log.item?.imageUrl || null;
      return {
        id: log.id,
        type: 'item',
        itemId: log.item?.id || null,
        name: log.item?.name || 'Wardrobe item',
        category: log.item?.category || null,
        color: log.item?.color || null,
        photo,
        imageUrl: photo,
        date: log.wornAt,
        wornAt: log.wornAt,
      };
    });

    return res.status(200).json(formattedLogs);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/wear/:logId
 * Deletes a wear log.
 * In ONE Prisma transaction:
 * - Deletes the log (or outfit log + associated item logs if outfit-linked).
 * - Decrements wearCount of affected items (recomputing from remaining logs, never < 0).
 * - Recomputes lastWornAt from remaining logs (null if none).
 */
export const deleteWearLog = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const userId = req.user.id;

    // 1. Find the log by id and userId (else 404)
    const log = await prisma.wearLog.findFirst({
      where: {
        id: logId,
        userId,
      },
      include: {
        outfit: {
          include: {
            outfitItems: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({
        error: 'Wear log not found',
        message: 'Wear log not found',
      });
    }

    await prisma.$transaction(async (tx) => {
      // Case A: The log belongs to an outfit
      if (log.outfitId) {
        const { startOfDay, endOfDay } = getCalendarDayBounds(log.wornAt);

        // Find all logs created by this outfit wear on the same calendar day
        const relatedLogs = await tx.wearLog.findMany({
          where: {
            userId,
            outfitId: log.outfitId,
            wornAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        const relatedLogIds = relatedLogs.map((l) => l.id);
        const itemIdsFromLogs = relatedLogs.map((l) => l.itemId).filter(Boolean);
        const itemIdsFromOutfit = log.outfit?.outfitItems?.map((oi) => oi.itemId) || [];
        const affectedItemIds = Array.from(new Set([...itemIdsFromLogs, ...itemIdsFromOutfit]));

        // Delete all related wear logs (outfit log + item logs)
        if (relatedLogIds.length > 0) {
          await tx.wearLog.deleteMany({
            where: {
              id: { in: relatedLogIds },
            },
          });
        }

        // Recompute wearCount and lastWornAt for all affected items
        for (const itemId of affectedItemIds) {
          const remainingLogs = await tx.wearLog.findMany({
            where: {
              userId,
              itemId,
            },
            orderBy: {
              wornAt: 'desc',
            },
          });

          const newWearCount = remainingLogs.length;
          const newLastWornAt = remainingLogs.length > 0 ? remainingLogs[0].wornAt : null;

          await tx.item.update({
            where: { id: itemId },
            data: {
              wearCount: newWearCount,
              lastWornAt: newLastWornAt,
            },
          });
        }
      } else {
        // Case B: Standalone item wear log
        const itemId = log.itemId;

        // Delete the single wear log
        await tx.wearLog.delete({
          where: { id: log.id },
        });

        if (itemId) {
          const remainingLogs = await tx.wearLog.findMany({
            where: {
              userId,
              itemId,
            },
            orderBy: {
              wornAt: 'desc',
            },
          });

          const newWearCount = remainingLogs.length;
          const newLastWornAt = remainingLogs.length > 0 ? remainingLogs[0].wornAt : null;

          await tx.item.update({
            where: { id: itemId },
            data: {
              wearCount: newWearCount,
              lastWornAt: newLastWornAt,
            },
          });
        }
      }
    });

    return res.status(200).json({
      message: 'Wear log deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

