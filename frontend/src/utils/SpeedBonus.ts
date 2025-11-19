export function calculateSpeedBonus(
  timeSpentMs: number,
  maxTimeMs: number
): number {
  // 1. Safety check for invalid input (e.g., maxTimeMs is 0 or negative)
  if (maxTimeMs <= 0 || timeSpentMs < 0) {
    return 0;
  }

  // 2. Calculate the ratio of time used (ranges from 0 up)
  // Note: If timeSpentMs > maxTimeMs, timeRatio will be > 1.0
  const timeRatio = timeSpentMs / maxTimeMs;

  // 3. Check the ratio against the defined tiers (starting from the fastest tier)
  if (timeRatio <= 0.25) {
    // Finished in 0% to 25% of the max time
    return 100;
  } else if (timeRatio <= 0.5) {
    // Finished in 25% to 50% of the max time
    return 50;
  } else if (timeRatio <= 0.75) {
    // Finished in 50% to 75% of the max time
    return 25;
  } else if (timeRatio <= 1.0) {
    // Finished in 75% to 100% of the max time
    return 10;
  } else {
    // Finished over 100% of the max time
    return 0;
  }
}
