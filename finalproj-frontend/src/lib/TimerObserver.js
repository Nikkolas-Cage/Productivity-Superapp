/**
 * OBSERVER PATTERN (Frontend)
 * Subject that notifies subscribers on Pomodoro timer events (tick, start, complete).
 * UI components subscribe to update display or trigger side effects.
 */
class TimerObserver {
  static _instance = null;

  constructor() {
    if (TimerObserver._instance) return TimerObserver._instance;
    this._listeners = { tick: [], start: [], complete: [] };
    TimerObserver._instance = this;
  }

  static getInstance() {
    if (!TimerObserver._instance) TimerObserver._instance = new TimerObserver();
    return TimerObserver._instance;
  }

  subscribe(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => {
      this._listeners[event] = this._listeners[event].filter((cb) => cb !== callback);
    };
  }

  notify(event, payload) {
    (this._listeners[event] || []).forEach((cb) => cb(payload));
  }
}

export default TimerObserver;
