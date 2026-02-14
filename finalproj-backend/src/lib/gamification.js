/**
 * Gamification logic: XP, levels, streak, achievements
 */

const XP_PER_WORK = 10;
const XP_PER_BREAK = 2;

function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.5, level - 2));
}

export function getLevelFromXP(totalXP) {
  let level = 1;
  let needed = 0;
  while (true) {
    const nextNeeded = xpForLevel(level + 1);
    if (totalXP < nextNeeded) {
      needed = nextNeeded - totalXP;
      break;
    }
    level++;
  }
  const xpInCurrentLevel = level === 1 ? totalXP : totalXP - xpForLevel(level);
  const xpNeededForNext = level === 1 ? 100 : xpForLevel(level + 1) - xpForLevel(level);
  return {
    level,
    xpInLevel: xpInCurrentLevel,
    xpNeededForNext,
    xpToNextLevel: xpNeededForNext - xpInCurrentLevel,
    progressPct: Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100),
  };
}

const ACHIEVEMENTS = [
  { id: 'first_focus', name: 'First Focus', desc: 'Complete 1 work session', xp: 1, check: (s) => s.totalWork >= 1 },
  { id: 'warm_up', name: 'Warm Up', desc: 'Complete 3 work sessions', xp: 3, check: (s) => s.totalWork >= 3 },
  { id: 'five_alive', name: 'Five Alive', desc: 'Complete 5 work sessions', xp: 5, check: (s) => s.totalWork >= 5 },
  { id: 'tenacious', name: 'Tenacious', desc: 'Complete 10 work sessions', xp: 10, check: (s) => s.totalWork >= 10 },
  { id: 'day_champion', name: 'Day Champion', desc: 'Complete 5 sessions in one day', xp: 5, check: (s) => s.workToday >= 5 },
  { id: 'streak_3', name: 'On Fire', desc: '3-day streak', xp: 3, check: (s) => s.streak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak', xp: 7, check: (s) => s.streak >= 7 },
  { id: 'century', name: 'Century', desc: 'Reach 100 total XP', xp: 100, check: (s) => s.totalXP >= 100 },
  { id: 'break_taker', name: 'Break Taker', desc: 'Complete 5 breaks', xp: 5, check: (s) => s.totalBreak >= 5 },
];

function computeStreakFromDates(datesWithWork, today) {
  if (datesWithWork.length === 0) return 0;
  const sorted = [...datesWithWork].sort();
  let streak = 0;
  const todayStr = new Date(today).toDateString();
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i];
    const expected = new Date(new Date(today).getTime() - (sorted.length - 1 - i) * 24 * 60 * 60 * 1000).toDateString();
    if (d === expected) streak++;
    else break;
  }
  return streak;
}

export function computeStats(store) {
  const sessions = store.pomodoroSessions || [];
  const completed = sessions.filter((s) => s.completedAt);
  const workSessions = completed.filter((s) => s.type === 'work');
  const breakSessions = completed.filter((s) => s.type === 'break');

  const today = new Date().toDateString();
  const workToday = workSessions.filter((s) => new Date(s.completedAt).toDateString() === today).length;

  const stats = store.pomodoroStats || { totalXP: 0, streak: 0, lastWorkDate: null, achievements: [] };
  const totalXP = stats.totalXP || 0;

  const datesWithWork = [...new Set(workSessions.map((s) => new Date(s.completedAt).toDateString()))];
  const streak = computeStreakFromDates(datesWithWork, today);
  if (stats.streak !== streak) {
    stats.streak = streak;
    stats.lastWorkDate = datesWithWork.length ? datesWithWork.sort()[datesWithWork.length - 1] : null;
  }

  const state = {
    totalXP,
    totalWork: workSessions.length,
    totalBreak: breakSessions.length,
    workToday,
    streak,
    lastWorkDate: stats.lastWorkDate,
  };

  const levelInfo = getLevelFromXP(totalXP);
  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.check(state),
  }));

  return {
    totalXP,
    totalWork: workSessions.length,
    totalBreak: breakSessions.length,
    workToday,
    streak,
    level: levelInfo.level,
    xpInLevel: levelInfo.xpInLevel,
    xpNeededForNext: levelInfo.xpNeededForNext,
    progressPct: levelInfo.progressPct,
    achievements,
    newAchievements: [], // only set when completing a session (see route)
  };
}

export function awardXP(store, session) {
  const stats = store.pomodoroStats || { totalXP: 0, streak: 0, lastWorkDate: null, achievements: [] };
  const xp = session.type === 'work' ? XP_PER_WORK : XP_PER_BREAK;
  stats.totalXP = (stats.totalXP || 0) + xp;
  store.pomodoroStats = stats;
}
