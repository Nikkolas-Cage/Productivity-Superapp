import express from 'express';
import cors from 'cors';
import habitsRouter from './src/routes/habits.js';
import tasksRouter from './src/routes/tasks.js';
import pomodoroRouter from './src/routes/pomodoro.js';
import AppObserver from './src/patterns/Observer.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/habits', habitsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/pomodoro', pomodoroRouter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Habit Tracker API' });
});

// Optional: log observer events in development
const observer = AppObserver.getInstance();
observer.on('habit', (e) => console.log('[Observer] habit', e.event, e.habit?.name));
observer.on('task', (e) => console.log('[Observer] task', e.event, e.task?.title));
observer.on('pomodoro', (e) => console.log('[Observer] pomodoro', e.event, e.session?.id));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
