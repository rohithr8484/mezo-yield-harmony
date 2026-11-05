export const VEMEZO_LOCK_AMOUNT = "2";
export const VEMEZO_LOCK_WEEKS = [52, 1, 2] as const;
export type VeMezoLockWeeks = (typeof VEMEZO_LOCK_WEEKS)[number];
export const getVeMezoLockDuration = (weeks: VeMezoLockWeeks) => weeks * 7 * 24 * 60 * 60;