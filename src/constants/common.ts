export const COMMON_CONSTANTS = {
  // === Roles ===
  USER_ROLE: {
    ADMIN: 'ADMIN',
    USER: 'USER',
  },

  // === Topic Progress Status ===
  TOPIC_STATUS: {
    LOCKED: 'LOCKED',
    LEARNING: 'LEARNING',
    MASTERED: 'MASTERED',
  },

  // === Game Types ===
  GAME_TYPE: {
    FALLING_WORDS: 'FALLING_WORDS',
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  },

  // === Topic Constraints ===
  TOPIC_WORD_LIMIT: {
    MIN: 7,
    MAX: 13,
  },

  // === SRS Config ===
  SRS: {
    STAGES: [0, 1, 3, 7, 14, 30, 90], // Ngày delay theo stage
    INITIAL_STAGE: 0,
    MIN_STAGE: 0,
  },

  // === Pagination ===
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
  },

  // === Sort ===
  SORT_ORDER: {
    ASC: 'asc',
    DESC: 'desc',
  },

  // === Cookie ===
  COOKIE_REFRESH_TOKEN: 'refreshToken',

  // === Media ===
  MEDIA_FOLDER: {
    WORDS: 'words',
    PROFILE: 'profile',
    GENERAL: 'general',
  },
} as const;
