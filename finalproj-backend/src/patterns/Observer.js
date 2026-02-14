/**
 * OBSERVER PATTERN
 * Subject notifies subscribers when habits, tasks, or pomodoro sessions change.
 * Used for: logging, future SSE push, or side effects on data mutations.
 */
import { EventEmitter } from 'events';

class AppObserver extends EventEmitter {
  static #instance = null;

  constructor() {
    super();
    if (AppObserver.#instance) {
      return AppObserver.#instance;
    }
    AppObserver.#instance = this;
  }

  static getInstance() {
    if (!AppObserver.#instance) {
      AppObserver.#instance = new AppObserver();
    }
    return AppObserver.#instance;
  }

  emitHabitChange(event, payload) {
    this.emit('habit', { event, ...payload });
  }

  emitTaskChange(event, payload) {
    this.emit('task', { event, ...payload });
  }

  emitPomodoroChange(event, payload) {
    this.emit('pomodoro', { event, ...payload });
  }
}

export default AppObserver;
