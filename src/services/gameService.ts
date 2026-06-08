import { GAME_SESSION_REPOSITORY } from '#repositories/gameSessionRepository';
import { USER_TOPIC_PROGRESS_REPOSITORY } from '#repositories/userTopicProgressRepository';
import { USER_WORD_PROGRESS_REPOSITORY } from '#repositories/userWordProgressRepository';
import { WORD_REPOSITORY } from '#repositories/wordRepository';
import { TOPIC_REPOSITORY } from '#repositories/topicRepository';
import { USER_REPOSITORY } from '#repositories/userRepository';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { COMMON_CONSTANTS } from '#constants/common';
import { shuffleArray } from '#utils/generateUtils';
import { handleCorrectAnswer, handleWrongAnswer } from '#utils/srsCalculator';

const generateDistractors = (
  correctWord: any,
  wordPool: any[],
  numDistractors: number = 3
): string[] => {
  const pool = wordPool.filter(
    (w) =>
      w._id.toString() !== correctWord._id.toString() &&
      w.meaning !== correctWord.meaning
  );

  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, numDistractors).map((w) => w.meaning);
};

const calculateRewards = (score: number, maxCombo: number, gameType: string) => {
  let coinsEarned = Math.floor(score / 100);
  
  if (maxCombo >= 5) coinsEarned = Math.floor(coinsEarned * 1.1);
  if (maxCombo >= 10) coinsEarned = Math.floor(coinsEarned * 1.2);

  const xpEarned = Math.floor(score * 0.1);

  return { coinsEarned, xpEarned };
};

export const gameService = {
  startGame: async (userId: string, topicIds: string[], gameType: string) => {
    // 1. ELIGIBILITY VALIDATION
    for (const topicId of topicIds) {
      const progress = await USER_TOPIC_PROGRESS_REPOSITORY.findByUserAndTopic(userId, topicId);
      if (!progress || progress.status !== COMMON_CONSTANTS.TOPIC_STATUS.MASTERED) {
        throw new ApiError(
          ERROR_CODES.VALIDATION_ERROR,
          'Phải thuộc hết từ vựng trong tất cả chủ đề đã chọn mới được chơi'
        );
      }
    }

    // 2. DATA GENERATION
    const allWords = await WORD_REPOSITORY.findByTopicIds(topicIds);
    if (allWords.length === 0) {
      throw new ApiError(ERROR_CODES.WORD_NOT_FOUND, 'Không có từ vựng nào trong chủ đề');
    }

    const shuffledWords = shuffleArray(allWords);

    const gameWords = shuffledWords.map((word: any) => {
      const baseWord = {
        wordId: word._id,
        kanji: word.kanji,
        hiragana: word.hiragana,
        romaji: word.romaji,
      };

      if (gameType === COMMON_CONSTANTS.GAME_TYPE.FALLING_WORDS) {
        return {
          ...baseWord,
          correctMeaning: word.meaning,
          speed: 1.0, // Base speed
        };
      }

      if (gameType === COMMON_CONSTANTS.GAME_TYPE.MULTIPLE_CHOICE) {
        const distractors = generateDistractors(word, allWords);
        const options = [
          { text: word.meaning, isCorrect: true },
          ...distractors.map((d) => ({ text: d, isCorrect: false })),
        ];
        return {
          ...baseWord,
          options: shuffleArray(options),
        };
      }

      return baseWord;
    });

    // 3. TẠO GAME SESSION (ANTI-CHEAT)
    const gameSession = await GAME_SESSION_REPOSITORY.create({
      userId: userId as any,
      includedTopics: topicIds as any,
      gameType,
      status: 'playing',
      startTime: new Date(),
    });

    return {
      sessionId: gameSession._id,
      gameType,
      totalWords: gameWords.length,
      words: gameWords,
    };
  },

  submitGame: async (userId: string, data: any) => {
    const { sessionId, score, maxCombo, wordsHit, wordsMissed } = data;

    // 1. TÌM SESSION & ANTI-CHEAT VALIDATION
    const gameSession = await GAME_SESSION_REPOSITORY.findById(sessionId);
    if (!gameSession || gameSession.userId.toString() !== userId.toString()) {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Session game không hợp lệ');
    }
    if (gameSession.status !== 'playing') {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Session game này đã kết thúc hoặc bị hủy');
    }

    const endTime = new Date();
    const playDuration = (endTime.getTime() - new Date(gameSession.startTime).getTime()) / 1000;
    const totalAnswers = wordsHit.length + wordsMissed.length;

    // Nếu chơi 100 từ trong chưa tới 3 giây -> Gian lận
    if (totalAnswers > 0 && playDuration < totalAnswers * 0.5) {
      // Đánh dấu abandoned và ném lỗi
      await GAME_SESSION_REPOSITORY.update(sessionId, { status: 'abandoned', endTime });
      throw new ApiError(ERROR_CODES.FORBIDDEN, 'Phát hiện nghi vấn gian lận thời gian trả lời');
    }

    // Tính điểm tối đa có thể đạt được (Mỗi từ 100đ, max combo x1.2)
    const maxTheoreticalScore = wordsHit.length * 100 * 1.5;
    const finalScore = Math.min(score, maxTheoreticalScore); // Không cho vượt trần
    const finalCombo = Math.min(maxCombo, wordsHit.length);

    // 2. TÍNH COINS VÀ XP
    const { coinsEarned, xpEarned } = calculateRewards(finalScore, finalCombo, gameSession.gameType);

    // 3. LƯU LẠI GAME SESSION
    await GAME_SESSION_REPOSITORY.update(sessionId, {
      score: finalScore,
      maxCombo: finalCombo,
      coinsEarned,
      status: 'completed',
      endTime,
    });

    // 4. CỘNG COINS + XP VÀO USER PROFILE
    await USER_REPOSITORY.addCoins(userId, coinsEarned);
    await USER_REPOSITORY.addXp(userId, xpEarned);

    // 4. ĐỒNG BỘ SRS
    for (const wordId of wordsHit) {
      let progress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, wordId);
      if (!progress) {
        await USER_WORD_PROGRESS_REPOSITORY.initProgressForWords(userId, [wordId]);
        progress = await USER_WORD_PROGRESS_REPOSITORY.findByUserAndWord(userId, wordId);
      }
      const srsData = handleCorrectAnswer(progress?.srsStage || 0);
      await USER_WORD_PROGRESS_REPOSITORY.updateProgress(
        userId,
        wordId,
        {
          srsStage: srsData.srsStage,
          nextReviewAt: srsData.nextReviewAt,
          lastPlayedAt: new Date(),
        },
        { correctCount: srsData.correctCount }
      );
    }

    const topicsToRecheck = new Set<string>();

    for (const wordId of wordsMissed) {
      const srsData = handleWrongAnswer();
      await USER_WORD_PROGRESS_REPOSITORY.updateProgress(
        userId,
        wordId,
        {
          srsStage: srsData.srsStage,
          nextReviewAt: srsData.nextReviewAt,
          lastPlayedAt: new Date(),
        },
        { wrongCount: srsData.wrongCount }
      );
      
      const word = await WORD_REPOSITORY.findById(wordId);
      if (word) topicsToRecheck.add(word.topicId.toString());
    }

    // 5. CHECK TOPIC MASTERY (revert if missed)
    for (const topicId of topicsToRecheck) {
      const wordsInTopic = await WORD_REPOSITORY.findByTopicId(topicId);
      const wordIds = wordsInTopic.map((w: any) => w._id.toString());
      if (wordIds.length > 0) {
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
      }
    }

    return {
      gameSession,
      rewards: { coinsEarned, xpEarned },
      srsUpdates: {
        improved: wordsHit.length,
        degraded: wordsMissed.length,
      },
    };
  },

  getEligibleTopics: async (userId: string) => {
    const masteredTopics = await USER_TOPIC_PROGRESS_REPOSITORY.findMasteredByUserId(userId);
    const topicIds = masteredTopics.map((t: any) => t.topicId);
    if (topicIds.length === 0) return [];

    const topics = await TOPIC_REPOSITORY.findByIds(topicIds);
    return topics;
  },

  getHistory: async (userId: string, options: any) => {
    return GAME_SESSION_REPOSITORY.findByUserId(userId, options);
  },

  getHistoryDetail: async (id: string, userId: string) => {
    const session = await GAME_SESSION_REPOSITORY.findById(id);
    if (!session || session.userId.toString() !== userId.toString()) {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Không tìm thấy lịch sử');
    }
    return session;
  },

  getLeaderboard: async (gameType?: string, limit?: number) => {
    if (!gameType) return [];
    return GAME_SESSION_REPOSITORY.findTopScores(gameType, limit);
  },

  getStats: async (userId: string) => {
    return GAME_SESSION_REPOSITORY.getStats(userId);
  },
};
