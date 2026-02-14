import Head from "next/head";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  List,
  ListItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack,
  Badge,
  Progress,
  Checkbox,
  Select,
  FormControl,
  FormLabel,
  Collapse,
  Wrap,
  WrapItem,
  SimpleGrid,
  Textarea,
  Tooltip,
  Grid,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon, QuestionIcon } from "@chakra-ui/icons";
import { api } from "@/lib/api";
import TimerObserver from "@/lib/TimerObserver";

const TOUR_STORAGE_KEY = "productivity-tour-done";

const TOUR_STEPS = [
  { id: "welcome", title: "Welcome to Productivity Superapp", body: "This quick tour will show you the main features. You can skip anytime or replay from the header.", target: null, tabIndex: 0 },
  { id: "dashboard-tab", title: "Dashboard", body: "Start here for an overview: activity heatmap, today's stats, and quick capture.", target: "[data-tour=\"dashboard-tab\"]", tabIndex: 0 },
  { id: "heatmap", title: "Activity heatmap", body: "Your last 12 months at a glance. Darker green = more activity (habits done + tasks completed + Pomodoro sessions).", target: "[data-tour=\"heatmap\"]", tabIndex: 0 },
  { id: "habits-tab", title: "Habits", body: "Track daily or weekly habits. Check them off per day and build streaks.", target: "[data-tour=\"habits-tab\"]", tabIndex: 1 },
  { id: "pomodoro-tab", title: "Pomodoro", body: "Focus timer (25 min work, 5 min break) with XP, levels, and achievements.", target: "[data-tour=\"pomodoro-tab\"]", tabIndex: 2 },
  { id: "tasks-tab", title: "Tasks", body: "One-off to-dos with due dates, priority, categories, and notes.", target: "[data-tour=\"tasks-tab\"]", tabIndex: 3 },
  { id: "notes-tab", title: "Notes", body: "A scratchpad that auto-saves to this device. Use it for quick ideas or reminders.", target: "[data-tour=\"notes-tab\"]", tabIndex: 4 },
  { id: "done", title: "You're all set", body: "Use the tabs to switch between sections. Come back to the Dashboard for the big picture. Happy shipping!", target: null, tabIndex: 0 },
];

function TourOverlay({ isOpen, onClose, steps, stepIndex, setStepIndex, setTabIndex, currentTabIndex }) {
  const [spotlight, setSpotlight] = useState(null);
  const step = steps[stepIndex];

  useEffect(() => {
    if (!isOpen || !step || !step.target) {
      setSpotlight(null);
      return;
    }
    if (step.tabIndex !== undefined && step.tabIndex !== currentTabIndex) {
      setTabIndex(step.tabIndex);
    }
    const delay = step.tabIndex !== undefined && step.tabIndex !== currentTabIndex ? 350 : 50;
    const t = setTimeout(() => {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlight({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      } else {
        setSpotlight(null);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [isOpen, stepIndex, step, currentTabIndex, setTabIndex]);

  useEffect(() => {
    const handler = () => {
      if (!step?.target) return;
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlight({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [step?.target, stepIndex]);

  if (!isOpen) return null;

  const goNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1);
    else {
      try { localStorage.setItem(TOUR_STORAGE_KEY, "true"); } catch (_) {}
      onClose();
    }
  };
  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const noSpotlight = !spotlight;
  const content = (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      width="100vw"
      height="100vh"
      minWidth="100vw"
      minHeight="100vh"
      zIndex={9999}
      pointerEvents="auto"
    >
      {/* Full-viewport dark overlay when no spotlight (welcome / done steps) */}
      {noSpotlight && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100vw"
          height="100vh"
          minWidth="100vw"
          minHeight="100vh"
          bg="blackAlpha.700"
          pointerEvents="none"
        />
      )}
      {spotlight && (
        <Box
          position="fixed"
          left={spotlight.left}
          top={spotlight.top}
          w={spotlight.width}
          h={spotlight.height}
          pointerEvents="none"
          boxShadow="0 0 0 9999px rgba(0,0,0,0.75)"
          borderRadius="md"
          borderWidth="2px"
          borderColor="teal.400"
        />
      )}
      {/* Tooltip card - larger when no spotlight (welcome / done) */}
      <Flex
        position="fixed"
        left={4}
        right={4}
        top={noSpotlight ? "50%" : spotlight.top + spotlight.height + 16}
        bottom={noSpotlight ? "auto" : "auto"}
        transform={noSpotlight ? "translateY(-50%)" : "none"}
        zIndex={10000}
        justify="center"
        pointerEvents="auto"
      >
        <Box
          maxW={noSpotlight ? "md" : "sm"}
          w="full"
          p={noSpotlight ? 6 : 4}
          bg="white"
          borderRadius="lg"
          boxShadow="xl"
          borderWidth="1px"
          _dark={{ bg: "gray.800", borderColor: "gray.600" }}
        >
          <Heading size={noSpotlight ? "md" : "sm"} mb={2}>{step?.title}</Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>{step?.body}</Text>
          <HStack justify="space-between">
            <HStack>
              <Button size="sm" variant="ghost" onClick={onClose}>Skip</Button>
              {stepIndex > 0 && <Button size="sm" variant="outline" onClick={goBack}>Back</Button>}
            </HStack>
            <Button size="sm" colorScheme="teal" onClick={goNext}>
              {stepIndex >= steps.length - 1 ? "Done" : "Next"}
            </Button>
          </HStack>
          <Text fontSize="xs" color="gray.400" mt={2}>{stepIndex + 1} / {steps.length}</Text>
        </Box>
      </Flex>
    </Box>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}

const HEATMAP_DAYS = 365; // 1 year
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarHeatmap({ activityBreakdownByDate, days = HEATMAP_DAYS }) {
  const emptyBg = useColorModeValue("gray.100", "whiteAlpha.200");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - days + 1);

  const cells = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toDateString();
    const b = activityBreakdownByDate[dateStr] || { habits: 0, tasks: 0, pomodoros: 0 };
    const count = b.habits + b.tasks + b.pomodoros;
    cells.push({ dateStr, count, breakdown: b, dayOfWeek: d.getDay(), weekIndex: Math.floor(i / 7) });
  }

  const maxCount = Math.max(1, ...cells.map((c) => c.count));
  const numWeeks = Math.ceil(days / 7);

  const weekRows = [];
  for (let dow = 0; dow < 7; dow++) {
    const row = [];
    for (let w = 0; w < numWeeks; w++) {
      const cell = cells.find((c) => c.dayOfWeek === dow && c.weekIndex === w);
      row.push(cell || { dateStr: "", count: 0, breakdown: { habits: 0, tasks: 0, pomodoros: 0 } });
    }
    weekRows.push(row);
  }

  const getColor = (count) => {
    if (count === 0) return emptyBg;
    const pct = count / maxCount;
    if (pct <= 0.25) return "green.200";
    if (pct <= 0.5) return "green.400";
    if (pct <= 0.75) return "green.600";
    return "green.700";
  };

  const tooltipLabel = (cell) => {
    if (!cell.dateStr) return "";
    const { habits, tasks, pomodoros } = cell.breakdown || {};
    const total = cell.count;
    const parts = [];
    if (habits) parts.push(`Habits: ${habits}`);
    if (tasks) parts.push(`Tasks: ${tasks}`);
    if (pomodoros) parts.push(`Pomodoros: ${pomodoros}`);
    return `${cell.dateStr} — ${parts.length ? parts.join(", ") + " · " : ""}Total: ${total}`;
  };

  return (
    <Box w="full" overflowX="auto">
      <Text fontSize="xs" fontWeight="semibold" mb={2} color="gray.600">
        Activity — habits + tasks done + Pomodoros (last 12 months)
      </Text>
      <HStack align="flex-start" spacing="2px" overflow="auto" pb={2}>
        <VStack spacing="2px" align="stretch" flexShrink={0}>
          {DAY_LABELS.map((label) => (
            <Flex key={label} h="12px" align="center" fontSize="9px" color="gray.500" pr={1}>
              {label}
            </Flex>
          ))}
        </VStack>
        <Grid templateColumns={`repeat(${numWeeks}, 12px)`} templateRows="repeat(7, 12px)" gap="2px" w="max-content">
          {weekRows.map((row, ri) =>
            row.map((cell, ci) => (
              <Tooltip key={`${ri}-${ci}`} label={tooltipLabel(cell)} placement="top">
                <Box
                  w="12px"
                  h="12px"
                  minW="12px"
                  minH="12px"
                  borderRadius="3px"
                  bg={getColor(cell.count)}
                  _hover={{ ring: "1px", ringColor: "green.500" }}
                />
              </Tooltip>
            ))
          )}
        </Grid>
      </HStack>
      <HStack fontSize="9px" color="gray.500" spacing={2} mt={1}>
        <Text>Less</Text>
        <HStack spacing="1px">
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
            <Box key={i} w="8px" h="8px" borderRadius="2px" bg={pct === 0 ? emptyBg : pct <= 0.25 ? "green.200" : pct <= 0.5 ? "green.400" : pct <= 0.75 ? "green.600" : "green.700"} />
          ))}
        </HStack>
        <Text>More</Text>
      </HStack>
    </Box>
  );
}

// --- Activity heatmap widget: fetches data and renders heatmap (realtime when refreshTrigger changes) ---
function ActivityHeatmapWidget({ refreshTrigger = 0 }) {
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    Promise.all([
      api.habits.list().catch(() => []),
      api.tasks.list().catch(() => []),
      api.pomodoro.listSessions().catch(() => []),
    ]).then(([habitsRes, tasksRes, sessionsRes]) => {
      if (cancelled) return;
      setHabits(Array.isArray(habitsRes) ? habitsRes : []);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const activityBreakdownByDate = {};
  habits.forEach((h) => {
    (h.completedDates || []).forEach((d) => {
      if (!activityBreakdownByDate[d]) activityBreakdownByDate[d] = { habits: 0, tasks: 0, pomodoros: 0 };
      activityBreakdownByDate[d].habits += 1;
    });
  });
  sessions.filter((s) => s.completedAt && s.type === "work").forEach((s) => {
    const d = new Date(s.completedAt).toDateString();
    if (!activityBreakdownByDate[d]) activityBreakdownByDate[d] = { habits: 0, tasks: 0, pomodoros: 0 };
    activityBreakdownByDate[d].pomodoros += 1;
  });
  tasks.filter((t) => t.completed && t.completedAt).forEach((t) => {
    const d = new Date(t.completedAt).toDateString();
    if (!activityBreakdownByDate[d]) activityBreakdownByDate[d] = { habits: 0, tasks: 0, pomodoros: 0 };
    activityBreakdownByDate[d].tasks += 1;
  });

  if (loading) return <Text fontSize="sm" color="gray.500">Loading activity...</Text>;
  return <CalendarHeatmap activityBreakdownByDate={activityBreakdownByDate} />;
}

// --- Dashboard: heatmap, summary ---
function Dashboard({ onTabChange }) {
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pomodoroStats, setPomodoroStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const [habitsRes, tasksRes, statsRes, sessionsRes] = await Promise.all([
        api.habits.list(),
        api.tasks.list(),
        api.pomodoro.getStats().catch(() => null),
        api.pomodoro.listSessions().catch(() => []),
      ]);
      setHabits(Array.isArray(habitsRes) ? habitsRes : []);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setPomodoroStats(statsRes);
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
    } catch (e) {
      toast({ title: "Failed to load dashboard", status: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const todayStr = new Date().toDateString();
  const activityBreakdownByDate = {};
  habits.forEach((h) => {
    (h.completedDates || []).forEach((d) => {
      if (!activityBreakdownByDate[d]) activityBreakdownByDate[d] = { habits: 0, tasks: 0, pomodoros: 0 };
      activityBreakdownByDate[d].habits += 1;
    });
  });
  sessions.filter((s) => s.completedAt && s.type === "work").forEach((s) => {
    const d = new Date(s.completedAt).toDateString();
    if (!activityBreakdownByDate[d]) activityBreakdownByDate[d] = { habits: 0, tasks: 0, pomodoros: 0 };
    activityBreakdownByDate[d].pomodoros += 1;
  });
  tasks.filter((t) => t.completed && t.completedAt).forEach((t) => {
    const d = new Date(t.completedAt).toDateString();
    if (!activityBreakdownByDate[d]) activityBreakdownByDate[d] = { habits: 0, tasks: 0, pomodoros: 0 };
    activityBreakdownByDate[d].tasks += 1;
  });

  const habitsDoneToday = habits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const tasksDoneTotal = tasks.filter((t) => t.completed).length;
  const pomodoroToday = pomodoroStats?.workToday ?? 0;

  if (loading) return <Text>Loading...</Text>;

  return (
    <VStack spacing={4} align="stretch">
      <Box data-tour="heatmap" w="full">
        <CalendarHeatmap activityBreakdownByDate={activityBreakdownByDate} />
      </Box>
      <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} w="full">
        <Box
          p={3}
          borderRadius="lg"
          bg="teal.50"
          borderWidth="1px"
          borderColor="teal.100"
          cursor="pointer"
          _hover={{ bg: "teal.100", borderColor: "teal.200" }}
          onClick={() => onTabChange?.(1)}
        >
          <Text fontSize="2xl" fontWeight="bold" color="teal.700">{habitsDoneToday}</Text>
          <Text fontSize="xs" color="teal.600">Habits today</Text>
        </Box>
        <Box
          p={3}
          borderRadius="lg"
          bg="blue.50"
          borderWidth="1px"
          borderColor="blue.100"
          cursor="pointer"
          _hover={{ bg: "blue.100", borderColor: "blue.200" }}
          onClick={() => onTabChange?.(3)}
        >
          <Text fontSize="2xl" fontWeight="bold" color="blue.700">{tasksDoneTotal}</Text>
          <Text fontSize="xs" color="blue.600">Tasks done</Text>
        </Box>
        <Box
          p={3}
          borderRadius="lg"
          bg="purple.50"
          borderWidth="1px"
          borderColor="purple.100"
          cursor="pointer"
          _hover={{ bg: "purple.100", borderColor: "purple.200" }}
          onClick={() => onTabChange?.(2)}
        >
          <Text fontSize="2xl" fontWeight="bold" color="purple.700">{pomodoroToday}</Text>
          <Text fontSize="xs" color="purple.600">Pomodoros today</Text>
        </Box>
        <Box
          p={3}
          borderRadius="lg"
          bg="orange.50"
          borderWidth="1px"
          borderColor="orange.100"
          cursor="pointer"
          _hover={{ bg: "orange.100", borderColor: "orange.200" }}
          onClick={() => onTabChange?.(3)}
        >
          <Text fontSize="2xl" fontWeight="bold" color="orange.700">{habits.length + tasks.filter((t) => !t.completed).length}</Text>
          <Text fontSize="xs" color="orange.600">Active items</Text>
        </Box>
      </SimpleGrid>
      <Collapse in={true}>
        <Box p={3} borderRadius="lg" bg={useColorModeValue("gray.50", "gray.800")} borderWidth="1px" fontSize="sm">
          <Text fontWeight="semibold" mb={2} fontSize="xs" color="gray.600">How we count</Text>
          <VStack align="stretch" spacing={1.5}>
            <Text><Badge colorScheme="teal" mr={2}>Habits today</Badge> Number of habits you checked off today. Each check adds to the heatmap for that day.</Text>
            <Text><Badge colorScheme="blue" mr={2}>Tasks done</Badge> Total tasks you’ve completed (all time). Each completion adds to the heatmap on the day you finished it.</Text>
            <Text><Badge colorScheme="purple" mr={2}>Pomodoros today</Badge> Work sessions (25 min) you completed today. Each completed session adds to the heatmap for that day.</Text>
            <Text><Badge colorScheme="orange" mr={2}>Active items</Badge> Current habits plus open tasks — what you have on your list to do (not a per-day count).</Text>
          </VStack>
        </Box>
      </Collapse>
    </VStack>
  );
}

// --- Full Notes app: list view + editor, draft/save, rich content (images/video) ---
const NOTES_KEY = "productivity-notes-v2";

function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

function sanitizeHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const scripts = tmp.querySelectorAll("script");
  scripts.forEach((s) => s.remove());
  return tmp.innerHTML;
}

function NotesTab() {
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState({ title: "", description: "", content: "" });
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const contentRef = useRef(null);
  const toast = useToast();
  const listBg = useColorModeValue("gray.50", "gray.800");
  const itemSelectedBg = useColorModeValue("teal.50", "whiteAlpha.100");
  const itemHoverBg = useColorModeValue("gray.100", "whiteAlpha.50");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setNotes(Array.isArray(parsed) ? parsed : []);
      } else {
        const legacy = localStorage.getItem("productivity-notes");
        if (legacy && typeof legacy === "string") {
          setNotes([{ id: "legacy-1", title: "Scratchpad", description: "", content: legacy, updatedAt: new Date().toISOString() }]);
        }
      }
    } catch (_) {}
    setLoaded(true);
  }, []);

  const persist = useCallback((nextNotes) => {
    setNotes(nextNotes);
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(nextNotes));
    } catch (_) {}
  }, []);

  const selectedNote = notes.find((n) => n.id === selectedId);

  const loadNoteIntoEditor = useCallback((note) => {
    setDraft({ title: note.title || "", description: note.description || "", content: note.content || "" });
    setHasUnsaved(false);
    if (contentRef.current) {
      contentRef.current.innerHTML = note.content || "";
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (selectedId) {
      const n = notes.find((x) => x.id === selectedId);
      if (n) loadNoteIntoEditor(n);
    } else {
      setDraft({ title: "", description: "", content: "" });
      setHasUnsaved(false);
      if (contentRef.current) contentRef.current.innerHTML = "";
    }
  }, [selectedId, loaded, notes, loadNoteIntoEditor]);

  const getContentHtml = () => (contentRef.current ? sanitizeHtml(contentRef.current.innerHTML) : "");

  const handleSave = () => {
    const title = draft.title.trim() || "Untitled";
    const description = draft.description.trim();
    const content = getContentHtml();
    const updatedAt = new Date().toISOString();

    if (selectedId) {
      const next = notes.map((n) => (n.id === selectedId ? { ...n, title, description, content, updatedAt } : n));
      persist(next);
      toast({ title: "Note saved", status: "success", duration: 2000 });
    } else {
      const id = "n-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
      persist([...notes, { id, title, description, content, updatedAt }]);
      setSelectedId(id);
      toast({ title: "Note saved", status: "success", duration: 2000 });
    }
    setHasUnsaved(false);
  };

  const handleNew = () => {
    if (hasUnsaved && (draft.title || draft.description || getContentHtml())) {
      if (typeof window !== "undefined" && !window.confirm("Discard unsaved changes?")) return;
    }
    setSelectedId(null);
    setDraft({ title: "", description: "", content: "" });
    setHasUnsaved(false);
    if (contentRef.current) contentRef.current.innerHTML = "";
  };

  const handleDelete = () => {
    if (!selectedId) return;
    if (typeof window !== "undefined" && !window.confirm("Delete this note?")) return;
    persist(notes.filter((n) => n.id !== selectedId));
    setSelectedId(null);
    setDraft({ title: "", description: "", content: "" });
    if (contentRef.current) contentRef.current.innerHTML = "";
    toast({ title: "Note deleted", status: "info" });
  };

  const handleDraftChange = () => setHasUnsaved(true);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = Array.from(items).filter((i) => i.kind === "file");
    if (files.length === 0) return;
    e.preventDefault();
    files.forEach((item) => {
      const file = item.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result;
        if (!dataUrl) return;
        const isVideo = file.type.startsWith("video/");
        const tag = isVideo ? "video" : "img";
        const el = document.createElement(tag);
        if (tag === "img") {
          el.src = dataUrl;
          el.alt = "Pasted image";
        } else {
          el.src = dataUrl;
          el.controls = true;
        }
        el.style.maxWidth = "100%";
        el.style.height = "auto";
        document.execCommand("insertHTML", false, el.outerHTML);
        setHasUnsaved(true);
      };
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) reader.readAsDataURL(file);
    });
  }, []);

  if (!loaded) return <Text>Loading...</Text>;

  return (
    <Flex direction={{ base: "column", md: "row" }} gap={4} h={{ base: "auto", md: "70vh" }} minH={{ base: "60vh", md: "400px" }}>
      {/* List view - scrollable */}
      <Box
        w={{ base: "full", md: "280px" }}
        flexShrink={0}
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={listBg}
      >
        <Box p={2} borderBottomWidth="1px">
          <Button size="sm" w="full" colorScheme="teal" leftIcon={<AddIcon />} onClick={handleNew}>
            New note
          </Button>
        </Box>
        <VStack align="stretch" spacing={0} overflowY="auto" maxH={{ base: "240px", md: "calc(70vh - 52px)" }} pb={2}>
          {notes.length === 0 && (
            <Text fontSize="sm" color="gray.500" p={4} textAlign="center">
              No notes yet. Create one.
            </Text>
          )}
          {notes.map((n) => (
            <Box
              key={n.id}
              p={3}
              cursor="pointer"
              bg={selectedId === n.id ? itemSelectedBg : "transparent"}
              borderLeftWidth="3px"
              borderLeftColor={selectedId === n.id ? "teal.500" : "transparent"}
              _hover={{ bg: itemHoverBg }}
              onClick={() => {
                if (hasUnsaved) {
                  if (window.confirm("Save current note first? Cancel will discard changes.")) handleSave();
                }
                setSelectedId(n.id);
              }}
            >
              <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                {n.title || "Untitled"}
              </Text>
              <Text fontSize="xs" color="gray.500" noOfLines={2} mt={0.5}>
                {n.description || stripHtml(n.content || "").slice(0, 80) || "No content"}
              </Text>
              <Text fontSize="xs" color="gray.400" mt={1}>
                {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : ""}
              </Text>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Editor - draft + save */}
      <Box flex={1} minW={0} display="flex" flexDirection="column" borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" _dark={{ bg: "gray.800" }}>
        <HStack p={2} borderBottomWidth="1px" flexWrap="wrap" gap={2}>
          <Button size="sm" colorScheme="teal" onClick={handleSave}>
            Save
          </Button>
          {hasUnsaved && (
            <Badge colorScheme="orange">Draft</Badge>
          )}
          {selectedId && (
            <IconButton aria-label="Delete note" size="sm" variant="ghost" colorScheme="red" icon={<DeleteIcon />} onClick={handleDelete} />
          )}
        </HStack>
        <VStack align="stretch" spacing={3} p={4} flex={1} overflow="hidden">
          <FormControl>
            <FormLabel fontSize="xs">Title</FormLabel>
            <Input
              size="sm"
              placeholder="Note title"
              value={draft.title}
              onChange={(e) => { setDraft((d) => ({ ...d, title: e.target.value })); setHasUnsaved(true); }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs">Description (optional)</FormLabel>
            <Input
              size="sm"
              placeholder="Short description"
              value={draft.description}
              onChange={(e) => { setDraft((d) => ({ ...d, description: e.target.value })); setHasUnsaved(true); }}
            />
          </FormControl>
          <FormControl flex={1} display="flex" flexDirection="column" minH="200px">
            <FormLabel fontSize="xs">Content — paste text, images, or video</FormLabel>
            <Box
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleDraftChange}
              onPaste={handlePaste}
              px={3}
              py={2}
              minH="200px"
              flex={1}
              overflowY="auto"
              borderWidth="1px"
              borderRadius="md"
              fontSize="sm"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              _focus={{ outline: "none", borderColor: "teal.400", boxShadow: "0 0 0 1px var(--chakra-colors-teal-400)" }}
              sx={{
                "& img": { maxWidth: "100%", height: "auto" },
                "& video": { maxWidth: "100%", height: "auto" },
              }}
            />
          </FormControl>
        </VStack>
      </Box>
    </Flex>
  );
}

// --- Live clock (clock-based) ---
function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <VStack spacing={0} py={2}>
      <Text fontSize="2xl" fontFamily="mono" fontWeight="bold">
        {time}
      </Text>
      <Text fontSize="sm" color="gray.500">
        {date}
      </Text>
    </VStack>
  );
}

// --- Pomodoro Timer with gamification (XP, level, streak, achievements) ---
const DEFAULT_STATS = {
  totalXP: 0,
  level: 1,
  xpInLevel: 0,
  xpNeededForNext: 100,
  progressPct: 0,
  streak: 0,
  workToday: 0,
  totalWork: 0,
  totalBreak: 0,
  achievements: [],
  newAchievements: [],
};

function PomodoroTimer() {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const workSec = Math.max(1, Math.min(120, Number(workMinutes) || 25)) * 60;
  const breakSec = Math.max(1, Math.min(60, Number(breakMinutes) || 5)) * 60;

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("work");
  const [sessionId, setSessionId] = useState(null);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [heatmapRefresh, setHeatmapRefresh] = useState(0);
  const toast = useToast();
  const observer = TimerObserver.getInstance();
  const timerBoxBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const loadStats = useCallback(async () => {
    try {
      const data = await api.pomodoro.getStats();
      setStats((prev) => ({ ...DEFAULT_STATS, ...data, newAchievements: data.newAchievements || [] }));
    } catch (e) {
      console.warn(e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(mode === "work" ? workSec : breakSec);
    }
  }, [workMinutes, breakMinutes, mode, isRunning, workSec, breakSec]);

  const notifyComplete = useCallback(async () => {
    observer.notify("complete", { mode });
    if (sessionId) {
      try {
        const result = await api.pomodoro.completeSession(sessionId);
        if (result && result.stats) {
          setStats((prev) => ({
            ...prev,
            ...result.stats,
            newAchievements: result.stats.newAchievements || [],
          }));
          const s = result.stats;
          if (s.newAchievements && s.newAchievements.length > 0) {
            s.newAchievements.forEach((a) => {
              toast({
                title: "Achievement unlocked!",
                description: `${a.name}: ${a.desc}`,
                status: "success",
                duration: 5000,
                position: "top",
              });
            });
          }
          if (mode === "work") setHeatmapRefresh((k) => k + 1);
        }
      } catch (e) {
        console.warn(e);
      }
    }
    toast({
      title: mode === "work" ? "Session complete! +10 XP" : "Break over +2 XP",
      description: mode === "work" ? "Take a 5 min break." : "Ready for next focus.",
      status: "success",
      duration: 4000,
    });
  }, [mode, sessionId, observer, toast]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setIsRunning(false);
          clearInterval(interval);
          notifyComplete();
          const nextMode = mode === "work" ? "break" : "work";
          setMode(nextMode);
          setSecondsLeft(nextMode === "work" ? workSec : breakSec);
          return nextMode === "work" ? workSec : breakSec;
        }
        observer.notify("tick", { secondsLeft: s - 1 });
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, notifyComplete, observer]);

  const start = async () => {
    observer.notify("start", { mode });
    const sec = mode === "work" ? workSec : breakSec;
    setSecondsLeft(sec);
    setIsRunning(true);
    try {
      const session = await api.pomodoro.startSession({
        durationMinutes: mode === "work" ? (Math.max(1, Math.min(120, Number(workMinutes) || 25))) : (Math.max(1, Math.min(60, Number(breakMinutes) || 5))),
        type: mode,
      });
      setSessionId(session.id);
    } catch (e) {
      console.warn(e);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setSecondsLeft(mode === "work" ? workSec : breakSec);
  };

  const toggleMode = () => {
    if (!isRunning) {
      setMode((m) => (m === "work" ? "break" : "work"));
      setSecondsLeft(mode === "work" ? breakSec : workSec);
    }
  };

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;

  return (
    <VStack spacing={4} align="stretch">
      <Box w="full">
        <ActivityHeatmapWidget refreshTrigger={heatmapRefresh} />
      </Box>
      {/* Gamification strip */}
      {!statsLoading && (
        <Box p={3} bg="linear-gradient(135deg, var(--chakra-colors-blue-50), var(--chakra-colors-purple-50))" borderRadius="lg" borderWidth="1px">
          <HStack justify="space-between" mb={2} flexWrap="wrap" gap={2}>
            <HStack>
              <Badge colorScheme="purple" fontSize="md">Level {stats.level}</Badge>
              <Text fontSize="xs" color="gray.600">{stats.totalXP} XP total</Text>
            </HStack>
            <HStack spacing={3}>
              <Tooltip label="Work sessions completed today">
                <Badge colorScheme="blue">Today: {stats.workToday}</Badge>
              </Tooltip>
              <Tooltip label="Consecutive days with at least 1 work session">
                <Badge colorScheme="orange">Streak: {stats.streak} day{stats.streak !== 1 ? "s" : ""}</Badge>
              </Tooltip>
            </HStack>
          </HStack>
          <Progress value={stats.progressPct} colorScheme="purple" size="sm" borderRadius="full" />
          <Text fontSize="xs" color="gray.500" mt={1}>
            {stats.xpInLevel} / {stats.xpNeededForNext} XP to next level
          </Text>
        </Box>
      )}

      <Heading size="md">Pomodoro Timer</Heading>

      <Box p={3} borderRadius="lg" bg={timerBoxBg} borderWidth="1px">
        <Text fontSize="xs" fontWeight="semibold" mb={2} color="gray.600">Timer (edit when stopped)</Text>
        <SimpleGrid columns={2} spacing={3}>
          <FormControl size="sm" isDisabled={isRunning}>
            <FormLabel fontSize="xs">Work (min)</FormLabel>
            <Input
              type="number"
              min={1}
              max={120}
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Math.max(1, Math.min(120, Number(e.target.value) || 25)))}
              size="sm"
            />
          </FormControl>
          <FormControl size="sm" isDisabled={isRunning}>
            <FormLabel fontSize="xs">Break (min)</FormLabel>
            <Input
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(1, Math.min(60, Number(e.target.value) || 5)))}
              size="sm"
            />
          </FormControl>
        </SimpleGrid>
      </Box>

      <Box textAlign="center" py={4}>
        <Text fontSize="4xl" fontFamily="mono">
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </Text>
        <Badge colorScheme={mode === "work" ? "blue" : "green"} mt={2}>
          {mode === "work" ? "Focus" : "Break"}
        </Badge>
      </Box>
      <Progress
        value={(((mode === "work" ? workSec : breakSec) - secondsLeft) / (mode === "work" ? workSec : breakSec)) * 100}
        colorScheme={mode === "work" ? "blue" : "green"}
        size="sm"
        borderRadius="full"
      />
      <HStack justify="center" spacing={2}>
        <Button colorScheme="blue" onClick={start} isDisabled={isRunning}>
          Start
        </Button>
        <Button onClick={reset} isDisabled={!isRunning}>
          Reset
        </Button>
        <Button variant="outline" size="sm" onClick={toggleMode} isDisabled={isRunning}>
          Switch to {mode === "work" ? "Break" : "Work"}
        </Button>
      </HStack>

      {/* Achievements */}
      {!statsLoading && stats.achievements && stats.achievements.length > 0 && (
        <Box w="full">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Achievements
          </Text>
          <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2}>
            {stats.achievements.map((a) => (
              <Tooltip key={a.id} label={a.unlocked ? a.desc : "Locked"} placement="top">
                <Box
                  p={2}
                  borderRadius="md"
                  bg={a.unlocked ? "green.50" : "gray.100"}
                  borderWidth="1px"
                  borderColor={a.unlocked ? "green.200" : "gray.200"}
                  textAlign="center"
                  opacity={a.unlocked ? 1 : 0.7}
                >
                  <Text fontSize="lg">{a.unlocked ? "🏆" : "🔒"}</Text>
                  <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                    {a.name}
                  </Text>
                </Box>
              </Tooltip>
            ))}
          </Grid>
        </Box>
      )}
    </VStack>
  );
}

// --- Habit session timer (countdown for "focus on habit" e.g. 5–20 min) ---
function HabitSessionTimer({ onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [preset, setPreset] = useState(5);
  const toast = useToast();

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setIsRunning(false);
          toast({ title: "Habit session done!", status: "success", duration: 3000 });
          onComplete?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, onComplete, toast]);

  const start = () => {
    setSecondsLeft(preset * 60);
    setIsRunning(true);
  };

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;

  return (
    <Box p={3} bg="blackAlpha.50" borderRadius="md">
      <Text fontSize="xs" fontWeight="semibold" color="gray.600" mb={2}>
        Habit focus timer
      </Text>
      <HStack spacing={2} align="center">
        <Select
          size="sm"
          w="24"
          value={preset}
          onChange={(e) => setPreset(Number(e.target.value))}
          isDisabled={isRunning}
        >
          <option value={5}>5 min</option>
          <option value={10}>10 min</option>
          <option value={15}>15 min</option>
          <option value={20}>20 min</option>
        </Select>
        <Text fontFamily="mono" fontSize="lg">
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </Text>
        {!isRunning ? (
          <Button size="sm" colorScheme="teal" onClick={start}>
            Start
          </Button>
        ) : (
          <Button size="sm" onClick={() => setIsRunning(false)}>Stop</Button>
        )}
      </HStack>
    </Box>
  );
}

// --- Habit Tracker (clock, date picker, session timer, progress, frequency) ---
function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [input, setInput] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [heatmapRefresh, setHeatmapRefresh] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const data = await api.habits.list();
      setHabits(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: "Failed to load habits", status: "error" });
      setHabits([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedDateString = new Date(selectedDate + "T12:00:00").toDateString();

  const addHabit = async () => {
    const name = input.trim();
    if (!name) return;
    try {
      const habit = await api.habits.create({ name, frequency });
      setHabits((prev) => [...prev, habit]);
      setInput("");
      setHeatmapRefresh((k) => k + 1);
    } catch (e) {
      toast({ title: e.message || "Failed to add habit", status: "error" });
    }
  };

  const toggleComplete = async (habit) => {
    const done = habit.completedDates && habit.completedDates.includes(selectedDateString);
    if (done) return;
    try {
      const updated = await api.habits.complete(habit.id, selectedDate);
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)));
      setHeatmapRefresh((k) => k + 1);
    } catch (e) {
      toast({ title: "Failed to update", status: "error" });
    }
  };

  const deleteHabit = async (id) => {
    try {
      await api.habits.delete(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setHeatmapRefresh((k) => k + 1);
    } catch (e) {
      toast({ title: "Failed to delete", status: "error" });
    }
  };

  const completedToday = habits.filter((h) => h.completedDates && h.completedDates.includes(selectedDateString)).length;
  const totalHabits = habits.length;
  const progressPct = totalHabits ? (completedToday / totalHabits) * 100 : 0;

  // This week (Mon–Sun) completion count for weekly view
  const getWeekBounds = (d) => {
    const day = new Date(d);
    const dayNum = day.getDay();
    const mon = new Date(day);
    mon.setDate(day.getDate() - (dayNum === 0 ? 6 : dayNum - 1));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return { mon, sun };
  };
  const { mon: weekStart, sun: weekEnd } = getWeekBounds(selectedDate);
  const weekDates = [];
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    weekDates.push(d.toDateString());
  }
  const weeklyDone = habits.filter(
    (h) => h.frequency === "weekly" && h.completedDates && h.completedDates.some((d) => weekDates.includes(d))
  ).length;

  if (loading) return <Text>Loading habits...</Text>;

  return (
    <VStack spacing={4} align="stretch">
      <Box w="full">
        <ActivityHeatmapWidget refreshTrigger={heatmapRefresh} />
      </Box>
      <LiveClock />
      <HabitSessionTimer onComplete={load} />

      <FormControl>
        <FormLabel fontSize="sm">View / log for date</FormLabel>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          size="sm"
          max={new Date().toISOString().slice(0, 10)}
        />
      </FormControl>

      <Box>
        <Text fontSize="sm" fontWeight="semibold" mb={1}>
          Today&apos;s progress
        </Text>
        <Progress value={progressPct} colorScheme="teal" size="sm" borderRadius="full" />
        <Text fontSize="xs" color="gray.500" mt={1}>
          {completedToday} of {totalHabits} habits done
          {habits.some((h) => h.frequency === "weekly") && ` · ${weeklyDone} weekly done this week`}
        </Text>
      </Box>

      <Heading size="sm">Habits</Heading>
      <HStack align="flex-end" flexWrap="wrap" gap={2}>
        <Input
          placeholder="New habit"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          size="sm"
          flex="1"
          minW="120px"
        />
        <Select size="sm" w="24" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </Select>
        <IconButton aria-label="Add habit" icon={<AddIcon />} colorScheme="teal" size="sm" onClick={addHabit} />
      </HStack>

      <List spacing={2}>
        {habits.map((h) => {
          const done = h.completedDates && h.completedDates.includes(selectedDateString);
          return (
            <ListItem key={h.id} display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Checkbox isChecked={done} onChange={() => toggleComplete(h)} colorScheme="teal" />
              <Text flex={1} as={done ? "s" : undefined} color={done ? "gray.500" : undefined} noOfLines={1}>
                {h.name}
              </Text>
              <Wrap spacing={1}>
                {h.streak > 0 && (
                  <WrapItem>
                    <Badge colorScheme="orange" fontSize="xs">
                      {h.streak}d
                    </Badge>
                  </WrapItem>
                )}
                <WrapItem>
                  <Badge colorScheme="gray" fontSize="xs">
                    {h.frequency === "weekly" ? "Weekly" : "Daily"}
                  </Badge>
                </WrapItem>
              </Wrap>
              <IconButton
                aria-label="Delete"
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => deleteHabit(h.id)}
              />
            </ListItem>
          );
        })}
      </List>
    </VStack>
  );
}

// --- Task list (due date, priority, notes, category, estimated time, filters) ---
const PRIORITY_COLOR = { high: "red", medium: "orange", low: "gray" };
const CATEGORIES = ["", "Work", "Personal", "Errands", "Health", "Learning", "Other"];

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [heatmapRefresh, setHeatmapRefresh] = useState(0);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("due"); // due | priority | created
  const [expandedId, setExpandedId] = useState(null);
  const toast = useToast();

  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("");
  const [newEstimated, setNewEstimated] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.tasks.list();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: "Failed to load tasks", status: "error" });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async () => {
    const title = input.trim();
    if (!title) return;
    try {
      const task = await api.tasks.create({
        title,
        dueDate: newDueDate || null,
        priority: newPriority,
        category: newCategory || "",
        estimatedMinutes: newEstimated ? Number(newEstimated) : null,
      });
      setTasks((prev) => [...prev, task]);
      setInput("");
      setNewDueDate("");
      setNewPriority("medium");
      setNewCategory("");
      setNewEstimated("");
      setShowAddForm(false);
      setHeatmapRefresh((k) => k + 1);
    } catch (e) {
      toast({ title: e.message || "Failed to add task", status: "error" });
    }
  };

  const toggleTask = async (task) => {
    try {
      const updated = await api.tasks.update(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      setHeatmapRefresh((k) => k + 1);
    } catch (e) {
      toast({ title: "Failed to update", status: "error" });
    }
  };

  const updateTask = async (task, updates) => {
    try {
      const updated = await api.tasks.update(task.id, updates);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (updates.completed !== undefined) setHeatmapRefresh((k) => k + 1);
    } catch (e) {
      toast({ title: "Failed to update", status: "error" });
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.tasks.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setHeatmapRefresh((k) => k + 1);
    } catch (e) {
      toast({ title: "Failed to delete", status: "error" });
    }
  };

  let filtered = tasks.filter((t) => {
    if (filterPriority && (t.priority || "medium") !== filterPriority) return false;
    if (filterCategory && (t.category || "") !== filterCategory) return false;
    return true;
  });

  const sortTasks = (a, b) => {
    if (sortBy === "due") {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
      return da - db;
    }
    if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };
  filtered = [...filtered].sort(sortTasks);

  const overdueCount = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;

  if (loading) return <Text>Loading tasks...</Text>;

  return (
    <VStack spacing={4} align="stretch">
      <Box w="full">
        <ActivityHeatmapWidget refreshTrigger={heatmapRefresh} />
      </Box>
      <Heading size="md">Tasks</Heading>
      <Text fontSize="sm" color="gray.600">
        One-off to-dos with due date, priority & notes. Different from habits (recurring).
      </Text>

      {overdueCount > 0 && (
        <Badge colorScheme="red" w="fit-content">
          {overdueCount} overdue
        </Badge>
      )}

      <HStack>
        <Input
          placeholder="New task title"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !showAddForm && addTask()}
          size="sm"
          flex={1}
        />
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Less" : "Options"}
        </Button>
        <IconButton aria-label="Add task" icon={<AddIcon />} colorScheme="blue" size="sm" onClick={addTask} />
      </HStack>

      <Collapse in={showAddForm}>
        <SimpleGrid columns={2} spacing={2} p={3} bg="gray.50" borderRadius="md">
          <FormControl size="sm">
            <FormLabel fontSize="xs">Due date</FormLabel>
            <Input type="date" size="sm" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
          </FormControl>
          <FormControl size="sm">
            <FormLabel fontSize="xs">Priority</FormLabel>
            <Select size="sm" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </FormControl>
          <FormControl size="sm">
            <FormLabel fontSize="xs">Category</FormLabel>
            <Input
              size="sm"
              placeholder="e.g. Work, Personal, Errands"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              list="task-category-list"
            />
            <datalist id="task-category-list">
              {CATEGORIES.filter(Boolean).map((c) => (
                <option key={c} value={c} />
              ))}
              {[...new Set(tasks.map((t) => t.category).filter(Boolean))].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormControl>
          <FormControl size="sm">
            <FormLabel fontSize="xs">Est. minutes</FormLabel>
            <Input
              type="number"
              size="sm"
              placeholder="e.g. 30"
              value={newEstimated}
              onChange={(e) => setNewEstimated(e.target.value)}
            />
          </FormControl>
        </SimpleGrid>
      </Collapse>

      <HStack flexWrap="wrap" gap={2}>
        <Select size="sm" w="28" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="due">Sort: Due</option>
          <option value="priority">Sort: Priority</option>
          <option value="created">Sort: Newest</option>
        </Select>
        <Select size="sm" w="24" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select size="sm" w="24" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          {[...new Set(tasks.map((t) => t.category).filter((c) => c && !CATEGORIES.includes(c)))].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </HStack>

      <List spacing={2}>
        {filtered.map((t) => {
          const priority = t.priority || "medium";
          const isExpanded = expandedId === t.id;
          return (
            <ListItem key={t.id}>
              <Box borderWidth="1px" borderRadius="md" p={2}>
                <HStack align="center" gap={2}>
                  <Checkbox isChecked={t.completed} onChange={() => toggleTask(t)} colorScheme="blue" />
                  <VStack align="stretch" flex={1} spacing={0}>
                    <HStack justify="space-between" flexWrap="wrap">
                      <Text
                        as={t.completed ? "s" : undefined}
                        color={t.completed ? "gray.500" : undefined}
                        noOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <HStack spacing={1}>
                        {t.dueDate && (
                          <Badge fontSize="xs" colorScheme={new Date(t.dueDate) < new Date() && !t.completed ? "red" : "blue"}>
                            {new Date(t.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                        <Badge colorScheme={PRIORITY_COLOR[priority]} fontSize="xs">
                          {priority}
                        </Badge>
                        {t.category && (
                          <Badge colorScheme="purple" fontSize="xs">
                            {t.category}
                          </Badge>
                        )}
                        {t.estimatedMinutes != null && (
                          <Text fontSize="xs" color="gray.500">
                            ~{t.estimatedMinutes}m
                          </Text>
                        )}
                      </HStack>
                    </HStack>
                  </VStack>
                  <IconButton
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  />
                  <IconButton
                    aria-label="Delete"
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => deleteTask(t.id)}
                  />
                </HStack>
                <Collapse in={isExpanded}>
                  <Box pt={2} pl={8} borderTopWidth="1px" mt={2}>
                    <FormControl size="sm" mb={2}>
                      <FormLabel fontSize="xs">Due date</FormLabel>
                      <Input
                        type="date"
                        size="sm"
                        value={t.dueDate ? t.dueDate.slice(0, 10) : ""}
                        onChange={(e) => updateTask(t, { dueDate: e.target.value || null })}
                      />
                    </FormControl>
                    <FormControl size="sm" mb={2}>
                      <FormLabel fontSize="xs">Priority</FormLabel>
                      <Select
                        size="sm"
                        value={priority}
                        onChange={(e) => updateTask(t, { priority: e.target.value })}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </Select>
                    </FormControl>
                    <FormControl size="sm" mb={2}>
                      <FormLabel fontSize="xs">Category</FormLabel>
                      <Input
                        size="sm"
                        placeholder="e.g. Work, Personal"
                        value={t.category || ""}
                        onChange={(e) => updateTask(t, { category: e.target.value })}
                        list="task-category-edit-list"
                      />
                      <datalist id="task-category-edit-list">
                        {CATEGORIES.filter(Boolean).concat([...new Set(tasks.map((x) => x.category).filter(Boolean))]).filter((v, i, a) => a.indexOf(v) === i).map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </FormControl>
                    <FormControl size="sm" mb={2}>
                      <FormLabel fontSize="xs">Notes</FormLabel>
                      <Textarea
                        size="sm"
                        placeholder="Notes..."
                        value={t.notes || ""}
                        onChange={(e) => updateTask(t, { notes: e.target.value })}
                        rows={2}
                      />
                    </FormControl>
                  </Box>
                </Collapse>
              </Box>
            </ListItem>
          );
        })}
      </List>
    </VStack>
  );
}

export default function Home() {
  const [tabIndex, setTabIndex] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const bg = useColorModeValue("gray.50", "gray.900");
  const panelBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_STORAGE_KEY) !== "true") {
        const t = setTimeout(() => setTourOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch (_) {}
  }, []);

  const handleTourClose = () => {
    setTourOpen(false);
    setTourStep(0);
  };

  return (
    <>
      <Head>
        <title>Productivity Superapp · Habits · Pomodoro · Tasks</title>
        <meta name="description" content="All-in-one productivity: habits, Pomodoro, tasks, notes, calendar heatmap" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TourOverlay
        isOpen={tourOpen}
        onClose={handleTourClose}
        steps={TOUR_STEPS}
        stepIndex={tourStep}
        setStepIndex={setTourStep}
        setTabIndex={setTabIndex}
        currentTabIndex={tabIndex}
      />
      <Flex direction="column" minH="100vh" bg={bg} overflow="hidden">
        <Box flexShrink={0} py={{ base: 3, md: 4 }} px={{ base: 2, md: 4 }} borderBottomWidth="1px" bg={panelBg}>
          <Container maxW="4xl" px={{ base: 2, sm: 4 }}>
            <Flex position="relative" align="center" w="full" minH="10">
              <Box flex="1" minW={0} />
              <Box flex="1" minW={0} display="flex" justifyContent="center" alignItems="center" position="absolute" left={0} right={0} top={0} bottom={0} pointerEvents="none" px={2}>
                <Heading size={{ base: "sm", sm: "md" }} textAlign="center" noOfLines={1}>
                  Productivity Superapp
                </Heading>
              </Box>
              <Flex flex="1" minW={0} justify="flex-end" align="center" position="relative" zIndex={1}>
                <Tooltip label="How it works (tour)">
                  <IconButton
                    aria-label="Start tour"
                    icon={<QuestionIcon />}
                    size="sm"
                    variant="ghost"
                    flexShrink={0}
                    onClick={() => { setTourStep(0); setTourOpen(true); }}
                  />
                </Tooltip>
              </Flex>
            </Flex>
            <Text fontSize="xs" textAlign="center" color="gray.500" mt={1}>
              Habits · Pomodoro · Tasks · Notes
            </Text>
          </Container>
        </Box>
        <Box flex="1" overflow="auto" py={{ base: 3, md: 4 }} px={{ base: 2, md: 4 }} minW={0}>
          <Container maxW="4xl" pb={8} px={{ base: 2, sm: 4 }}>
            <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="teal" variant="soft-rounded" isLazy>
              <TabList flexWrap="wrap" gap={2} mb={4} minW={0}>
                <Tab fontSize="sm" py={2} data-tour="dashboard-tab">Dashboard</Tab>
                <Tab fontSize="sm" py={2} data-tour="habits-tab">Habits</Tab>
                <Tab fontSize="sm" py={2} data-tour="pomodoro-tab">Pomodoro</Tab>
                <Tab fontSize="sm" py={2} data-tour="tasks-tab">Tasks</Tab>
                <Tab fontSize="sm" py={2} data-tour="notes-tab">Notes</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0}>
                  <Dashboard onTabChange={setTabIndex} />
                </TabPanel>
                <TabPanel px={0}>
                  <HabitTracker />
                </TabPanel>
                <TabPanel px={0}>
                  <PomodoroTimer />
                </TabPanel>
                <TabPanel px={0}>
                  <TaskList />
                </TabPanel>
                <TabPanel px={0}>
                  <NotesTab />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Container>
        </Box>
      </Flex>
    </>
  );
}