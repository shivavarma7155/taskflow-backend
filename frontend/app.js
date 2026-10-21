const API_URL = "http://127.0.0.1:8000/api";
let defaultProjectId = 1;

function getAccessToken() {
  return localStorage.getItem("taskflow_access_token");
}

function updateAuthUI() {
  const token = getAccessToken();
  const loginSection = document.getElementById("login-section");
  const userSection = document.getElementById("user-section");
  const userDisplay = document.getElementById("user-display");

  if (token) {
    loginSection.style.display = "none";
    userSection.style.display = "flex";
    userDisplay.textContent = `Logged in: ${localStorage.getItem("taskflow_username") || "User"}`;
    fetchTasks();
  } else {
    loginSection.style.display = "flex";
    userSection.style.display = "none";
  }
}

async function handleLogin() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      alert("Invalid credentials!");
      return;
    }

    const data = await res.json();
    localStorage.setItem("taskflow_access_token", data.access);
    localStorage.setItem("taskflow_username", username);
    updateAuthUI();
  } catch (err) {
    console.error("Login request failed:", err);
  }
}

function handleLogout() {
  localStorage.removeItem("taskflow_access_token");
  localStorage.removeItem("taskflow_username");
  location.reload();
}

async function fetchTasks() {
  const token = getAccessToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/tasks/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (response.status === 401) {
      handleLogout();
      return;
    }

    const tasks = await response.json();
    renderTasks(tasks);
  } catch (error) {
    console.error("Failed to load tasks:", error);
  }
}

function renderTasks(tasks) {
  const columns = {
    TODO: document.getElementById("list-TODO"),
    IN_PROGRESS: document.getElementById("list-IN_PROGRESS"),
    REVIEW: document.getElementById("list-REVIEW"),
    COMPLETED: document.getElementById("list-COMPLETED")
  };

  const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
  Object.values(columns).forEach(col => (col.innerHTML = ""));

  tasks.forEach(task => {
    if (columns[task.status]) {
      counts[task.status]++;
      const card = document.createElement("div");
      card.className = "task-card";
      card.innerHTML = `
        <h3>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description || "No description provided.")}</p>
        <div class="task-footer">
          <span class="task-priority">${escapeHtml(task.priority)}</span>
          <select class="status-select" onchange="updateTaskStatus(${task.id}, this.value)">
            <option value="TODO" ${task.status === 'TODO' ? 'selected' : ''}>To Do</option>
            <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
            <option value="REVIEW" ${task.status === 'REVIEW' ? 'selected' : ''}>Review</option>
            <option value="COMPLETED" ${task.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      `;
      columns[task.status].appendChild(card);
    }
  });

  Object.keys(counts).forEach(status => {
    const counterEl = document.getElementById(`count-${status}`);
    if (counterEl) counterEl.textContent = counts[status];
  });
}

async function updateTaskStatus(taskId, newStatus) {
  const token = getAccessToken();
  try {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchTasks();
  } catch (err) {
    console.error("Error patching task status:", err);
  }
}

async function handleCreateTask(e) {
  e.preventDefault();
  const token = getAccessToken();
  const title = document.getElementById("task-title").value;
  const description = document.getElementById("task-desc").value;
  const status = document.getElementById("task-status").value;
  const priority = document.getElementById("task-priority").value;

  try {
    const res = await fetch(`${API_URL}/tasks/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        project: defaultProjectId
      })
    });

    if (res.ok) {
      document.getElementById("task-form").reset();
      toggleModal(false);
      fetchTasks();
    }
  } catch (err) {
    console.error("Failed to save task:", err);
  }
}

function toggleModal(show) {
  const modal = document.getElementById("task-modal");
  if (show) modal.classList.remove("hidden");
  else modal.classList.add("hidden");
}

function escapeHtml(string) {
  const div = document.createElement("div");
  div.innerText = string || "";
  return div.innerHTML;
}

// Bind UI events
document.getElementById("login-btn").addEventListener("click", handleLogin);
document.getElementById("logout-btn").addEventListener("click", handleLogout);
document.getElementById("open-modal-btn").addEventListener("click", () => toggleModal(true));
document.getElementById("close-modal-btn").addEventListener("click", () => toggleModal(false));
document.getElementById("task-form").addEventListener("submit", handleCreateTask);

document.addEventListener("DOMContentLoaded", updateAuthUI);