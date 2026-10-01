import { ATTENDANCE_THRESHOLD } from "./constants";

export function percent(present: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((present / total) * 1000) / 10;
}

/**
 * How many more classes in a row the student must attend to reach the
 * threshold. Smallest integer x with (present + x) / (total + x) >= T/100.
 * Integer maths so there are no floating-point off-by-one errors.
 */
export function classesNeeded(present: number, total: number, threshold = ATTENDANCE_THRESHOLD): number {
  const T = threshold;
  const deficit = T * total - 100 * present; // > 0 means below threshold
  if (total === 0 || deficit <= 0) return 0;
  return Math.ceil(deficit / (100 - T));
}

/**
 * How many classes the student can still miss and stay at or above the
 * threshold. Largest integer y with present / (total + y) >= T/100.
 */
export function classesCanMiss(present: number, total: number, threshold = ATTENDANCE_THRESHOLD): number {
  const T = threshold;
  if (total === 0) return 0;
  const surplus = 100 * present - T * total;
  if (surplus <= 0) return 0;
  return Math.floor(surplus / T);
}

export function isLow(pct: number, threshold = ATTENDANCE_THRESHOLD): boolean {
  return pct < threshold;
}
