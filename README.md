# Habit Tracker · Pomodoro · Task List

Full-stack app with **Habit Tracker**, **Pomodoro Timer**, and **Task List**, persisting data via an Express backend. Implements three design patterns: **Singleton**, **Factory**, and **Observer**.

A Project By: Nico Guarnes
Final Submission for MITS 708 A - ADVANCED OOP AND DESIGN PATTERN

---

## Full setup guide (MongoDB → Express → Next.js React)

Follow these steps from a clean machine to run the project.

### 1. Prerequisites

Install these first:

| Tool                         | Purpose                                    | Check version      |
| ---------------------------- | ------------------------------------------ | ------------------ |
| **Node.js** (v18 or v20 LTS) | Runs Express and Next.js                   | `node -v`          |
| **npm** (v9+)                | Package manager (comes with Node)          | `npm -v`           |
| **Git** (optional)           | Clone the repo                             | `git --version`    |
| **MongoDB** (optional)       | Database; app can run with in-memory store | `mongod --version` |

- **Node.js:** [nodejs.org](https://nodejs.org) — use the LTS version.  
  On macOS you can also use: `brew install node`
- **MongoDB:** Used if you add a MongoDB persistence layer later. To install and run locally:
  - **macOS (Homebrew):** `brew tap mongodb/brew && brew install mongodb-community` then `brew services start mongodb-community`
  - **Windows:** [MongoDB Installer](https://www.mongodb.com/try/download/community)
  - **Linux:** [Install docs](https://www.mongodb.com/docs/manual/administration/install-on-linux/)  
    Default server: `mongodb://localhost:27017`

This project runs **without MongoDB** by default (in-memory store). Install MongoDB only if you plan to use it for persistence or other tools.

### 2. Get the project

```bash
# If you have the repo via Git:
git clone <your-repo-url>
cd finalsSirAlipe

# Or open the project folder you already have:
cd /path/to/finalsSirAlipe
```

You should see:

- `finalproj-backend/` — Express API
- `finalproj-frontend/` — Next.js (React) app

### 3. Backend setup (Express)

```bash
cd finalproj-backend
```

Install dependencies:

```bash
npm install
```

Optional environment variables (create a `.env` file in `finalproj-backend/` if needed):

```env
PORT=4000
# Optional when you add MongoDB:
# MONGODB_URI=mongodb://localhost:27017/habittracker
```

Start the API:

```bash
npm run dev
```

You should see: `Server running at http://localhost:4000`

- **Health check:** open [http://localhost:4000/api/health](http://localhost:4000/api/health) — should return `{"ok":true}`.
- Leave this terminal running.

### 4. Frontend setup (Next.js + React)

Open a **new terminal** and go to the frontend:

```bash
cd finalproj-frontend
```

Install dependencies:

```bash
npm install
```

Optional: point the app at your API (only if the API is not at `http://localhost:4000`):

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local and set (if needed):
# NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Start the dev server:

```bash
npm run dev
```

You should see: `Ready on http://localhost:3000`

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the app with tabs: **Habits**, **Pomodoro**, **Tasks**.

### 5. Verify end-to-end

1. **Backend** is running on port 4000 (`npm run dev` in `finalproj-backend`).
2. **Frontend** is running on port 3000 (`npm run dev` in `finalproj-frontend`).
3. In the app: add a habit, add a task, start the Pomodoro timer. Data is saved in the Express in-memory store and survives until you restart the backend.

### 6. Production-style run (optional)

**Backend:**

```bash
cd finalproj-backend
npm start
```

**Frontend (build then run):**

```bash
cd finalproj-frontend
npm run build
npm start
```

Use the same env vars as above if you change ports or API URL.

---

## Design Patterns

The backend implements **Singleton**, **Factory**, and **Observer**. Below are the exact locations and code snippets that define and use each pattern.

---

### 1. Singleton

**Purpose:** Guarantees a single shared store for habits, tasks, and pomodoro sessions across the entire Express app. All routes read from and write to this one instance, so state is consistent and in-memory persistence works without duplication.

**File:** `finalproj-backend/src/patterns/SingletonStore.js`

**Pattern implementation:** The class holds a private static `#instance`. The constructor returns that existing instance if it was already created; otherwise it initializes the store and assigns it to `#instance`. `getInstance()` is the only way to obtain the store.

```javascript
class StoreSingleton {
  static #instance = null;

  constructor() {
    if (StoreSingleton.#instance) {
      return StoreSingleton.#instance; // return existing instance
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
    StoreSingleton.#instance = this; // save single instance
  }

  static getInstance() {
    if (!StoreSingleton.#instance) {
      StoreSingleton.#instance = new StoreSingleton();
    }
    return StoreSingleton.#instance;
  }
}
```

**Where it’s used:** Every route that needs storage calls `StoreSingleton.getInstance()` and then reads/writes `habits`, `tasks`, or `pomodoroSessions`. Example from `src/routes/habits.js`:

```javascript
function getStore() {
  return StoreSingleton.getInstance();
}

router.get("/", (req, res) => {
  const store = getStore();
  res.json(store.habits);
});

router.post("/", (req, res) => {
  const habit = EntityFactory.createHabit(req.body);
  const store = getStore();
  store.habits.push(habit);
  // ...
});
```

The same `getStore()` pattern appears in `src/routes/tasks.js` and `src/routes/pomodoro.js`, so all API handlers share the same in-memory store.

---

### 2. Factory

**Purpose:** Centralizes creation of domain entities (Habit, Task, PomodoroSession) with validation and a consistent shape. Callers don’t construct objects by hand; they pass data into factory functions and get back valid entities with IDs and defaults applied.

**File:** `finalproj-backend/src/patterns/EntityFactory.js`

**Pattern implementation:** Three factory functions (and an export object) create entities. Each validates required fields, uses `StoreSingleton.getInstance()` to reserve the next ID, and returns a single canonical object structure.

**Creating a habit (validation + ID from Singleton):**

```javascript
export function createHabit({
  name,
  icon = "✓",
  streak = 0,
  frequency = "daily",
  reminderTime = null,
}) {
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Habit name is required");
  }
  const store = StoreSingleton.getInstance();
  const id = String(store._nextHabitId++);
  const habit = {
    id,
    name: name.trim(),
    icon: String(icon).slice(0, 2),
    streak: Number(streak) || 0,
    completedDates: [],
    frequency: frequency === "weekly" ? "weekly" : "daily",
    reminderTime: reminderTime || null,
    createdAt: new Date().toISOString(),
  };
  return habit;
}
```

**Creating a task (validation + defaults):**

```javascript
export function createTask({
  title,
  completed = false,
  dueDate = null,
  priority = "medium",
  notes = "",
  category = "",
  estimatedMinutes = null,
}) {
  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new Error("Task title is required");
  }
  const store = StoreSingleton.getInstance();
  const id = String(store._nextTaskId++);
  const task = {
    id,
    title: title.trim(),
    completed: Boolean(completed),
    dueDate: dueDate || null,
    priority: ["high", "medium", "low"].includes(priority)
      ? priority
      : "medium",
    notes: String(notes || "").slice(0, 2000),
    category: String(category || "").slice(0, 50),
    estimatedMinutes:
      estimatedMinutes != null ? Number(estimatedMinutes) : null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  return task;
}
```

**Creating a pomodoro session:**

```javascript
export function createPomodoroSession({ durationMinutes = 25, type = "work" }) {
  const store = StoreSingleton.getInstance();
  const id = String(store._nextPomodoroId++);
  const session = {
    id,
    durationMinutes: Number(durationMinutes) || 25,
    type: type === "break" ? "break" : "work",
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
  return session;
}
```

**Where it’s used:** Routes never build these objects manually; they call the factory and then push into the Singleton store. Example from `src/routes/habits.js` and `src/routes/tasks.js`:

```javascript
// habits.js
const habit = EntityFactory.createHabit(req.body);
const store = getStore();
store.habits.push(habit);

// tasks.js
const task = EntityFactory.createTask(req.body);
const store = getStore();
store.tasks.push(task);

// pomodoro.js
const session = EntityFactory.createPomodoroSession({ durationMinutes, type });
const store = getStore();
store.pomodoroSessions.push(session);
```

So **Singleton** holds the single store; **Factory** is the single place that creates valid entities and assigns IDs.

---

### 3. Observer

**Purpose:** Decouples “something changed” from “who reacts.” When habits, tasks, or pomodoro sessions are created, updated, or completed, the backend emits events. Subscribers (e.g. logging, future SSE or webhooks) can listen without the routes knowing the details. The frontend uses a separate observer for Pomodoro timer events (tick, start, complete).

---

#### 3a. Backend observer

**File:** `finalproj-backend/src/patterns/Observer.js`

**Pattern implementation:** A single `AppObserver` instance (Singleton-like) extends Node’s `EventEmitter`. It exposes `emitHabitChange`, `emitTaskChange`, and `emitPomodoroChange`, which emit the events `'habit'`, `'task'`, and `'pomodoro'` with a payload. Any part of the app can subscribe with `observer.on('habit', fn)` etc.

```javascript
import { EventEmitter } from "events";

class AppObserver extends EventEmitter {
  static #instance = null;

  constructor() {
    super();
    if (AppObserver.#instance) return AppObserver.#instance;
    AppObserver.#instance = this;
  }

  static getInstance() {
    if (!AppObserver.#instance) AppObserver.#instance = new AppObserver();
    return AppObserver.#instance;
  }

  emitHabitChange(event, payload) {
    this.emit("habit", { event, ...payload });
  }

  emitTaskChange(event, payload) {
    this.emit("task", { event, ...payload });
  }

  emitPomodoroChange(event, payload) {
    this.emit("pomodoro", { event, ...payload });
  }
}
```

**Where it’s used:** Routes call `getObserver()` and emit after mutating the store. Example from `src/routes/habits.js` and `src/routes/pomodoro.js`:

```javascript
// habits.js – after creating a habit
getObserver().emitHabitChange("created", { habit });

// habits.js – after completing or deleting
getObserver().emitHabitChange("completed", { habit });
getObserver().emitHabitChange("deleted", { habit });

// tasks.js – after create/update/delete
getObserver().emitTaskChange("created", { task });
getObserver().emitTaskChange("completed" | "uncompleted", { task });
getObserver().emitTaskChange("deleted", { task });

// pomodoro.js – after start or complete
getObserver().emitPomodoroChange("started", { session });
getObserver().emitPomodoroChange("completed", { session });
```

**Subscriber (server entry):** In `server.js`, the same observer is used to log all events in development:

```javascript
const observer = AppObserver.getInstance();
observer.on("habit", (e) =>
  console.log("[Observer] habit", e.event, e.habit?.name),
);
observer.on("task", (e) =>
  console.log("[Observer] task", e.event, e.task?.title),
);
observer.on("pomodoro", (e) =>
  console.log("[Observer] pomodoro", e.event, e.session?.id),
);
```

So the **Observer** is the single place that notifies “habit/task/pomodoro changed”; routes only emit, and subscribers (e.g. logging or future integrations) listen.

---

#### 3b. Frontend observer (Pomodoro timer)

**Purpose:** The Pomodoro UI (and any other component) can react to timer events (tick, start, complete) without the timer component knowing who is listening. This is the same Observer idea on the client.

**File:** `finalproj-frontend/src/lib/TimerObserver.js`

**Pattern implementation:** A single `TimerObserver` instance holds lists of callbacks per event (`tick`, `start`, `complete`). Components subscribe with `subscribe(event, callback)` and get an unsubscribe function. The timer calls `notify(event, payload)` when something happens.

```javascript
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
      this._listeners[event] = this._listeners[event].filter(
        (cb) => cb !== callback,
      );
    };
  }

  notify(event, payload) {
    (this._listeners[event] || []).forEach((cb) => cb(payload));
  }
}
```

**Where it’s used:** The Pomodoro timer component gets the observer with `TimerObserver.getInstance()` and calls `observer.notify('tick', { secondsLeft })` every second, and `observer.notify('start', ...)` / `observer.notify('complete', ...)` when the timer starts or finishes. Other UI or logic can subscribe to these events for real-time updates (e.g. badges, sounds, or analytics) without the timer knowing about them.

---

## Summary table

| Pattern       | File(s)                                                | Role                                                                                 |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Singleton** | `SingletonStore.js`                                    | Single in-memory store; all routes use `getInstance()`.                              |
| **Factory**   | `EntityFactory.js`                                     | Creates Habit/Task/PomodoroSession with validation and IDs.                          |
| **Observer**  | `Observer.js` (backend), `TimerObserver.js` (frontend) | Backend: emit habit/task/pomodoro events; Frontend: emit/subscribe for timer events. |

---

## API

| Method | Path                                | Description                           |
| ------ | ----------------------------------- | ------------------------------------- |
| GET    | /api/habits                         | List habits                           |
| POST   | /api/habits                         | Create habit                          |
| PATCH  | /api/habits/:id/complete            | Mark habit done today                 |
| DELETE | /api/habits/:id                     | Delete habit                          |
| GET    | /api/tasks                          | List tasks                            |
| POST   | /api/tasks                          | Create task                           |
| PATCH  | /api/tasks/:id                      | Update task (title, completed)        |
| DELETE | /api/tasks/:id                      | Delete task                           |
| GET    | /api/pomodoro/sessions              | List pomodoro sessions                |
| POST   | /api/pomodoro/sessions              | Start session (durationMinutes, type) |
| PATCH  | /api/pomodoro/sessions/:id/complete | Complete session                      |

---

## Stack

- **Backend:** Express, in-memory store (Singleton), EntityFactory, AppObserver (EventEmitter). Optional: MongoDB for persistence.
- **Frontend:** Next.js, React, Chakra UI, TimerObserver for Pomodoro events.
