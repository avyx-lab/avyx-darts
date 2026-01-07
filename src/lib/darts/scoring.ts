import type { Dart, OutMode, InMode } from '../../types/darts';

// ==========================================
// SCORING UTILITIES
// ==========================================

/**
 * Calculate the value of a single dart
 */
export function calculateDartValue(segment: number, multiplier: 1 | 2 | 3): number {
    if (segment === 25) {
        // Bull: single = 25, double = 50, no triple
        return multiplier === 1 ? 25 : 50;
    }
    return segment * multiplier;
}

/**
 * Create a Dart object
 */
export function createDart(segment: number, multiplier: 1 | 2 | 3): Dart {
    return {
        segment,
        multiplier,
        value: calculateDartValue(segment, multiplier),
    };
}

/**
 * Calculate total score for a throw round
 */
export function calculateThrowTotal(darts: Dart[]): number {
    return darts.reduce((sum, dart) => sum + dart.value, 0);
}

/**
 * Check if a dart is a double
 */
export function isDouble(dart: Dart): boolean {
    return dart.multiplier === 2;
}

/**
 * Check if a dart is the bull (25 single or 50 double)
 */
export function isBull(dart: Dart): boolean {
    return dart.segment === 25;
}

/**
 * Check if a throw is valid for starting (double-in mode)
 */
export function isValidStart(darts: Dart[], inMode: InMode): boolean {
    if (inMode === 'straight') return true;
    // Double-in: first scoring dart must be a double
    return darts.some((d) => d.multiplier === 2);
}

/**
 * Check if a checkout is valid
 */
export function isValidCheckout(
    darts: Dart[],
    remainingBefore: number,
    outMode: OutMode
): boolean {
    const total = calculateThrowTotal(darts);

    // Must hit exactly zero
    if (total !== remainingBefore) return false;

    // Check out mode
    if (outMode === 'double') {
        // Last dart must be a double
        const lastDart = darts[darts.length - 1];
        return lastDart.multiplier === 2;
    }

    // Single out - any finish is valid
    return true;
}

/**
 * Check if a throw results in a bust
 */
export function isBust(
    remainingBefore: number,
    thrownScore: number,
    outMode: OutMode,
    lastDart?: Dart
): boolean {
    const remaining = remainingBefore - thrownScore;

    // Went below zero
    if (remaining < 0) return true;

    // Hit exactly zero - check if valid checkout
    if (remaining === 0) {
        if (outMode === 'double' && lastDart) {
            // Must finish on a double
            return lastDart.multiplier !== 2;
        }
        return false; // Valid checkout
    }

    // Remaining is 1 with double-out = bust (can't checkout)
    if (outMode === 'double' && remaining === 1) return true;

    return false;
}

/**
 * Get the segment name for display
 */
export function getSegmentName(segment: number, multiplier: 1 | 2 | 3): string {
    const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';

    if (segment === 25) {
        return multiplier === 2 ? 'D-Bull' : 'Bull';
    }

    return `${prefix}${segment}`;
}

/**
 * Parse a segment name back to values (e.g., "T20" -> {segment: 20, multiplier: 3})
 */
export function parseSegmentName(name: string): { segment: number; multiplier: 1 | 2 | 3 } {
    const normalized = name.toUpperCase().trim();

    // Bull variants
    if (normalized === 'BULL' || normalized === 'S25' || normalized === 'SB') {
        return { segment: 25, multiplier: 1 };
    }
    if (normalized === 'D-BULL' || normalized === 'DB' || normalized === 'D25') {
        return { segment: 25, multiplier: 2 };
    }

    // Standard segments
    const match = normalized.match(/^([SDT])(\d+)$/);
    if (!match) {
        throw new Error(`Invalid segment name: ${name}`);
    }

    const [, prefix, num] = match;
    const segment = parseInt(num, 10);
    const multiplier = prefix === 'T' ? 3 : prefix === 'D' ? 2 : 1;

    return { segment, multiplier: multiplier as 1 | 2 | 3 };
}

/**
 * Get maximum possible score in a round (3 darts)
 */
export const MAX_ROUND_SCORE = 180; // 3x T20

/**
 * All valid segments on a dartboard
 */
export const SEGMENTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

/**
 * Common quick scores for fast entry
 */
export const QUICK_SCORES = [180, 140, 100, 85, 60, 45, 41, 26, 0];
