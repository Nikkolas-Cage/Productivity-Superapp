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
cd Productivity-Superapp

# Or open the project folder you already have:
cd /path/to/Productivity-Superapp
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
<img width="380" height="292" alt="Screenshot 2026-02-14 at 1 47 23 PM" src="https://github.com/user-attachments/assets/c50782db-0317-454a-b975-e4d83e28d154" />

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

---

## How to use the app (step-by-step guide)

**[insert video here]** — _Add your walkthrough or demo video via GitHub (e.g. embed or link)._

Below is a step-by-step guide to every main feature.

---

### 1. First launch and onboarding

**[insert video here]**

1. Open the app at `http://localhost:3000` (with backend running on `http://localhost:4000`).
2. On first visit, an **onboarding tour** may start automatically. It highlights:
   - Dashboard (overview and heatmap)
   - Activity heatmap
   - Habits, Pomodoro, Tasks, and Notes tabs
3. Use **Next** / **Back** to move, or **Skip** to close. You can replay the tour anytime via the **?** (question mark) button in the header.

---

### 2. Dashboard

**[insert video here]**

1. The **Dashboard** tab is the default home.
2. **Activity heatmap** (top): Shows the last 12 months. Each cell is a day; darker green = more activity (habits done + tasks completed + Pomodoros that day). Hover a cell to see the breakdown (Habits / Tasks / Pomodoros).
3. **Summary cards** (clickable):
   - **Habits today** — Click to jump to the Habits tab.
   - **Tasks done** — Click to jump to the Tasks tab.
   - **Pomodoros today** — Click to jump to the Pomodoro tab.
   - **Active items** — Click to jump to the Tasks tab (habits + open tasks count).
4. **How we count** — Expandable section explaining how each metric is computed.

---

### 3. Habits tab

**[insert video here]**

1. Switch to the **Habits** tab.
2. **Activity heatmap** at the top (same as Dashboard); it updates in real time when you add or complete habits.
3. **Live clock** and **Habit focus timer**: Use the dropdown (5 / 10 / 15 / 20 min) and **Start** to run a short focus session for a habit.
4. **View / log for date**: Use the date picker to see or log habits for **any past or today’s** date.
5. **Today’s progress**: Bar and text show “X of Y habits done” for the selected date.
6. **Add a habit**: Type a name, choose **Daily** or **Weekly**, then click the **+** (or press Enter). Daily = every day; Weekly = at least once per week.
7. **Check off a habit**: Tick the checkbox for a habit on the selected date. Streak and “X of Y” update; the heatmap refreshes.
8. **Delete a habit**: Click the red trash icon next to the habit.

---

### 4. Pomodoro tab

**[insert video here]**

1. Switch to the **Pomodoro** tab.
2. **Activity heatmap** at the top; it updates when you complete a **work** session.
3. **Timer settings** (edit when the timer is stopped):
   - **Work (min)**: e.g. 25 (default). Allowed range 1–120.
   - **Break (min)**: e.g. 5 (default). Allowed range 1–60.
4. **Big timer**: Shows remaining time (MM:SS). **Focus** = work, **Break** = break.
5. **Start** — Starts the current phase (work or break). **Reset** — Stops and resets to full duration. **Switch to Break/Work** — Toggles the next phase (only when stopped).
6. **Gamification**: Level, total XP, “Today” (work sessions), “Streak” (consecutive days with ≥1 work session). Progress bar for XP to next level.
7. **Achievements**: Grid of badges; locked (🔒) vs unlocked (🏆). Unlock by completing sessions and streaks; toasts appear when you unlock one.

---

### 5. Tasks tab

**[insert video here]**

1. Switch to the **Tasks** tab.
2. **Activity heatmap** at the top; it updates when you add, complete, or delete tasks (and when you toggle completion in the expanded form).
3. **Add a task**: Type a title and click **+** (or press Enter). Optionally click **Options** to set **Due date**, **Priority** (High / Medium / Low), **Category** (type or pick), and **Est. minutes**.
4. **Complete a task**: Check the checkbox. The task is marked done and the heatmap updates.
5. **Expand a task**: Click the **▼** icon to edit **Due date**, **Priority**, **Category**, and **Notes**. Changes save as you edit. Toggling **completed** here also refreshes the heatmap.
6. **Sort**: Use the dropdown to sort by **Due**, **Priority**, or **Newest**.
7. **Filter**: Filter by **Priority** and **Category**.
8. **Delete**: Red trash icon on the row. **Overdue** count appears at the top when you have incomplete tasks past their due date.

---

### 6. Notes tab

**[insert video here]**

1. Switch to the **Notes** tab.
2. **List (left)**: All notes. Click a note to open it in the editor. **New note** creates a blank note.
3. **Editor (right)**:
   - **Title** and **Description** (optional). **Save** writes to the list (create or update). **Draft** badge appears when there are unsaved changes.
   - **Content** area: You can type and **paste text, images, and video**. Pasted images/video are stored as data URLs so they persist. Use **Delete** (trash) when a note is selected to remove it.
4. Notes are stored in the browser (**localStorage**); they stay on this device only.

---

### 7. Activity heatmap (all tabs)

**[insert video here]**

- The same **calendar heatmap** appears on **Dashboard**, **Habits**, **Pomodoro**, and **Tasks**.
- It combines **habits completed per day**, **tasks completed per day** (by completion date), and **Pomodoro work sessions per day**.
- It updates in **real time** on the Habits tab when you add/complete/delete habits; on the Pomodoro tab when you complete a work session; on the Tasks tab when you add/complete/delete tasks or toggle completion.
- Hover a day to see the breakdown (e.g. “Habits: 2, Tasks: 1, Pomodoros: 3 · Total: 6”).

---

### 8. Quick reference

**[insert video here]**

| Goal                      | Where to go | What to do                                            |
| ------------------------- | ----------- | ----------------------------------------------------- |
| See overview              | Dashboard   | Check heatmap and summary cards; click cards to jump. |
| Log daily habits          | Habits      | Pick date, tick habits, or add new ones.              |
| Run a focus session       | Pomodoro    | Set work/break minutes, press Start.                  |
| Add a one-off to-do       | Tasks       | Type title, optionally set due date/priority, Add.    |
| Quick notes / paste media | Notes       | Create note, type or paste; Save.                     |
| Replay app tour           | Header      | Click **?** (question mark).                          |
