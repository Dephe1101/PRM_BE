import { WORD_REPOSITORY } from '#repositories/wordRepository';
import { TOPIC_REPOSITORY } from '#repositories/topicRepository';
import { USER_TOPIC_PROGRESS_REPOSITORY } from '#repositories/userTopicProgressRepository';
import { USER_WORD_PROGRESS_REPOSITORY } from '#repositories/userWordProgressRepository';
import { handleCorrectAnswer, handleWrongAnswer } from '#utils/srsCalculator';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { COMMON_CONSTANTS } from '#constants/common';

const checkAndUpdateTopicMastery = async (userId: string, topicId: string) => {
  const wordsInTopic = await WORD_REPOSITORY.findByTopicId(topicId);
  const wordIds = wordsInTopic.map((w: any) => w._id.toString());

  if (wordIds.length === 0) return;

  const progresses = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWords(userId, wordIds);

  const isMastered =
    progresses.length === wordIds.length &&
    progresses.every((p: any) => p.srsStage >= 1);

  const newStatus = isMastered
    ? COMMON_CONSTANTS.TOPIC_STATUS.MASTERED
    : COMMON_CONSTANTS.TOPIC_STATUS.LEARNING;

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

    const topicProgress = await USER_TOPIC_PROGRESS_REPOSITORY.upsert(
      userId,
      topicId,
      { status: COMMON_CONSTANTS.TOPIC_STATUS.LEARNING }
    );

    await USER_WORD_PROGRESS_REPOSITORY.initProgressForWords(userId, wordIds);

    const progresses = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWords(userId, wordIds);
    const progressMap = new Map(progresses.map((p: any) => [p.wordId.toString(), p]));

    let learned = 0;
    let mastered = 0;
    let needReview = 0;
    const now = new Date();

    const flashcards = words.map((word: any) => {
      const p: any = progressMap.get(word._id.toString()) || {
        srsStage: 0,
        nextReviewAt: new Date(),
        correctCount: 0,
        wrongCount: 0,
        isBookmarked: false,
      };

      if (p.srsStage >= 1) learned++;
      if (p.srsStage >= 4) mastered++;
      if (new Date(p.nextReviewAt) <= now) needReview++;

      return { word, progress: p };
    });

    return {
      topic,
      topicProgress,
      flashcards,
      stats: {
        totalWords: words.length,
        learned,
        mastered,
        needReview,
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
    return USER_WORD_PROGRESS_REPOSITORY.findDueForReview(userId);
  },

  getProgress: async (userId: string) => {
    return { message: 'Progress overview (aggregate) logic goes here' };
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
    return USER_WORD_PROGRESS_REPOSITORY.findBookmarked(userId);
  },
};
