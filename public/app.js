// --- Globals & State ---
let allTasks = [];
let currentFilter = "all";
let currentUser = JSON.parse(localStorage.getItem("taskProUser")) || null;

// --- DOM Elements ---
const appMain = document.getElementById("appMain");
const authOverlay = document.getElementById("authOverlay");
const authUsernameInput = document.getElementById("authUsername");
const authPasswordInput = document.getElementById("authPassword");
const authPrimaryBtn = document.getElementById("authPrimaryBtn");
const authToggleBtn = document.getElementById("authToggleBtn");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authToggleText = document.getElementById("authToggleText");

const taskTitleInput = document.getElementById("taskTitle");
const taskSubjectInput = document.getElementById("taskSubject");
const taskDueDateInput = document.getElementById("taskDueDate");
const taskPrioritySelect = document.getElementById("taskPriority");
const taskTagsInput = document.getElementById("taskTags");
const addTaskBtn = document.getElementById("addTaskButton");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userNameDisplay = document.getElementById("userNameDisplay");
const toastContainer = document.getElementById("toastContainer");

// --- API Wrapper ---

async function apiRequest(endpoint, method = "GET", body = null) {
    if (!currentUser && !endpoint.includes("/auth/")) return;
    
    const headers = { "Content-Type": "application/json" };
    if (currentUser) headers["x-user-id"] = currentUser.userId;

    try {
        const res = await fetch(endpoint, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "API Error");
        return data;
    } catch (err) {
        showToast(err.message, "danger");
        throw err;
    }
}

// --- Auth Logic ---

let isRegisterMode = false;

authToggleBtn.addEventListener("click", () => {
    isRegisterMode = !isRegisterMode;
    authTitle.textContent = isRegisterMode ? "Create Account" : "Welcome Back";
    authSubtitle.textContent = isRegisterMode ? "Join the community today." : "Please login to manage your student life.";
    authPrimaryBtn.textContent = isRegisterMode ? "Sign Up" : "Login";
    authToggleText.textContent = isRegisterMode ? "Already have an account?" : "Don't have an account?";
    authToggleBtn.textContent = isRegisterMode ? "Login" : "Sign Up";
    
    // Clear inputs when toggling
    authUsernameInput.value = "";
    authPasswordInput.value = "";
});

authPrimaryBtn.addEventListener("click", async () => {
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value.trim();
    if (!username || !password) return showToast("Please fill all fields", "warning");

    toggleLoading(authPrimaryBtn, true);
    const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
    try {
        const data = await apiRequest(endpoint, "POST", { username, password });
        if (data.userId) {
            currentUser = { userId: data.userId, username: data.username || username };
            localStorage.setItem("taskProUser", JSON.stringify(currentUser));
            showToast(isRegisterMode ? "Account created!" : "Welcome back!", "success");
            initApp();
        }
    } catch (err) { /* Toast handled in apiRequest */ }
    finally { toggleLoading(authPrimaryBtn, false); }
});

logoutBtn.addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("taskProUser");
    location.reload();
});

// --- Dashboard Logic ---

async function fetchTasks() {
    try {
        allTasks = await apiRequest("/api/tasks");
        render();
    } catch (err) {}
}

async function handleAddTask() {
    const title = taskTitleInput.value.trim();
    if (!title) return showToast("Task title is required", "warning");

    toggleLoading(addTaskBtn, true);
    const tags = taskTagsInput.value.split(",").map(t => t.trim()).filter(t => t !== "");

    try {
        await apiRequest("/api/tasks", "POST", {
            title,
            subject: taskSubjectInput.value.trim(),
            dueDate: taskDueDateInput.value,
            priority: taskPrioritySelect.value,
            tags
        });

        taskTitleInput.value = "";
        taskSubjectInput.value = "";
        taskDueDateInput.value = "";
        taskTagsInput.value = "";
        showToast("Task added successfully", "success");
        fetchTasks();
    } finally {
        toggleLoading(addTaskBtn, false);
    }
}

async function toggleTaskStatus(id, completed) {
    await apiRequest(`/api/tasks/${id}`, "PATCH", { completed });
    fetchTasks();
}

async function deleteTask(id) {
    if (confirm("Permanently delete this task?")) {
        await apiRequest(`/api/tasks/${id}`, "DELETE");
        showToast("Task deleted", "info");
        fetchTasks();
    }
}

// --- Utilities ---

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function exportToCSV() {
    const totalToExport = allTasks.length;
    if (totalToExport === 0) return showToast("No tasks to export", "warning");

    const headers = ["Title", "Subject", "Due Date", "Priority", "Status", "Tags"];
    
    // Helper to escape CSV fields (handles commas and quotes)
    const escapeCSV = (str) => {
        if (str === null || str === undefined) return '""';
        const escaped = String(str).replace(/"/g, '""');
        return `"${escaped}"`;
    };

    const rows = allTasks.map(t => [
        escapeCSV(t.title),
        escapeCSV(t.subject),
        escapeCSV(t.dueDate),
        escapeCSV(t.priority),
        escapeCSV(t.completed ? "Done" : "Pending"),
        escapeCSV(t.tags ? t.tags.join("; ") : "")
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `student_tasks_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Successfully exported ${totalToExport} tasks!`, "success");
}

// --- Init & UI ---

function initApp() {
    if (!currentUser) {
        authOverlay.classList.remove("hidden");
        appMain.classList.add("hidden");
    } else {
        authOverlay.classList.add("hidden");
        appMain.classList.remove("hidden");
        userNameDisplay.textContent = currentUser.username;
        
        // Update Initials
        const parts = currentUser.username.split(/[ .@]/);
        const initials = parts.length > 1 
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : parts[0].substring(0, 2).toUpperCase();
        document.getElementById("userInitials").textContent = initials;

        fetchTasks();
    }
}

function toggleLoading(btn, isLoading) {
    if (isLoading) btn.classList.add("btn-loading");
    else btn.classList.remove("btn-loading");
}

function render() {
    // KPI Updates
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    
    document.getElementById("totalCount").textContent = total;
    document.getElementById("pendingCount").textContent = total - completed;
    document.getElementById("completedCount").textContent = completed;
    
    // Update Progress Bar
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById("completionBar").style.width = percent + "%";
    document.getElementById("progressText").textContent = percent + "%";
    
    const now = new Date();
    const nextWeek = new Date(); nextWeek.setDate(now.getDate() + 7);
    document.getElementById("weekCount").textContent = allTasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const d = new Date(t.dueDate);
        return d >= now && d <= nextWeek;
    }).length;

    let filtered = allTasks;
    if (currentFilter === "pending") filtered = filtered.filter(t => !t.completed);
    if (currentFilter === "completed") filtered = filtered.filter(t => t.completed);

    const query = searchInput.value.toLowerCase();
    if (query) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query));
    }

    const sortBy = sortSelect.value;
    filtered.sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "dueSoon") return (!a.dueDate ? 1 : !b.dueDate ? -1 : new Date(a.dueDate) - new Date(b.dueDate));
        if (sortBy === "priority") {
            const levels = { High: 3, Medium: 2, Low: 1 };
            return (levels[b.priority] || 0) - (levels[a.priority] || 0);
        }
    });

    const tbody = document.getElementById("taskTableBody");
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        document.getElementById("emptyState").classList.remove("hidden");
    } else {
        document.getElementById("emptyState").classList.add("hidden");
        filtered.forEach(task => {
            const tr = document.createElement("tr");
            const tagsHtml = (task.tags || []).map(tag => `<span class="badge tag-badge">${tag}</span>`).join("");
            
            tr.innerHTML = `
                <td>${task.title}</td>
                <td>
                    <div style="font-size:0.85rem; color:#94a3b8">${task.subject || "-"}</div>
                    <div style="margin-top:4px">${tagsHtml}</div>
                </td>
                <td>${task.dueDate || "-"}</td>
                <td><span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                <td><input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}></td>
                <td class="actions-col">
                    <button class="action-btn delete-btn" title="Delete">🗑</button>
                </td>
            `;

            tr.querySelector(".task-checkbox").addEventListener("change", (e) => toggleTaskStatus(task.id, e.target.checked));
            tr.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));
            tbody.appendChild(tr);
        });
    }
}

// --- Listeners ---
addTaskBtn.addEventListener("click", handleAddTask);
searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);
exportCsvBtn.addEventListener("click", exportToCSV);

document.querySelectorAll(".filter-button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        render();
    });
});

document.getElementById("clearCompletedBtn").addEventListener("click", async () => {
    if (confirm("Clear all completed tasks?")) {
        await apiRequest("/api/tasks/completed", "DELETE");
        showToast("Completed tasks cleared", "info");
        fetchTasks();
    }
});

initApp();
