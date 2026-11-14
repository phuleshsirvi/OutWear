import { z } from 'zod';
import prisma from '../db.js';
import { CATEGORIES, SEASONS, OCCASIONS } from '../constants/wardrobe.js';
import { colorSimilarity } from '../utils/colorRules.js';

// Preprocessing helper for optional enums
const optionalEnum = (allowedValues, label) =>
  z.preprocess(
    (val) => (typeof val === 'string' && val.trim().length > 0 ? val.trim().toLowerCase() : null),
    z
      .enum(allowedValues, {
        errorMap: () => ({ message: `Invalid ${label}. Allowed values: ${allowedValues.join(', ')}` }),
      })
      .nullable()
      .optional()
  ).default(null);

// Validation schema for duplicate check request
export const duplicateCheckSchema = z.object({
  category: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
    z.enum(CATEGORIES, {
      errorMap: () => ({ message: `Invalid category. Allowed values: ${CATEGORIES.join(', ')}` }),
    })
  ),
  color: z
    .string({ required_error: 'Color is required' })
    .trim()
    .min(1, 'Color is required')
    .max(30, 'Color must be at most 30 characters')
    .toLowerCase(),
  occasion: optionalEnum(OCCASIONS, 'occasion'),
  season: optionalEnum(SEASONS, 'season'),
  fabric: z
    .string()
    .trim()
    .max(40, 'Fabric must be at most 40 characters')
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))
    .default(null),
});

/**
 * POST /api/duplicates/check
 * Evaluates whether an item the user is considering buying duplicates existing pieces in their wardrobe.
 */
export async function checkDuplicate(req, res, next) {
  try {
    const userId = req.user.id;

    // 1. Validate request body
    const { category, color, occasion, season, fabric } = duplicateCheckSchema.parse(req.body);

    // 2. Fetch all user items in the specified category
    const itemsInCategory = await prisma.item.findMany({
      where: {
        userId,
        category,
      },
      select: {
        id: true,
        name: true,
        category: true,
        color: true,
        season: true,
        occasion: true,
        fabric: true,
        imageUrl: true,
        wearCount: true,
        lastWornAt: true,
        createdAt: true,
      },
    });

    const totalInCategory = itemsInCategory.length;
    // wornOften = items in this category with wearCount >= 5
    const wornOften = itemsInCategory.filter((i) => i.wearCount >= 5).length;

    // Handle user with no items in that category
    if (totalInCategory === 0) {
      return res.status(200).json({
        exactCount: 0,
        similarCount: 0,
        matches: [],
        stats: {
          totalInCategory: 0,
          wornOften: 0,
          rarelyWorn: 0,
        },
        verdict: {
          level: 'go',
          message: `You don't own any ${category}s yet. Go for it!`,
        },
      });
    }

    // 3. Compute score for each item with weight rescaling for unsupplied fields
    // Weights: color 60%, occasion 15%, season 15%, fabric 10%
    const maxActiveWeight =
      0.60 +
      (occasion ? 0.15 : 0) +
      (season ? 0.15 : 0) +
      (fabric ? 0.10 : 0);

    const scoredItems = [];

    for (const item of itemsInCategory) {
      const colSim = colorSimilarity(color, item.color);
      let rawScore = 0.60 * colSim;

      // Occasion match
      if (occasion) {
        if (item.occasion && item.occasion.toLowerCase() === occasion.toLowerCase()) {
          rawScore += 0.15;
        }
      }

      // Season match (or all-season)
      if (season) {
        const itemSeason = (item.season || '').toLowerCase();
        if (itemSeason === season.toLowerCase() || itemSeason === 'all-season') {
          rawScore += 0.15;
        }
      }

      // Fabric match
      if (fabric && item.fabric) {
        const itemFab = item.fabric.toLowerCase().trim();
        const userFab = fabric.toLowerCase().trim();
        if (itemFab === userFab || itemFab.includes(userFab) || userFab.includes(itemFab)) {
          rawScore += 0.10;
        }
      }

      // Rescale so unsupplied fields do not lower the score
      const finalScore = maxActiveWeight > 0 ? Math.round((rawScore / maxActiveWeight) * 100) / 100 : 0;

      // Only consider items with score >= 0.5
      if (finalScore >= 0.5) {
        // matchType is "exact" if colorSimilarity is 1.0, otherwise "similar"
        const matchType = colSim === 1.0 ? 'exact' : 'similar';

        scoredItems.push({
          id: item.id,
          name: item.name,
          category: item.category,
          color: item.color,
          imageUrl: item.imageUrl,
          wearCount: item.wearCount,
          lastWornAt: item.lastWornAt,
          score: finalScore,
          matchType,
          createdAt: item.createdAt,
        });
      }
    }

    // 4. Sort matches: highest score first, then wearCount desc, then createdAt desc
    scoredItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.wearCount !== a.wearCount) return b.wearCount - a.wearCount;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Max 12 matches
    const matches = scoredItems.slice(0, 12).map(({ createdAt, ...item }) => item);

    // Counts
    const exactCount = matches.filter((m) => m.matchType === 'exact').length;
    const similarCount = matches.filter((m) => m.matchType === 'similar').length;
    // rarelyWorn = matches with wearCount <= 1
    const rarelyWorn = matches.filter((m) => m.wearCount <= 1).length;

    // 5. Verdict generation
    let verdictLevel = 'go';
    let verdictMessage = 'Nothing like this in your wardrobe. Go for it.';

    if (matches.length === 0) {
      verdictLevel = 'go';
      verdictMessage = 'Nothing like this in your wardrobe. Go for it.';
    } else {
      const hasRarelyWornExact = matches.some((m) => m.matchType === 'exact' && m.wearCount <= 1);

      if (matches.length >= 3 || hasRarelyWornExact) {
        verdictLevel = 'skip';
        if (hasRarelyWornExact) {
          verdictMessage = `You already own ${exactCount} exact ${color} ${category}${
            exactCount > 1 ? 's' : ''
          } that ${exactCount > 1 ? 'are' : 'is'} rarely worn (${rarelyWorn} rarely worn in total). Consider skipping this.`;
        } else {
          verdictMessage = `You already own ${matches.length} similar ${color} ${category}${
            matches.length > 1 ? 's' : ''
          }, and ${rarelyWorn} of them ${rarelyWorn === 1 ? 'is' : 'are'} rarely worn.`;
        }
      } else {
        // 1 to 2 similar matches
        verdictLevel = 'think';
        const itemSummaries = matches
          .map((m) => `${m.name} (${m.wearCount} ${m.wearCount === 1 ? 'wear' : 'wears'})`)
          .join(', ');
        verdictMessage = `You own ${matches.length} similar ${category}${
          matches.length > 1 ? 's' : ''
        }: ${itemSummaries}. Think about whether you really need another.`;
      }
    }

    return res.status(200).json({
      exactCount,
      similarCount,
      matches,
      stats: {
        totalInCategory,
        wornOften,
        rarelyWorn,
      },
      verdict: {
        level: verdictLevel,
        message: verdictMessage,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  duplicateCheckSchema,
  checkDuplicate,
};

