export const REGEXP = {
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;
