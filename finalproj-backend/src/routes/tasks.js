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
  res.json(store.tasks);
});

router.post('/', (req, res) => {
  try {
    const task = EntityFactory.createTask(req.body);
    const store = getStore();
    store.tasks.push(task);
    getObserver().emitTaskChange('created', { task });
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', (req, res) => {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.body.title !== undefined) task.title = String(req.body.title).trim();
  if (req.body.completed !== undefined) {
    task.completed = Boolean(req.body.completed);
    task.completedAt = task.completed ? new Date().toISOString() : null;
    getObserver().emitTaskChange(task.completed ? 'completed' : 'uncompleted', { task });
  }
  if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate || null;
  if (req.body.priority !== undefined) task.priority = ['high', 'medium', 'low'].includes(req.body.priority) ? req.body.priority : task.priority;
  if (req.body.notes !== undefined) task.notes = String(req.body.notes || '').slice(0, 2000);
  if (req.body.category !== undefined) task.category = String(req.body.category || '').slice(0, 50);
  if (req.body.estimatedMinutes !== undefined) task.estimatedMinutes = req.body.estimatedMinutes != null ? Number(req.body.estimatedMinutes) : null;
  res.json(task);
});

router.delete('/:id', (req, res) => {
  const store = getStore();
  const idx = store.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  const removed = store.tasks.splice(idx, 1)[0];
  getObserver().emitTaskChange('deleted', { task: removed });
  res.status(204).send();
});

export default router;
