export const REGEXP = {
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  LEVEL_ID: /^[A-Z0-9]+$/,     // VD: N5, N4
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;
