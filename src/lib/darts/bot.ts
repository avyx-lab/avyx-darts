import type { Dart, BotDifficulty, OutMode } from '../../types/darts';
import { createDart, isBust } from './scoring';
import { getCheckoutSuggestion, isCheckable } from './checkouts';

// ==========================================
// BOT LOGIC
// ==========================================

// Calibration: Board radius ~170mm.
// S20 height ~100mm? No, segments are angular.
// Let's use simplified "ring" and "angle" deviation logic or just neighbor logic.

// SIMPLIFIED APPROACH: Neighbor Probability
// Instead of physics simulation, we define probability of hitting intended target vs neighbors.

interface HitProbabilities {
    exact: number;      // Hit exactly what was aimed
    single: number;     // Hit single version of target (if aimed T or D)
    neighbor: number;   // Hit adjacent number (e.g. 5 or 1 for 20)
    miss: number;       // Miss board or wildly off
}

const DIFFICULTIES: Record<BotDifficulty, HitProbabilities> = {
    easy: { exact: 0.25, single: 0.40, neighbor: 0.25, miss: 0.10 },
    medium: { exact: 0.45, single: 0.35, neighbor: 0.15, miss: 0.05 },
    hard: { exact: 0.60, single: 0.28, neighbor: 0.10, miss: 0.02 },
    littler: { exact: 0.95, single: 0.04, neighbor: 0.01, miss: 0 },
};

const NEIGHBORS: Record<number, [number, number]> = {
    20: [1, 5], 1: [20, 18], 18: [1, 4], 4: [18, 13], 13: [4, 6],
    6: [13, 10], 10: [6, 15], 15: [10, 2], 2: [15, 17], 17: [2, 3],
    3: [17, 19], 19: [3, 7], 7: [19, 16], 16: [7, 8], 8: [16, 11],
    11: [8, 14], 14: [11, 9], 9: [14, 12], 12: [9, 5], 5: [12, 20],
    25: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(n => n) as any // Simplified neighborhood for bull
};

/**
 * Determine what the bot should aim for
 */
function getAimTarget(score: number, _difficulty: BotDifficulty): { segment: number; multiplier: 1 | 2 | 3 } {
    // 1. Can we checkout?
    if (isCheckable(score)) {
        const suggestion = getCheckoutSuggestion(score);
        if (suggestion && suggestion.darts.length > 0) {
            // Aim for the first dart in the suggestion
            const firstDartStr = suggestion.darts[0];
            return parseTargetString(firstDartStr);
        }
    }

    // 2. Setup shots (simplified: always T20 or T19 if T20 blocked/bored - just T20 for now)
    // If score is low < 170 but not checkable (bogey numbers), aim T20 to reduce.
    return { segment: 20, multiplier: 3 };
}

function parseTargetString(str: string): { segment: number; multiplier: 1 | 2 | 3 } {
    if (str === 'Bull') return { segment: 25, multiplier: 1 };
    if (str === 'D-Bull' || str === 'DBull') return { segment: 25, multiplier: 2 };

    const type = str.charAt(0); // T, D, S
    const val = parseInt(str.substring(1));
    const mult = type === 'T' ? 3 : type === 'D' ? 2 : 1;
    return { segment: val, multiplier: mult as 1 | 2 | 3 };
}

/**
 * Simulate the actual throw based on difficulty
 */
function simulateThrow(
    target: { segment: number; multiplier: 1 | 2 | 3 },
    probs: HitProbabilities
): { segment: number; multiplier: 1 | 2 | 3 } {
    const r = Math.random();

    // 1. Exact Hit
    if (r < probs.exact) {
        return target;
    }

    // 2. Hit Single (if aimed T/D)
    // For Easy/Medium bots, aiming at T20 often slips into S20.
    const probSingle = probs.exact + probs.single;
    if (r < probSingle) {
        return { segment: target.segment, multiplier: 1 };
    }

    // 3. Hit Neighbor
    // Simplified: hits a neighbor Single.
    const probNeighbor = probSingle + probs.neighbor;
    if (r < probNeighbor) {
        const neighbors = NEIGHBORS[target.segment];
        const hitNeighbor = Array.isArray(neighbors) ? neighbors[Math.floor(Math.random() * neighbors.length)] : 1; // Fallback
        return { segment: hitNeighbor, multiplier: 1 };
    }

    // 4. Miss/Wild (for simplicity, hit random low single 1-5)
    return { segment: Math.floor(Math.random() * 5) + 1, multiplier: 1 };
}

/**
 * Calculate the bot's turn (3 darts)
 */
export function calculateBotTurn(
    difficulty: BotDifficulty,
    currentScore: number,
    outMode: OutMode
): Dart[] {
    const darts: Dart[] = [];
    let remaining = currentScore;
    const probs = DIFFICULTIES[difficulty];

    for (let i = 0; i < 3; i++) {
        // If busted, stop throwing (logic handled in store usually, but we simulate intent here)
        if (remaining <= 1 && outMode === 'double' && remaining !== 0) break; // Already busted or won
        if (remaining === 0) break; // Won

        // 1. Decide Target
        let target = getAimTarget(remaining, difficulty);

        // 2. Simulate Result
        let result = simulateThrow(target, probs);

        // CORRECTION: If easy/medium bot aims for Double (checkout) but hits single which busts, it's a valid result.
        // We calculate value to see if we update remaining for NEXT dart aimed.
        const dartVal = (result.segment === 25 ? (result.multiplier === 2 ? 50 : 25) : result.segment * result.multiplier);

        // Check bust
        const isBustThrow = isBust(remaining, dartVal, outMode, createDart(result.segment, result.multiplier));

        if (isBustThrow) {
            // Add the bust dart and stop
            darts.push(createDart(result.segment, result.multiplier));
            break;
        }

        darts.push(createDart(result.segment, result.multiplier));
        remaining -= dartVal;
    }

    return darts;
}
