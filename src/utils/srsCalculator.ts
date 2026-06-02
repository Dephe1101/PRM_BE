import { COMMON_CONSTANTS } from '#constants/common';

const { SRS } = COMMON_CONSTANTS;

export const calculateNextReviewDate = (srsStage: number): Date => {
  const stageIndex = Math.min(srsStage, SRS.STAGES.length - 1);
  const daysToAdd = SRS.STAGES[stageIndex];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
};

export const handleCorrectAnswer = (currentStage: number) => {
  const newStage = currentStage + 1;
  return {
    srsStage: newStage,
    nextReviewAt: calculateNextReviewDate(newStage),
    correctCount: 1,
  };
};

export const handleWrongAnswer = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    srsStage: SRS.INITIAL_STAGE,
    nextReviewAt: tomorrow,
    wrongCount: 1,
  };
};
