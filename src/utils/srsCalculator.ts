export const handleCorrectAnswer = (currentStage: number) => {
  return {
    srsStage: 1, // Đã thuộc
    nextReviewAt: null as Date | null,
    correctCount: 1,
  };
};

export const handleWrongAnswer = () => {
  return {
    srsStage: 0, // Chưa thuộc
    nextReviewAt: null as Date | null,
    wrongCount: 1,
  };
};
