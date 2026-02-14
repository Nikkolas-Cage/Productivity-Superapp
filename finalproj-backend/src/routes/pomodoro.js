import { Router } from 'express';
import StoreSingleton from '../patterns/SingletonStore.js';
import { EntityFactory } from '../patterns/EntityFactory.js';
import AppObserver from '../patterns/Observer.js';
import { awardXP, computeStats } from '../lib/gamification.js';

const router = Router();

function getStore() {
  return StoreSingleton.getInstance();
}

function getObserver() {
  return AppObserver.getInstance();
}

router.get('/sessions', (req, res) => {
  const store = getStore();
  res.json(store.pomodoroSessions);
});

router.get('/stats', (req, res) => {
  const store = getStore();
  const stats = computeStats(store);
  res.json(stats);
});

router.post('/sessions', (req, res) => {
  const { durationMinutes = 25, type = 'work' } = req.body || {};
  const session = EntityFactory.createPomodoroSession({ durationMinutes, type });
  const store = getStore();
  store.pomodoroSessions.push(session);
  getObserver().emitPomodoroChange('started', { session });
  res.status(201).json(session);
});

router.patch('/sessions/:id/complete', (req, res) => {
  const store = getStore();
  const session = store.pomodoroSessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const statsBefore = computeStats(store);
  const unlockedBefore = new Set(statsBefore.achievements.filter((a) => a.unlocked).map((a) => a.id));

  session.completedAt = new Date().toISOString();
  awardXP(store, session);
  const statsAfter = computeStats(store);
  const newAchievements = statsAfter.achievements.filter((a) => a.unlocked && !unlockedBefore.has(a.id));

  getObserver().emitPomodoroChange('completed', { session });
  res.json({ session, stats: { ...statsAfter, newAchievements } });
});

export default router;
