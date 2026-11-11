import prisma from '../db.js';

/**
 * Formats a Date object or ISO string to YYYY-MM-DD calendar date string
 */
export function toDateString(val) {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Validates and normalizes wear date:
 * - Accepts a local calendar date string YYYY-MM-DD
 * - If omitted, defaults to today's local calendar date string
 * - Validates: format YYYY-MM-DD, not in the future, not older than 1 year
 * Returns: { dateStr: string, wornAtDate: Date }
 */
export function parseAndValidateWearDate(dateInput) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let dateStr = todayStr;

  if (dateInput !== undefined && dateInput !== null && dateInput !== '') {
    if (typeof dateInput !== 'string') {
      const err = new Error('Invalid date format. Expected a YYYY-MM-DD string');
      err.status = 400;
      throw err;
    }

    const trimmed = dateInput.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
      const err = new Error('Invalid date format. Expected a YYYY-MM-DD string');
      err.status = 400;
      throw err;
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() + 1 !== month ||
      parsedDate.getUTCDate() !== day
    ) {
      const err = new Error('Invalid calendar date');
      err.status = 400;
      throw err;
    }

    dateStr = trimmed;
  }

  // Not in the future
  if (dateStr > todayStr) {
    const err = new Error('Wear date cannot be in the future');
    err.status = 400;
    throw err;
  }

  // Not older than 1 year
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10);

  if (dateStr < oneYearAgoStr) {
    const err = new Error('Wear date cannot be older than 1 year');
    err.status = 400;
    throw err;
  }

  // Store at midday UTC (T12:00:00.000Z) so dateStr is invariant across timezones
  const wornAtDate = new Date(`${dateStr}T12:00:00.000Z`);

  return { dateStr, wornAtDate };
}

/**
 * POST /api/wear/item/:itemId
 * Logs wear for a single wardrobe item on a specific calendar day (YYYY-MM-DD).
 * Prevents double logging for the same calendar day string (409 Conflict).
 * In ONE Prisma transaction: creates WearLog, increments wearCount by 1,
 * and sets lastWornAt to latest of current lastWornAt and new date.
 */
export const logItemWear = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // 1. Validate date
    const { dateStr, wornAtDate } = parseAndValidateWearDate(req.body?.date);

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

    // 3. Prevent accidental double logging for the same calendar day string
    const existingLogs = await prisma.wearLog.findMany({
      where: {
        userId,
        itemId,
      },
      select: {
        id: true,
        wornAt: true,
      },
    });

    const isDuplicate = existingLogs.some((l) => toDateString(l.wornAt) === dateStr);

    if (isDuplicate) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Already logged for this day',
      });
    }

    // 4. In ONE Prisma transaction: create WearLog, increment wearCount, update lastWornAt
    const updatedItem = await prisma.$transaction(async (tx) => {
      await tx.wearLog.create({
        data: {
          userId,
          itemId,
          wornAt: wornAtDate,
        },
      });

      // Backdated entry must not move lastWornAt backwards
      const currentLastWorn = item.lastWornAt ? new Date(item.lastWornAt) : null;
      const newLastWornAt =
        currentLastWorn && currentLastWorn > wornAtDate ? currentLastWorn : wornAtDate;

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
 * Logs wear for an outfit on a specific calendar day (YYYY-MM-DD).
 * Prevents double logging for the outfit on the same calendar day string (409 Conflict).
 * In ONE Prisma transaction: creates outfit log, creates item logs for each outfit item,
 * increments each item's wearCount by 1, and updates lastWornAt.
 */
export const logOutfitWear = async (req, res, next) => {
  try {
    const { outfitId } = req.params;
    const userId = req.user.id;

    // 1. Validate date
    const { dateStr, wornAtDate } = parseAndValidateWearDate(req.body?.date);

    // 2. Find outfit by id and userId (else 404)
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

    // 3. Prevent accidental double logging for the outfit on the same calendar day string
    const existingOutfitLogs = await prisma.wearLog.findMany({
      where: {
        userId,
        outfitId,
        itemId: null,
      },
      select: {
        id: true,
        wornAt: true,
      },
    });

    const isDuplicate = existingOutfitLogs.some((l) => toDateString(l.wornAt) === dateStr);

    if (isDuplicate) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Already logged for this day',
      });
    }

    // 4. In ONE Prisma transaction: create outfit log and individual item logs
    const resultOutfit = await prisma.$transaction(async (tx) => {
      // Create WearLog row for the outfit
      await tx.wearLog.create({
        data: {
          userId,
          outfitId,
          itemId: null,
          wornAt: wornAtDate,
        },
      });

      const items = outfit.outfitItems.map((oi) => oi.item).filter(Boolean);

      // Create WearLog row for each item and increment wear count
      for (const item of items) {
        await tx.wearLog.create({
          data: {
            userId,
            itemId: item.id,
            outfitId,
            wornAt: wornAtDate,
          },
        });

        const currentLastWorn = item.lastWornAt ? new Date(item.lastWornAt) : null;
        const newLastWornAt =
          currentLastWorn && currentLastWorn > wornAtDate ? currentLastWorn : wornAtDate;

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
 * Returns recent wear logs for the authenticated user, newest first.
 * Validates limit (1-100, default 30).
 * Formats each entry with name, photo, date string, and item/outfit details.
 */
export const getWearHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

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
      const dateStr = toDateString(log.wornAt);

      if (log.outfit) {
        const outfitItems = log.outfit.outfitItems
          ? log.outfit.outfitItems.map((oi) => oi.item).filter(Boolean)
          : [];
        const photo = outfitItems.find((i) => i.imageUrl)?.imageUrl || null;

        return {
          id: log.id,
          type: 'outfit',
          outfitId: log.outfit.id,
          name: log.outfit.name,
          occasion: log.outfit.occasion || null,
          photo,
          imageUrl: photo,
          date: dateStr,
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
        date: dateStr,
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
 * - Deletes the log.
 * - If the log belongs to an outfit, also removes the item logs created by it
 *   for that same date and items.
 * - Decrements wearCount of affected items (never below 0) and recomputes
 *   lastWornAt from the remaining logs (null if none).
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
      // If the log belongs to an outfit
      if (log.outfitId) {
        const logDateStr = toDateString(log.wornAt);

        // Find all logs created for this outfit
        const allOutfitLogs = await tx.wearLog.findMany({
          where: {
            userId,
            outfitId: log.outfitId,
          },
        });

        // Filter to logs on the same calendar day string
        const relatedLogs = allOutfitLogs.filter((l) => toDateString(l.wornAt) === logDateStr);
        const relatedLogIds = relatedLogs.map((l) => l.id);
        const itemIdsFromLogs = relatedLogs.map((l) => l.itemId).filter(Boolean);
        const itemIdsFromOutfit = log.outfit?.outfitItems?.map((oi) => oi.itemId) || [];
        const affectedItemIds = Array.from(new Set([...itemIdsFromLogs, ...itemIdsFromOutfit]));

        // Delete the outfit log and related item logs
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
        // Standalone item wear log
        const itemId = log.itemId;

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
