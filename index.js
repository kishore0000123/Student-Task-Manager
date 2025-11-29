const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data", "tasks.json");

// ---------- FILE STORAGE HELPERS ----------
async function loadTasks() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function saveTasks(tasks) {
  await fs.mkdir(path.join(__dirname, "data"), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- ROUTES ----------

// Fetch all tasks
app.get("/api/tasks", async (req, res) => {
  const tasks = await loadTasks();
  res.json(tasks);
});

// Add new task
app.post("/api/tasks", async (req, res) => {
  const { title, subject, dueDate, priority } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const tasks = await loadTasks();
  const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

  const newTask = {
    id: nextId,
    title,
    subject: subject || "",
    dueDate: dueDate || "",
    priority: priority || "Medium",
    completed: false
  };

  tasks.push(newTask);
  await saveTasks(tasks);
  res.status(201).json(newTask);
});

// Update task
app.patch("/api/tasks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const tasks = await loadTasks();
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = tasks[index];
  Object.assign(task, req.body);

  tasks[index] = task;
  await saveTasks(tasks);

  res.json(task);
});

// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const tasks = await loadTasks();
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const deleted = tasks.splice(index, 1)[0];
  await saveTasks(tasks);

  res.json(deleted);
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
