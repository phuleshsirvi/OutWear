import prisma from '../db.js';

/**
 * Formats cost per wear:
 * Returns rounded to 2 decimal places if price and wearCount > 0, else null
 */
function calculateCostPerWear(price, wearCount) {
  if (price === null || price === undefined || wearCount <= 0) {
    return null;
  }
  return Math.round((price / wearCount) * 100) / 100;
}

/**
 * GET /api/stats
 * Returns wardrobe and wear statistics for the logged-in user.
 * Protected by requireAuth middleware.
 * All queries use userId from req.user only.
 */
export async function getStats(req, res, next) {
  try {
    const userId = req.user.id;

    // Build the list of last 30 calendar days (YYYY-MM-DD), ending today
    const now = new Date();
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().slice(0, 10));
    }
    const startDate = new Date(`${dates[0]}T00:00:00.000Z`);
    const endDate = new Date(`${dates[dates.length - 1]}T23:59:59.999Z`);

    // Execute queries in parallel using Prisma aggregations and groupBys
    const [
      itemCount,
      outfitCount,
      itemAggregate,
      wornCount,
      neverWornCount,
      colorGroups,
      categoryGroups,
      seasonGroups,
      occasionGroups,
      mostWornItems,
      leastWornCandidates,
      pricedWornItems,
      unwornWithPriceRaw,
      wearLogsLast30,
    ] = await Promise.all([
      // 1. Total items count
      prisma.item.count({
        where: { userId },
      }),

      // 2. Total outfits count
      prisma.outfit.count({
        where: { userId },
      }),

      // 3. Aggregate wearCount sum and price sum (ignores null prices)
      prisma.item.aggregate({
        where: { userId },
        _sum: {
          wearCount: true,
          price: true,
        },
      }),

      // 4. Worn items count (wearCount > 0)
      prisma.item.count({
        where: {
          userId,
          wearCount: { gt: 0 },
        },
      }),

      // 5. Never worn items count (wearCount === 0)
      prisma.item.count({
        where: {
          userId,
          wearCount: 0,
        },
      }),

      // 6. Colors breakdown
      prisma.item.groupBy({
        by: ['color'],
        where: { userId },
        _count: { color: true },
        orderBy: {
          _count: { color: 'desc' },
        },
      }),

      // 7. Categories breakdown
      prisma.item.groupBy({
        by: ['category'],
        where: { userId },
        _count: { category: true },
        orderBy: {
          _count: { category: 'desc' },
        },
      }),

      // 8. Seasons breakdown
      prisma.item.groupBy({
        by: ['season'],
        where: { userId },
        _count: { season: true },
        orderBy: {
          _count: { season: 'desc' },
        },
      }),

      // 9. Occasions breakdown
      prisma.item.groupBy({
        by: ['occasion'],
        where: { userId },
        _count: { occasion: true },
        orderBy: {
          _count: { occasion: 'desc' },
        },
      }),

      // 10. Top 5 most worn items (wearCount > 0)
      prisma.item.findMany({
        where: {
          userId,
          wearCount: { gt: 0 },
        },
        orderBy: [
          { wearCount: 'desc' },
          { lastWornAt: 'desc' },
        ],
        take: 5,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
          wearCount: true,
          price: true,
        },
      }),

      // 11. Least worn candidates pool
      prisma.item.findMany({
        where: { userId },
        orderBy: [
          { wearCount: 'asc' },
          { lastWornAt: 'asc' },
          { createdAt: 'desc' },
        ],
        take: 10,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
          wearCount: true,
          price: true,
          lastWornAt: true,
          createdAt: true,
        },
      }),

      // 12. Items with price > 0 AND wearCount > 0 for Best / Worst cost-per-wear
      prisma.item.findMany({
        where: {
          userId,
          price: { not: null, gt: 0 },
          wearCount: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
          wearCount: true,
          price: true,
        },
      }),

      // 13. Items with price > 0 AND wearCount === 0 (unwornWithPrice, money tied up)
      prisma.item.findMany({
        where: {
          userId,
          price: { not: null, gt: 0 },
          wearCount: 0,
        },
        orderBy: {
          price: 'desc',
        },
        take: 5,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
          wearCount: true,
          price: true,
        },
      }),

      // 14. WearLog item rows for this user in the last 30 days
      prisma.wearLog.findMany({
        where: {
          userId,
          itemId: { not: null },
          wornAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          wornAt: true,
        },
      }),
    ]);

    // Format totals
    const totalWears = itemAggregate._sum.wearCount || 0;
    const totalValue = itemAggregate._sum.price
      ? Math.round(itemAggregate._sum.price * 100) / 100
      : 0;

    const totals = {
      items: itemCount,
      outfits: outfitCount,
      totalWears,
      totalValue,
      wornItems: wornCount,
      neverWornItems: neverWornCount,
    };

    // Format colors, categories, seasons, occasions
    const colors = colorGroups.map((g) => ({
      color: g.color,
      count: g._count.color,
    }));

    const categories = categoryGroups.map((g) => ({
      category: g.category,
      count: g._count.category,
    }));

    const seasons = seasonGroups.map((g) => ({
      season: g.season,
      count: g._count.season,
    }));

    const occasions = occasionGroups.map((g) => ({
      occasion: g.occasion,
      count: g._count.occasion,
    }));

    // Format mostWorn (top 5)
    const mostWorn = mostWornItems.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
      wearCount: item.wearCount,
      price: item.price,
      costPerWear: calculateCostPerWear(item.price, item.wearCount),
    }));

    // Format leastWorn: 5 items with lowest wearCount, never-worn first, then oldest lastWornAt
    const sortedLeastWorn = [...leastWornCandidates]
      .sort((a, b) => {
        const aNever = a.wearCount === 0 || !a.lastWornAt;
        const bNever = b.wearCount === 0 || !b.lastWornAt;
        if (aNever && !bNever) return -1;
        if (!aNever && bNever) return 1;
        if (aNever && bNever) {
          // Newest created first among never-worn items
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // Both worn: lowest wearCount first
        if (a.wearCount !== b.wearCount) {
          return a.wearCount - b.wearCount;
        }
        // Then oldest lastWornAt first
        const aTime = a.lastWornAt ? new Date(a.lastWornAt).getTime() : 0;
        const bTime = b.lastWornAt ? new Date(b.lastWornAt).getTime() : 0;
        return aTime - bTime;
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        category: item.category,
        wearCount: item.wearCount,
        price: item.price,
        costPerWear: calculateCostPerWear(item.price, item.wearCount),
      }));

    // Format costPerWear (best 5, worst 5, unwornWithPrice)
    const pricedItemsWithCPW = pricedWornItems.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
      wearCount: item.wearCount,
      price: item.price,
      costPerWear: calculateCostPerWear(item.price, item.wearCount),
    }));

    // Top 5 Best Value (lowest cost per wear, tied by higher wearCount)
    const bestValue = [...pricedItemsWithCPW]
      .sort((a, b) => a.costPerWear - b.costPerWear || b.wearCount - a.wearCount)
      .slice(0, 5);

    // Top 5 Worst Value (highest cost per wear, tied by lower wearCount)
    const worstValue = [...pricedItemsWithCPW]
      .sort((a, b) => b.costPerWear - a.costPerWear || a.wearCount - b.wearCount)
      .slice(0, 5);

    // Items with price but no wears (money tied up)
    const unwornWithPrice = unwornWithPriceRaw.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
      wearCount: item.wearCount,
      price: item.price,
      costPerWear: null,
    }));

    // Format wearsLast30Days: array of { date: "YYYY-MM-DD", count } for each of the last 30 days
    const wearCountMap = {};
    for (const d of dates) {
      wearCountMap[d] = 0;
    }
    for (const log of wearLogsLast30) {
      const dayStr = log.wornAt.toISOString().slice(0, 10);
      if (wearCountMap[dayStr] !== undefined) {
        wearCountMap[dayStr]++;
      }
    }
    const wearsLast30Days = dates.map((date) => ({
      date,
      count: wearCountMap[date] || 0,
    }));

    return res.status(200).json({
      totals,
      colors,
      categories,
      seasons,
      occasions,
      mostWorn,
      leastWorn: sortedLeastWorn,
      costPerWear: {
        best: bestValue,
        worst: worstValue,
        unwornWithPrice,
      },
      unwornWithPrice,
      wearsLast30Days,
    });
  } catch (error) {
    next(error);
  }
}

