const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data", "tasks.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");

// ---------- FILE STORAGE HELPERS ----------
async function loadFile(file) {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function saveFile(file, data) {
  await fs.mkdir(path.join(__dirname, "data"), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- AUTH & USER ROUTES ----------

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  const users = await loadFile(USERS_FILE);
  if (users.find(u => u.username === username)) return res.status(400).json({ error: "User exists" });

  const newUser = { id: Date.now().toString(), username, password }; // Simple storage for demo
  users.push(newUser);
  await saveFile(USERS_FILE, users);
  res.status(201).json({ success: true, userId: newUser.id });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const users = await loadFile(USERS_FILE);
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ success: true, userId: user.id, username: user.username });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// ---------- TASK ROUTES ----------

// Middleware to check userId header
const authenticate = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

// Fetch user tasks
app.get("/api/tasks", authenticate, async (req, res) => {
  const tasks = await loadFile(DATA_FILE);
  const userTasks = tasks.filter(t => t.userId === req.userId);
  res.json(userTasks);
});

// Add new task
app.post("/api/tasks", authenticate, async (req, res) => {
  const { title, subject, dueDate, priority, tags } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const validPriorities = ["Low", "Medium", "High"];
  const finalPriority = validPriorities.includes(priority) ? priority : "Medium";

  const tasks = await loadFile(DATA_FILE);
  const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => parseInt(t.id) || 0)) + 1 : 1;

  const newTask = {
    id: nextId.toString(),
    userId: req.userId,
    title: title.trim(),
    subject: (subject || "").trim(),
    dueDate: dueDate || "",
    priority: finalPriority,
    tags: tags || [],
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  await saveFile(DATA_FILE, tasks);
  res.status(201).json(newTask);
});

// Update task
app.patch("/api/tasks/:id", authenticate, async (req, res) => {
  const id = req.params.id;
  const tasks = await loadFile(DATA_FILE);
  const index = tasks.findIndex(t => t.id === id && t.userId === req.userId);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = tasks[index];
  Object.assign(task, req.body);

  tasks[index] = task;
  await saveFile(DATA_FILE, tasks);

  res.json(task);
});

// Delete task
app.delete("/api/tasks/:id", authenticate, async (req, res) => {
  const id = req.params.id;
  const tasks = await loadFile(DATA_FILE);
  const index = tasks.findIndex(t => t.id === id && t.userId === req.userId);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const deleted = tasks.splice(index, 1)[0];
  await saveFile(DATA_FILE, tasks);

  res.json(deleted);
});

// Bulk delete completed tasks
app.delete("/api/tasks/completed", authenticate, async (req, res) => {
  const tasks = await loadFile(DATA_FILE);
  const remainingTasks = tasks.filter(t => t.userId !== req.userId || !t.completed);
  const deletedCount = tasks.length - remainingTasks.length;

  await saveFile(DATA_FILE, remainingTasks);
  res.json({ success: true, deletedCount });
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
