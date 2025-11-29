
// localStorage key
const STORAGE_KEY = "student_tasks";

// read tasks from localStorage
function loadFromLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// save tasks to localStorage
function saveToLocalStorage(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// -------------------------------
// DOM elements
// -------------------------------
let currentFilter = "all";

const titleInput = document.getElementById("taskTitle");
const subjectInput = document.getElementById("taskSubject");
const dueDateInput = document.getElementById("taskDueDate");
const prioritySelect = document.getElementById("taskPriority");
const addBtn = document.getElementById("addTaskButton");

const tableBody = document.getElementById("taskTableBody");
const filterBtns = document.querySelectorAll(".filter-button");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");

// -------------------------------
// CRUD Operations
// -------------------------------

function getTasks() {
  return loadFromLocalStorage();
}

function createTask(task) {
  const tasks = getTasks();
  const nextId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

  const newTask = {
    id: nextId,
    title: task.title.trim(),
    subject: task.subject.trim() || "",
    dueDate: task.dueDate || "",
    priority: task.priority || "Medium",
    completed: false
  };

  tasks.push(newTask);
  saveToLocalStorage(tasks);
}

function updateTask(id, data) {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);

  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...data };
    saveToLocalStorage(tasks);
  }
}

function deleteTask(id) {
  let tasks = getTasks();
  tasks = tasks.filter(t => t.id !== id);
  saveToLocalStorage(tasks);
}

// -------------------------------
// Rendering
// -------------------------------

function updateStats(tasks) {
  totalCount.textContent = tasks.length;
  completedCount.textContent = tasks.filter(t => t.completed).length;
  pendingCount.textContent = tasks.filter(t => !t.completed).length;
}

function render(tasks) {
  let filtered =
    currentFilter === "pending"
      ? tasks.filter(t => !t.completed)
      : currentFilter === "completed"
      ? tasks.filter(t => t.completed)
      : tasks;

  updateStats(tasks);

  tableBody.innerHTML = "";

  filtered.forEach((task, idx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${task.title}</td>
      <td>${task.subject || "-"}</td>
      <td>${task.dueDate || "-"}</td>
      <td>${task.priority}</td>
      <td><input type="checkbox" ${task.completed ? "checked" : ""}/></td>
      <td><button class="delete-btn">Delete</button></td>
    `;

    const checkbox = tr.querySelector("input");
    checkbox.addEventListener("change", () => {
      updateTask(task.id, { completed: checkbox.checked });
      load();
    });

    tr.querySelector(".delete-btn").addEventListener("click", () => {
      deleteTask(task.id);
      load();
    });

    tableBody.appendChild(tr);
  });
}

// -------------------------------
// Load & Initialize
// -------------------------------

function load() {
  const tasks = getTasks();
  render(tasks);
}

// Add Task
addBtn.addEventListener("click", () => {
  if (!titleInput.value.trim()) {
    alert("Enter a task title");
    return;
  }

  createTask({
    title: titleInput.value,
    subject: subjectInput.value,
    dueDate: dueDateInput.value,
    priority: prioritySelect.value
  });

  titleInput.value = "";
  subjectInput.value = "";
  dueDateInput.value = "";
  prioritySelect.value = "Medium";

  load();
});

// Filters
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    load();
  });
});

load();
