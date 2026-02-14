import { Router } from 'express';
import StoreSingleton from '../patterns/SingletonStore.js';
import { EntityFactory } from '../patterns/EntityFactory.js';
import AppObserver from '../patterns/Observer.js';

const router = Router();

function getStore() {
  return StoreSingleton.getInstance();
}

function getObserver() {
  return AppObserver.getInstance();
}

router.get('/', (req, res) => {
  const store = getStore();
  res.json(store.habits);
});

router.post('/', (req, res) => {
  try {
    const habit = EntityFactory.createHabit(req.body);
    const store = getStore();
    store.habits.push(habit);
    getObserver().emitHabitChange('created', { habit });
    res.status(201).json(habit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/complete', (req, res) => {
  const store = getStore();
  const habit = store.habits.find((h) => h.id === req.params.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  const dateStr = (req.body && req.body.date) ? new Date(req.body.date).toDateString() : new Date().toDateString();
  if (!habit.completedDates) habit.completedDates = [];
  if (habit.completedDates.includes(dateStr)) {
    return res.json(habit);
  }
  habit.completedDates.push(dateStr);
  habit.streak = (habit.streak || 0) + 1;
  getObserver().emitHabitChange('completed', { habit });
  res.json(habit);
});

router.patch('/:id', (req, res) => {
  const store = getStore();
  const habit = store.habits.find((h) => h.id === req.params.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  if (req.body.name !== undefined) habit.name = String(req.body.name).trim();
  if (req.body.frequency !== undefined) habit.frequency = req.body.frequency === 'weekly' ? 'weekly' : 'daily';
  if (req.body.reminderTime !== undefined) habit.reminderTime = req.body.reminderTime || null;
  getObserver().emitHabitChange('updated', { habit });
  res.json(habit);
});

router.delete('/:id', (req, res) => {
  const store = getStore();
  const idx = store.habits.findIndex((h) => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Habit not found' });
  const removed = store.habits.splice(idx, 1)[0];
  getObserver().emitHabitChange('deleted', { habit: removed });
  res.status(204).send();
});

export default router;
