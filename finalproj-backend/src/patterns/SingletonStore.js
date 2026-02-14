/**
 * SINGLETON PATTERN
 * Ensures a single instance of the application store (habits, tasks, pomodoro sessions).
 * Used for: in-memory persistence and consistent state across the Express app.
 */
class StoreSingleton {
  static #instance = null;

  constructor() {
    if (StoreSingleton.#instance) {
      return StoreSingleton.#instance;
    }
    this.habits = [];
    this.tasks = [];
    this.pomodoroSessions = [];
    this.pomodoroStats = {
      totalXP: 0,
      streak: 0,
      lastWorkDate: null,
      achievements: [],
    };
    this._nextHabitId = 1;
    this._nextTaskId = 1;
    this._nextPomodoroId = 1;
    StoreSingleton.#instance = this;
  }

  static getInstance() {
    if (!StoreSingleton.#instance) {
      StoreSingleton.#instance = new StoreSingleton();
    }
    return StoreSingleton.#instance;
  }

  static resetForTesting() {
    StoreSingleton.#instance = null;
  }
}

export default StoreSingleton;
