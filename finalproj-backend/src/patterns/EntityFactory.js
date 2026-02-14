/**
 * FACTORY PATTERN
 * Centralized creation of domain entities (Habit, Task, PomodoroSession) with validation.
 * Encapsulates object creation and ensures consistent structure.
 */
import StoreSingleton from './SingletonStore.js';

export function createHabit({ name, icon = '✓', streak = 0, frequency = 'daily', reminderTime = null }) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Habit name is required');
  }
  const store = StoreSingleton.getInstance();
  const id = String(store._nextHabitId++);
  const habit = {
    id,
    name: name.trim(),
    icon: String(icon).slice(0, 2),
    streak: Number(streak) || 0,
    completedDates: [],
    frequency: frequency === 'weekly' ? 'weekly' : 'daily',
    reminderTime: reminderTime || null,
    createdAt: new Date().toISOString(),
  };
  return habit;
}

export function createTask({
  title,
  completed = false,
  dueDate = null,
  priority = 'medium',
  notes = '',
  category = '',
  estimatedMinutes = null,
}) {
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new Error('Task title is required');
  }
  const store = StoreSingleton.getInstance();
  const id = String(store._nextTaskId++);
  const task = {
    id,
    title: title.trim(),
    completed: Boolean(completed),
    dueDate: dueDate || null,
    priority: ['high', 'medium', 'low'].includes(priority) ? priority : 'medium',
    notes: String(notes || '').slice(0, 2000),
    category: String(category || '').slice(0, 50),
    estimatedMinutes: estimatedMinutes != null ? Number(estimatedMinutes) : null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  return task;
}

export function createPomodoroSession({ durationMinutes = 25, type = 'work' }) {
  const store = StoreSingleton.getInstance();
  const id = String(store._nextPomodoroId++);
  const session = {
    id,
    durationMinutes: Number(durationMinutes) || 25,
    type: type === 'break' ? 'break' : 'work',
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
  return session;
}

export const EntityFactory = {
  createHabit,
  createTask,
  createPomodoroSession,
};
