export interface GamificationStats {
  totalXp: number;
  level: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  xpProgressPercentage: number;
}

export const calculateGamificationStats = (
  completedCount: number,
  gamesCount: number,
  streak: number
): GamificationStats => {
  const LESSON_XP = 100;
  const GAME_XP = 50;
  const STREAK_XP = 10;
  const XP_PER_LEVEL = 500;

  const totalXp = completedCount * LESSON_XP + gamesCount * GAME_XP + streak * STREAK_XP;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInCurrentLevel = totalXp % XP_PER_LEVEL;

  return {
    totalXp,
    level,
    xpInCurrentLevel,
    xpRequiredForNextLevel: XP_PER_LEVEL,
    xpProgressPercentage: (xpInCurrentLevel / XP_PER_LEVEL) * 100,
  };
};

export interface DailyGoals {
  lessonCompleted: boolean;
  gamesPlayed: boolean;
  puzzlesSolved: boolean;
  progressPercentage: number;
}

export const getDailyGoalsStatus = (
  games: any[],
  _completedLessons: any[],
  completedPuzzlesCount: number
): DailyGoals => {
  const todayStr = new Date().toDateString();

  // Check if any lesson was completed today
  // Wait, let's look at completedLessons. In standard backend, the completion date isn't directly returned as a Date string on the LessonResponse,
  // but we can track today's completed lessons in localStorage to check it accurately.
  const completedLessonsToday = JSON.parse(localStorage.getItem('completed_lessons_today') || '[]');
  const lessonCompleted = completedLessonsToday.includes(todayStr);

  // Check if any game was played today
  const gamesPlayedToday = games.some(g => {
    if (!g.createdAt) return false;
    return new Date(g.createdAt).toDateString() === todayStr;
  });

  // Solve 3 tactical exercises in the dashboard
  const puzzlesSolved = completedPuzzlesCount >= 3;

  let completedCount = 0;
  if (lessonCompleted) completedCount++;
  if (gamesPlayedToday) completedCount++;
  if (puzzlesSolved) completedCount++;

  return {
    lessonCompleted,
    gamesPlayed: gamesPlayedToday,
    puzzlesSolved,
    progressPercentage: (completedCount / 3) * 100,
  };
};
