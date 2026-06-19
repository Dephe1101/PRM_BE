import { WORD_REPOSITORY } from '#repositories/wordRepository';
import { TOPIC_REPOSITORY } from '#repositories/topicRepository';
import { USER_TOPIC_PROGRESS_REPOSITORY } from '#repositories/userTopicProgressRepository';
import { USER_WORD_PROGRESS_REPOSITORY } from '#repositories/userWordProgressRepository';
import { handleCorrectAnswer, handleWrongAnswer } from '#utils/srsCalculator';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { COMMON_CONSTANTS } from '#constants/common';

export const checkAndUpdateTopicMastery = async (userId: string, topicId: string) => {
  const wordsInTopic = await WORD_REPOSITORY.findByTopicId(topicId);
  const wordIds = wordsInTopic.map((w: any) => w._id.toString());

  if (wordIds.length === 0) return;

  const progresses = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWords(userId, wordIds);

  let newStatus: string = COMMON_CONSTANTS.TOPIC_STATUS.NOT_LEARNED;
  if (progresses.length > 0) {
    const masteredCount = progresses.filter((p: any) => p.srsStage === 1).length;
    if (masteredCount === wordIds.length) {
      newStatus = COMMON_CONSTANTS.TOPIC_STATUS.MASTERED;
    } else {
      newStatus = COMMON_CONSTANTS.TOPIC_STATUS.LEARNING;
    }
  }

  await USER_TOPIC_PROGRESS_REPOSITORY.upsert(userId, topicId, {
    status: newStatus,
  });
};

export const flashcardService = {
  getFlashcardsByTopic: async (userId: string, topicId: string) => {
    const topic = await TOPIC_REPOSITORY.findById(topicId);
    if (!topic) throw new ApiError(ERROR_CODES.TOPIC_NOT_FOUND);

    const words = await WORD_REPOSITORY.findByTopicId(topicId);
    const wordIds = words.map((w: any) => w._id.toString());

    // Chỉ nâng cấp từ NOT_LEARNED -> LEARNING, không downgrade từ MASTERED -> LEARNING
    const existingProgress = await USER_TOPIC_PROGRESS_REPOSITORY.findByUserAndTopic(userId, topicId);
    if (!existingProgress || existingProgress.status === COMMON_CONSTANTS.TOPIC_STATUS.NOT_LEARNED) {
      await USER_TOPIC_PROGRESS_REPOSITORY.upsert(userId, topicId, {
        status: COMMON_CONSTANTS.TOPIC_STATUS.LEARNING,
      });
    }
    const topicProgress = await USER_TOPIC_PROGRESS_REPOSITORY.findByUserAndTopic(userId, topicId);

    await USER_WORD_PROGRESS_REPOSITORY.initProgressForWords(userId, wordIds);

    const progresses = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWords(userId, wordIds);
    const progressMap = new Map(progresses.map((p: any) => [p.wordId.toString(), p]));

    let mastered = 0;

    const flashcards = words.map((word: any) => {
      const p: any = progressMap.get(word._id.toString()) || {
        srsStage: 0,
        nextReviewAt: null,
        correctCount: 0,
        wrongCount: 0,
        isBookmarked: false,
      };

      if (p.srsStage === 1) mastered++;

      return { word, progress: p };
    });

    return {
      topic,
      topicProgress,
      flashcards,
      stats: {
        totalWords: words.length,
        mastered,
      },
    };
  },

  submitAnswer: async (userId: string, wordId: string, isCorrect: boolean) => {
    const word = await WORD_REPOSITORY.findById(wordId);
    if (!word) throw new ApiError(ERROR_CODES.WORD_NOT_FOUND);

    let progress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, wordId);
    if (!progress) {
      await USER_WORD_PROGRESS_REPOSITORY.initProgressForWords(userId, [wordId]);
      progress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, wordId);
    }

    const currentStage = progress?.srsStage || 0;
    let srsData;

    if (isCorrect) {
      srsData = handleCorrectAnswer(currentStage);
      await USER_WORD_PROGRESS_REPOSITORY.updateProgress(userId, wordId, {
        srsStage: srsData.srsStage,
        nextReviewAt: srsData.nextReviewAt,
      }, { correctCount: srsData.correctCount });
    } else {
      srsData = handleWrongAnswer();
      await USER_WORD_PROGRESS_REPOSITORY.updateProgress(userId, wordId, {
        srsStage: srsData.srsStage,
        nextReviewAt: srsData.nextReviewAt,
      }, { wrongCount: srsData.wrongCount });
    }

    const updatedProgress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, wordId);
    await checkAndUpdateTopicMastery(userId, word.topicId.toString());

    return updatedProgress;
  },

  submitBatch: async (userId: string, results: { wordId: string; isCorrect: boolean }[]) => {
    let processed = 0;
    const topicIdsToCheck = new Set<string>();

    for (const res of results) {
      const word = await WORD_REPOSITORY.findById(res.wordId);
      if (!word) continue;

      let progress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, res.wordId);
      if (!progress) {
        await USER_WORD_PROGRESS_REPOSITORY.initProgressForWords(userId, [res.wordId]);
        progress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, res.wordId);
      }

      const currentStage = progress?.srsStage || 0;
      let srsData;

      if (res.isCorrect) {
        srsData = handleCorrectAnswer(currentStage);
        await USER_WORD_PROGRESS_REPOSITORY.updateProgress(userId, res.wordId, {
          srsStage: srsData.srsStage,
          nextReviewAt: srsData.nextReviewAt,
        }, { correctCount: srsData.correctCount });
      } else {
        srsData = handleWrongAnswer();
        await USER_WORD_PROGRESS_REPOSITORY.updateProgress(userId, res.wordId, {
          srsStage: srsData.srsStage,
          nextReviewAt: srsData.nextReviewAt,
        }, { wrongCount: srsData.wrongCount });
      }

      topicIdsToCheck.add(word.topicId.toString());
      processed++;
    }

    for (const topicId of topicIdsToCheck) {
      await checkAndUpdateTopicMastery(userId, topicId);
    }

    return { totalProcessed: processed, topicsUpdated: Array.from(topicIdsToCheck) };
  },

  getReviewWords: async (userId: string) => {
    return []; // Không còn ôn tập
  },

  getProgress: async (userId: string, levelId?: string, topicId?: string) => {
    let wordIds: string[] | undefined;

    if (topicId) {
      const progress = await USER_TOPIC_PROGRESS_REPOSITORY.findByUserAndTopic(userId, topicId);
      if (!progress || progress.status === COMMON_CONSTANTS.TOPIC_STATUS.NOT_LEARNED) {
        return {
          status: COMMON_CONSTANTS.TOPIC_STATUS.NOT_LEARNED,
          message: 'Bạn chưa học chủ đề này',
          totalLearning: 0,
          totalMastered: 0,
          learningWords: [],
          masteredWords: []
        };
      }

      const words = await WORD_REPOSITORY.findByTopicId(topicId);
      wordIds = words.map((w: any) => w._id.toString());
      
      const stats = await USER_WORD_PROGRESS_REPOSITORY.getStatsByWordIds(userId, wordIds);
      return {
        status: progress.status,
        ...stats
      };
    } else if (levelId) {
      const topics = await TOPIC_REPOSITORY.findByLevelId(levelId, { limit: 1000 });
      const topicIds = topics.docs.map((t: any) => t._id.toString());
      if (topicIds.length > 0) {
        const words = await WORD_REPOSITORY.findByTopicIds(topicIds);
        wordIds = words.map((w: any) => w._id.toString());
      } else {
        wordIds = [];
      }
    }

    if (wordIds) {
      if (wordIds.length === 0) return { totalLearning: 0, totalMastered: 0, learningWords: [], masteredWords: [] };
      return USER_WORD_PROGRESS_REPOSITORY.getStatsByWordIds(userId, wordIds);
    }

    return USER_WORD_PROGRESS_REPOSITORY.getOverallStats(userId);
  },

  getTopicsProgressByLevel: async (userId: string, levelId: string) => {
    const paginatedTopics = await TOPIC_REPOSITORY.findByLevelId(levelId, { limit: 500, sort: { orderIndex: 1 } });
    const topics = paginatedTopics.docs;
    if (!topics || topics.length === 0) return [];

    const topicIds = topics.map((t: any) => t._id.toString());

    // 1. Get Topic Progress Status
    const userTopicProgresses = await USER_TOPIC_PROGRESS_REPOSITORY.findByUserId(userId);
    const topicProgressMap = new Map(userTopicProgresses.map((p: any) => [p.topicId.toString(), p.status]));

    // 2. Get Word Counts (total)
    const wordCounts = await WORD_REPOSITORY.getWordCountByTopics(topicIds);
    const totalWordMap = new Map(wordCounts.map((wc: any) => [wc._id.toString(), wc.totalWords]));

    // 3. Get Word Stats (mastered/learned)
    const wordStats = await USER_WORD_PROGRESS_REPOSITORY.getTopicWordStats(userId, topicIds);
    const wordStatsMap = new Map(wordStats.map((ws: any) => [
      ws._id.toString(),
      { mastered: ws.masteredWords, learned: ws.learnedWords }
    ]));

    return topics.map((topic: any, index: number) => {
      const tId = topic._id.toString();
      const status = topicProgressMap.get(tId) || COMMON_CONSTANTS.TOPIC_STATUS.NOT_LEARNED;

      const totalWords = totalWordMap.get(tId) || 0;
      const stats = wordStatsMap.get(tId) || { mastered: 0, learned: 0 };

      return {
        _id: tId,
        title: topic.title,
        orderIndex: topic.orderIndex,
        status,
        totalWords,
        masteredWords: stats.mastered,
        learnedWords: stats.learned,
      };
    });
  },

  toggleBookmark: async (userId: string, wordId: string) => {
    const word = await WORD_REPOSITORY.findById(wordId);
    if (!word) throw new ApiError(ERROR_CODES.WORD_NOT_FOUND);

    let progress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, wordId);
    if (!progress) {
      await USER_WORD_PROGRESS_REPOSITORY.initProgressForWords(userId, [wordId]);
      progress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, wordId);
    }

    const newBookmarkStatus = !progress?.isBookmarked;

    const updated = await USER_WORD_PROGRESS_REPOSITORY.updateProgress(userId, wordId, {
      isBookmarked: newBookmarkStatus,
    });

    return { isBookmarked: updated?.isBookmarked };
  },

  getBookmarks: async (userId: string) => {
    return USER_WORD_PROGRESS_REPOSITORY.findBookmarkedWithWords(userId);
  },

  getBookmarkedFlashcards: async (userId: string) => {
    const bookmarkedItems = await USER_WORD_PROGRESS_REPOSITORY.findBookmarkedWithWords(userId);

    let mastered = 0;
    const flashcards = bookmarkedItems.map((item: any) => {
      const p = { ...item };
      delete p.word; // Tách word ra khỏi progress object

      if (p.srsStage === 1) mastered++;

      return { word: item.word, progress: p };
    });

    return {
      topic: null, // Không thuộc về 1 topic cụ thể
      topicProgress: null,
      flashcards,
      stats: {
        totalWords: flashcards.length,
        mastered,
      },
    };
  },

  getBookmarkedFlashcardsByTopic: async (userId: string, topicId: string) => {
    const topic = await TOPIC_REPOSITORY.findById(topicId);
    if (!topic) throw new ApiError(ERROR_CODES.TOPIC_NOT_FOUND);

    const bookmarkedItems = await USER_WORD_PROGRESS_REPOSITORY.findBookmarkedWithWordsByTopic(userId, topicId);

    // Chỉ nâng cấp từ NOT_LEARNED -> LEARNING, không downgrade từ MASTERED -> LEARNING
    const existingProgress = await USER_TOPIC_PROGRESS_REPOSITORY.findByUserAndTopic(userId, topicId);
    if (!existingProgress || existingProgress.status === COMMON_CONSTANTS.TOPIC_STATUS.NOT_LEARNED) {
      await USER_TOPIC_PROGRESS_REPOSITORY.upsert(userId, topicId, {
        status: COMMON_CONSTANTS.TOPIC_STATUS.LEARNING,
      });
    }
    const topicProgress = await USER_TOPIC_PROGRESS_REPOSITORY.findByUserAndTopic(userId, topicId);

    let mastered = 0;
    const flashcards = bookmarkedItems.map((item: any) => {
      const p = { ...item };
      delete p.word;

      if (p.srsStage === 1) mastered++;

      return { word: item.word, progress: p };
    });

    return {
      topic,
      topicProgress,
      flashcards,
      stats: {
        totalWords: flashcards.length,
        mastered,
      },
    };
  },
};
