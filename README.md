# 📘 Student Task Manager (Full Stack)

A clean, responsive, and fully functional full-stack task manager built for students to organize assignments, lab records, exams, and project work. This project demonstrates real-world full-stack development using Node.js + Express on the backend and HTML/CSS/JavaScript on the frontend.

---

## 🚀 Live Features

- Add tasks with title, subject, due date, and priority  
- View tasks in a clean, sortable table layout  
- Mark tasks as Pending or Completed  
- Edit and Delete tasks from the table  
- Filter tasks by All / Pending / Completed  
- Live search by title or subject  
- Real-time task statistics:
  - Total tasks
  - Pending tasks
  - Completed tasks  
- Persistent data stored in `data/tasks.json` (survives server restarts)

---

## 🛠️ Tech Stack

Frontend
- HTML
- CSS
- Vanilla JavaScript (Fetch API)

Backend
- Node.js
- Express.js

Storage
- File-based JSON persistence (`data/tasks.json`)

Tools
- VS Code
- npm

---

## ⚙️ API Endpoints

Base URL: http://localhost:3000 (or the port set in your environment)

- GET /api/tasks  
  Get all tasks  
  Response: JSON array of task objects

- POST /api/tasks  
  Create a new task  
  Expected JSON body:
  ```json
  {
    "title": "DBMS Record",
    "subject": "DBMS",
    "dueDate": "2025-12-01",
    "priority": "High"
  }
  ```

- PATCH /api/tasks/:id  
  Update a specific task (partial updates allowed)  
  Example body to mark completed:
  ```json
  {
    "completed": true
  }
  ```

- DELETE /api/tasks/:id  
  Delete a specific task

Task object example:
```json
{
  "id": "uuid-or-number",
  "title": "Example Task",
  "subject": "Subject",
  "dueDate": "YYYY-MM-DD",
  "priority": "Low|Medium|High",
  "completed": false,
  "createdAt": "2025-11-29T12:34:56.789Z"
}
```

---

## 🔧 Getting Started (Development)

1. Clone the repo
   ```bash
   git clone https://github.com/kishore0000123/Student-Task-Manager.git
   cd Student-Task-Manager
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the server
   ```bash
   npm start
   ```
   The app typically serves files from `public/` and exposes API routes under `/api/tasks`. Open `http://localhost:3000` in your browser (adjust port if needed).

---

## ✅ What This Project Demonstrates

- Designing a RESTful API using Express (GET/POST/PATCH/DELETE)  
- Handling and validating JSON requests  
- Building a dynamic frontend with vanilla JavaScript (no frameworks)  
- DOM manipulation to render tables, stats, filters, and search  
- Maintaining client-side state (allTasks, filter mode, search query)  
- File-based persistence with `fs.promises` in Node.js  
- Clean folder structure and modular design  
- Responsive, modern UI styling with CSS

---

## ✨ Notes & Tips

- The app uses a file `data/tasks.json` for persistence. Make sure the `data/` directory is writable by the server process.
- Consider switching to a database (SQLite, Postgres, MongoDB) for production or multi-user scenarios.
- Add validation and rate-limiting on the backend for extra robustness.

---
