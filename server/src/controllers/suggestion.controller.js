import { z } from 'zod';
import prisma from '../db.js';
import { CATEGORIES, SEASONS, OCCASIONS } from '../constants/wardrobe.js';
import { colorScore, getColorPairReason, getColorFamily } from '../utils/colorRules.js';

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

// Request body validation schema
export const suggestionSchema = z.object({
  occasion: optionalEnum(OCCASIONS, 'occasion'),
  season: optionalEnum(SEASONS, 'season'),
  excludeIds: z
    .array(z.string().trim())
    .max(50, 'excludeIds cannot exceed 50 items')
    .optional()
    .default([]),
  count: z.preprocess(
    (val) => (val === undefined || val === null ? 3 : Number(val)),
    z
      .number({ invalid_type_error: 'count must be a number' })
      .int('count must be an integer')
      .min(1, 'count must be at least 1')
      .max(3, 'count cannot exceed 3')
      .default(3)
  ),
});

/**
 * Calculates freshness score for an item:
 * 1.0 if never worn, otherwise scaled by days since lastWornAt capped at 60 days.
 */
function getItemFreshness(item, nowTime) {
  if (!item.lastWornAt || item.wearCount === 0) {
    return 1.0;
  }
  const daysSince = (nowTime - new Date(item.lastWornAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(Math.max(0, daysSince), 60) / 60;
}

/**
 * Pre-scores individual items within a category to select top 25 candidates.
 */
function itemPreScore(item, targetOccasion, targetSeason, nowTime) {
  let fit = 0.5;
  if (targetOccasion) {
    if (item.occasion === targetOccasion) fit += 0.5;
  } else {
    fit += 0.25;
  }
  if (targetSeason) {
    if (item.season === targetSeason || item.season === 'all-season') fit += 0.5;
  } else {
    fit += 0.25;
  }

  const freshness = getItemFreshness(item, nowTime);
  return fit + freshness;
}

/**
 * Calculates average color harmony across all unique pairs in an outfit.
 */
function computeAverageColorScore(items) {
  if (items.length <= 1) return 1.0;
  let totalScore = 0;
  let pairs = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      totalScore += colorScore(items[i].color, items[j].color);
      pairs++;
    }
  }

  return pairs > 0 ? totalScore / pairs : 1.0;
}

/**
 * Generates 2-3 readable explanation reasons for an outfit.
 */
function generateReasons(items, targetOccasion, targetSeason, nowTime) {
  const reasons = [];

  // 1. Color reason
  const topItem = items.find((i) => i.category === 'top');
  const bottomItem = items.find((i) => i.category === 'bottom');
  const mainOnePiece = items.find((i) => i.category === 'dress' || i.category === 'ethnic');
  const shoeItem = items.find((i) => i.category === 'shoes');

  if (topItem && bottomItem) {
    reasons.push(getColorPairReason(topItem.color, bottomItem.color));
  } else if (mainOnePiece && shoeItem) {
    reasons.push(getColorPairReason(mainOnePiece.color, shoeItem.color));
  } else if (items.length >= 2) {
    const familyA = getColorFamily(items[0].color);
    const familyB = getColorFamily(items[1].color);
    if (familyA === 'neutral' || familyB === 'neutral') {
      reasons.push('Neutral color balance');
    } else {
      reasons.push('Coordinated color palette');
    }
  }

  // 2. Freshness reason (find longest unworn item)
  let bestFreshItem = null;
  let maxDays = -1;

  for (const item of items) {
    if (!item.lastWornAt || item.wearCount === 0) {
      bestFreshItem = { item, neverWorn: true };
      break;
    }
    const days = Math.round((nowTime - new Date(item.lastWornAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days > maxDays) {
      maxDays = days;
      bestFreshItem = { item, days };
    }
  }

  if (bestFreshItem) {
    if (bestFreshItem.neverWorn) {
      reasons.push(`${bestFreshItem.item.name} hasn't been worn yet`);
    } else if (bestFreshItem.days >= 14) {
      reasons.push(`${bestFreshItem.item.name} not worn for ${bestFreshItem.days} days`);
    }
  }

  // 3. Occasion / Season reason
  if (targetOccasion) {
    const matchCount = items.filter((i) => i.occasion === targetOccasion).length;
    if (matchCount > 0) {
      const capOccasion = targetOccasion.charAt(0).toUpperCase() + targetOccasion.slice(1);
      reasons.push(`Matches your ${targetOccasion} occasion`);
    }
  }

  if (targetSeason && reasons.length < 3) {
    const capSeason = targetSeason.charAt(0).toUpperCase() + targetSeason.slice(1);
    reasons.push(`Comfortable for ${targetSeason}`);
  }

  // 4. Fallback if needed
  if (reasons.length < 2) {
    reasons.push('Versatile everyday combination');
  }

  return reasons.slice(0, 3);
}

/**
 * POST /api/suggestions
 * Generates smart outfit suggestions based on user wardrobe, occasion, and season.
 */
export async function getOutfitSuggestions(req, res, next) {
  try {
    const userId = req.user.id;
    const nowTime = Date.now();

    // Validate request body
    const { occasion, season, excludeIds, count } = suggestionSchema.parse(req.body);

    // Check total wardrobe count for this user
    const totalUserItems = await prisma.item.count({
      where: { userId },
    });

    if (totalUserItems < 3) {
      return res.status(200).json({
        outfits: [],
        missing: [],
        message: 'Add at least 3 items to your wardrobe to get outfit suggestions.',
      });
    }

    // Fetch all user items excluding excludeIds
    const availableItems = await prisma.item.findMany({
      where: {
        userId,
        id: { notIn: excludeIds },
      },
      select: {
        id: true,
        name: true,
        category: true,
        color: true,
        season: true,
        occasion: true,
        imageUrl: true,
        wearCount: true,
        lastWornAt: true,
        createdAt: true,
      },
    });

    if (availableItems.length < 2) {
      return res.status(200).json({
        outfits: [],
        missing: [],
        message: 'No more combinations available. Try resetting your excluded items.',
      });
    }

    // Check overall missing categories in user's wardrobe
    const categoriesPresent = new Set(availableItems.map((i) => i.category));
    const missing = [];

    // Footwear check
    if (!categoriesPresent.has('shoes')) {
      missing.push('shoes');
    }

    // Main body check (either dress/ethnic OR top + bottom)
    const hasOnePiece = categoriesPresent.has('dress') || categoriesPresent.has('ethnic');
    const hasTop = categoriesPresent.has('top');
    const hasBottom = categoriesPresent.has('bottom');

    if (!hasOnePiece) {
      if (!hasTop) missing.push('top');
      if (!hasBottom) missing.push('bottom');
    }

    // Group available items by category and retain at most 25 top-scored items per category
    const itemsByCategory = {};
    for (const cat of CATEGORIES) {
      itemsByCategory[cat] = [];
    }

    for (const item of availableItems) {
      if (itemsByCategory[item.category]) {
        itemsByCategory[item.category].push(item);
      }
    }

    // Sort and limit each category to top 25 items
    for (const cat of CATEGORIES) {
      itemsByCategory[cat].sort(
        (a, b) =>
          itemPreScore(b, occasion, season, nowTime) -
          itemPreScore(a, occasion, season, nowTime)
      );
      itemsByCategory[cat] = itemsByCategory[cat].slice(0, 25);
    }

    const tops = itemsByCategory['top'] || [];
    const bottoms = itemsByCategory['bottom'] || [];
    const dresses = itemsByCategory['dress'] || [];
    const ethnics = itemsByCategory['ethnic'] || [];
    const shoes = itemsByCategory['shoes'] || [];
    const outerwears = itemsByCategory['outerwear'] || [];
    const accessories = itemsByCategory['accessory'] || [];

    const onePieces = [...dresses, ...ethnics];

    // Helper to evaluate a candidate outfit combination
    function evaluateCandidate(candidateItems) {
      // 1. Color harmony (50%)
      const avgColor = computeAverageColorScore(candidateItems);

      // 2. Occasion & Season fit (25%)
      let occasionFit = 1.0;
      if (occasion) {
        const matches = candidateItems.filter((i) => i.occasion === occasion).length;
        occasionFit = matches / candidateItems.length;
      }

      let seasonFit = 1.0;
      if (season) {
        const matches = candidateItems.filter(
          (i) => i.season === season || i.season === 'all-season'
        ).length;
        seasonFit = matches / candidateItems.length;
      }
      const fitScore = (occasionFit + seasonFit) / 2;

      // 3. Freshness score (25%)
      let totalFreshness = 0;
      for (const item of candidateItems) {
        totalFreshness += getItemFreshness(item, nowTime);
      }
      const freshnessScore = totalFreshness / candidateItems.length;

      const baseScore = 0.5 * avgColor + 0.25 * fitScore + 0.25 * freshnessScore;

      return {
        items: candidateItems,
        baseScore: Math.round(baseScore * 100) / 100,
        avgColor,
      };
    }

    // Build raw candidate outfit groups
    const rawCandidates = [];

    // Combination Type A: One-piece (dress or ethnic) + shoes (if shoes exist)
    for (const onePiece of onePieces) {
      if (shoes.length > 0) {
        for (const shoe of shoes) {
          rawCandidates.push(evaluateCandidate([onePiece, shoe]));
        }
      } else {
        rawCandidates.push(evaluateCandidate([onePiece]));
      }
    }

    // Combination Type B: Top + Bottom + shoes (if shoes exist)
    for (const top of tops) {
      for (const bottom of bottoms) {
        if (shoes.length > 0) {
          for (const shoe of shoes) {
            rawCandidates.push(evaluateCandidate([top, bottom, shoe]));
          }
        } else {
          rawCandidates.push(evaluateCandidate([top, bottom]));
        }
      }
    }

    // Fallback: If user has no complete outfits (e.g. only tops & shoes, or only bottoms & shoes)
    if (rawCandidates.length === 0) {
      if (tops.length > 0 && shoes.length > 0) {
        for (const top of tops) {
          for (const shoe of shoes) {
            rawCandidates.push(evaluateCandidate([top, shoe]));
          }
        }
      } else if (bottoms.length > 0 && shoes.length > 0) {
        for (const bottom of bottoms) {
          for (const shoe of shoes) {
            rawCandidates.push(evaluateCandidate([bottom, shoe]));
          }
        }
      } else if (availableItems.length >= 2) {
        rawCandidates.push(evaluateCandidate(availableItems.slice(0, 3)));
      }
    }

    // Try adding outerwear and accessory to top candidates if score remains high
    const expandedCandidates = [];
    const shouldAddOuterwear = (season === 'winter' || season === 'monsoon') && outerwears.length > 0;

    for (const cand of rawCandidates) {
      let currentItems = [...cand.items];

      // Add outerwear if requested season is winter/monsoon
      if (shouldAddOuterwear) {
        // Find best compatible outerwear
        let bestOuter = null;
        let bestOuterScore = -1;
        for (const ow of outerwears) {
          const pairAvg = cand.items.reduce((acc, it) => acc + colorScore(ow.color, it.color), 0) / cand.items.length;
          if (pairAvg >= 0.75 && pairAvg > bestOuterScore) {
            bestOuter = ow;
            bestOuterScore = pairAvg;
          }
        }
        if (bestOuter) {
          currentItems.push(bestOuter);
        }
      }

      // Add at most one accessory if it scores well (colorScore >= 0.8)
      if (accessories.length > 0) {
        let bestAcc = null;
        let bestAccScore = -1;
        for (const acc of accessories) {
          const pairAvg = currentItems.reduce((sum, it) => sum + colorScore(acc.color, it.color), 0) / currentItems.length;
          if (pairAvg >= 0.8 && pairAvg > bestAccScore) {
            bestAcc = acc;
            bestAccScore = pairAvg;
          }
        }
        if (bestAcc) {
          currentItems.push(bestAcc);
        }
      }

      const evaluated = evaluateCandidate(currentItems);
      // Small random factor so results vary across requests
      const jitter = Math.random() * 0.08;
      evaluated.finalScore = evaluated.baseScore + jitter;
      expandedCandidates.push(evaluated);
    }

    // Sort candidates descending by jittered score
    expandedCandidates.sort((a, b) => b.finalScore - a.finalScore);

    // Greedily pick up to `count` outfits ensuring no two outfits reuse the same top, bottom, or main one-piece
    const selectedOutfits = [];
    const usedTopIds = new Set();
    const usedBottomIds = new Set();
    const usedMainIds = new Set();

    for (const cand of expandedCandidates) {
      if (selectedOutfits.length >= count) break;

      const topItem = cand.items.find((i) => i.category === 'top');
      const bottomItem = cand.items.find((i) => i.category === 'bottom');
      const mainItem = cand.items.find((i) => i.category === 'dress' || i.category === 'ethnic');

      if (topItem && usedTopIds.has(topItem.id)) continue;
      if (bottomItem && usedBottomIds.has(bottomItem.id)) continue;
      if (mainItem && usedMainIds.has(mainItem.id)) continue;

      if (topItem) usedTopIds.add(topItem.id);
      if (bottomItem) usedBottomIds.add(bottomItem.id);
      if (mainItem) usedMainIds.add(mainItem.id);

      const reasons = generateReasons(cand.items, occasion, season, nowTime);

      selectedOutfits.push({
        items: cand.items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          color: i.color,
          imageUrl: i.imageUrl,
          wearCount: i.wearCount,
          lastWornAt: i.lastWornAt,
        })),
        score: cand.baseScore,
        reasons,
      });
    }

    // If greedy selection picked fewer than count due to constraints, relax reuse if needed
    if (selectedOutfits.length < count && expandedCandidates.length > selectedOutfits.length) {
      const selectedItemSets = selectedOutfits.map((o) => new Set(o.items.map((i) => i.id)));

      for (const cand of expandedCandidates) {
        if (selectedOutfits.length >= count) break;
        const candIds = new Set(cand.items.map((i) => i.id));
        const isDuplicate = selectedItemSets.some(
          (set) => set.size === candIds.size && [...candIds].every((id) => set.has(id))
        );
        if (isDuplicate) continue;

        selectedItemSets.push(candIds);
        const reasons = generateReasons(cand.items, occasion, season, nowTime);
        selectedOutfits.push({
          items: cand.items.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            color: i.color,
            imageUrl: i.imageUrl,
            wearCount: i.wearCount,
            lastWornAt: i.lastWornAt,
          })),
          score: cand.baseScore,
          reasons,
        });
      }
    }

    return res.status(200).json({
      outfits: selectedOutfits,
      missing,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  suggestionSchema,
  getOutfitSuggestions,
};
