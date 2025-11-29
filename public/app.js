const API_URL = "/api/tasks";

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
async function getTasks() {
  const res = await fetch(API_URL);
  return res.json();
}

async function createTask(task) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  return res.json();
}

async function updateTask(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function deleteTask(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
}
function updateStats(tasks) {
  totalCount.textContent = tasks.length;
  completedCount.textContent = tasks.filter(t => t.completed).length;
  pendingCount.textContent = tasks.filter(t => !t.completed).length;
}

function render(tasks) {
  const filtered =
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
      <td>
        <input type="checkbox" ${task.completed ? "checked" : ""} />
      </td>
      <td>
        <button class="delete-btn">Delete</button>
      </td>
    `;
    tr.querySelector("input").addEventListener("change", () => {
      updateTask(task.id, { completed: !task.completed });
      load();
    });

    tr.querySelector(".delete-btn").addEventListener("click", () => {
      deleteTask(task.id);
      load();
    });

    tableBody.appendChild(tr);
  });
}

async function load() {
  const tasks = await getTasks();
  render(tasks);
}

addBtn.addEventListener("click", async () => {
  if (!titleInput.value.trim()) {
    alert("Enter a task title");
    return;
  }

  await createTask({
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

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    load();
  });
});
load();