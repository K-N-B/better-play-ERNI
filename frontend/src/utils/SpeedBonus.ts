/**
 * Calculates a fixed-tier speed bonus based on the time spent relative to the maximum allowed time.
 * @param timeSpentMs The total time the user spent on the puzzle in milliseconds.
 * @param maxTimeMs The maximum time allowed for the current puzzle's difficulty.
 * @returns The speed bonus points (100, 50, 25, 10, or 0).
 */

export function calculateSpeedBonus(
  timeSpentMs: number,
  maxTimeMs: number
): number {
  if (maxTimeMs <= 0 || timeSpentMs < 0) {
    return 0;
  }

  const timeRatio = timeSpentMs / maxTimeMs;

  if (timeRatio <= 0.25) {
    return 100; // Tier 1: 0% to 25% used
  } else if (timeRatio <= 0.5) {
    return 50; // Tier 2: 25% to 50% used
  } else if (timeRatio <= 0.75) {
    return 25; // Tier 3: 50% to 75% used
  } else if (timeRatio <= 1.0) {
    return 10; // Tier 4: 75% to 100% used
  } else {
    return 0; // Over 100% used
  }
}
