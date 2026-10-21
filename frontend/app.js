const API_URL = "http://127.0.0.1:8000/api";
let defaultProjectId = 1;
let allTasks = [];

function getAccessToken() {
  return localStorage.getItem("taskflow_access_token");
}

function updateAuthUI() {
  const token = getAccessToken();
  const username = localStorage.getItem("taskflow_username") || "shivavarma";
  const userDisplay = document.getElementById("user-display");
  const userEmail = document.getElementById("user-email");

  if (userDisplay) userDisplay.textContent = username;
  if (userEmail) userEmail.textContent = `${username}@taskflow.dev`;

  if (!token) {
    const enteredToken = prompt("Enter your JWT access token from PowerShell (or login):");
    if (enteredToken) {
      localStorage.setItem("taskflow_access_token", enteredToken.trim());
      localStorage.setItem("taskflow_username", "shivavarma");
      location.reload();
    }
  } else {
    fetchTasks();
  }
}

async function fetchTasks() {
  const token = getAccessToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/tasks/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) {
      localStorage.removeItem("taskflow_access_token");
      updateAuthUI();
      return;
    }

    allTasks = await res.json();
    renderBoard(allTasks);
  } catch (err) {
    console.error("Failed to load tasks:", err);
  }
}

function renderBoard(tasks) {
  const columns = {
    TODO: document.getElementById("list-TODO"),
    IN_PROGRESS: document.getElementById("list-IN_PROGRESS"),
    REVIEW: document.getElementById("list-REVIEW"),
    COMPLETED: document.getElementById("list-COMPLETED")
  };

  const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
  Object.values(columns).forEach(col => { if (col) col.innerHTML = ""; });

  tasks.forEach(task => {
    if (columns[task.status]) {
      counts[task.status]++;
      const card = createKanbanCard(task);
      columns[task.status].appendChild(card);
    }
  });

  // Update counters on main columns and sidebar
  Object.keys(counts).forEach(status => {
    const headEl = document.getElementById(`count-${status}`);
    const sideEl = document.getElementById(`side-count-${status}`);
    if (headEl) headEl.textContent = counts[status];
    if (sideEl) sideEl.textContent = counts[status];
  });

  if (window.feather) feather.replace();
}

function createKanbanCard(task) {
  const card = document.createElement("div");
  card.className = "kanban-card";

  // Dynamic tag mapping based on priority/status
  const tagColor = getTagColor(task.priority);
  const progressRatio = getProgressRatio(task.status);

  card.innerHTML = `
    <div class="card-tags">
      <span class="tag-badge ${tagColor}">${escapeHtml(task.priority)}</span>
      <span class="tag-badge blue">Backend</span>
      <span class="card-dots"><i data-feather="more-horizontal"></i></span>
    </div>
    <div class="card-title">${escapeHtml(task.title)}</div>
    <div class="card-desc">${escapeHtml(task.description || "Building core service architecture and schema integration.")}</div>
    <div class="progress-wrap">
      <div class="progress-labels">
        <span>Progress</span>
        <span>${progressRatio.label}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${task.status.toLowerCase()}" style="width: ${progressRatio.pct}"></div>
      </div>
    </div>
    <div class="card-footer">
      <div class="card-members">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee_username || 'Alex'}" />
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${task.created_by_username || 'Dev'}" />
      </div>
      <div class="card-metrics">
        <select class="status-quick-switch" onchange="patchTaskStatus(${task.id}, this.value)">
          <option value="TODO" ${task.status === 'TODO' ? 'selected' : ''}>To Do</option>
          <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
          <option value="REVIEW" ${task.status === 'REVIEW' ? 'selected' : ''}>Review</option>
          <option value="COMPLETED" ${task.status === 'COMPLETED' ? 'selected' : ''}>Complete</option>
        </select>
        <span class="metric-item"><i data-feather="folder"></i> 3</span>
        <span class="metric-item"><i data-feather="message-square"></i> 8</span>
      </div>
    </div>
  `;
  return card;
}

function getTagColor(priority) {
  switch (priority) {
    case 'HIGH':
    case 'URGENT': return 'pink';
    case 'MEDIUM': return 'yellow';
    default: return 'green';
  }
}

function getProgressRatio(status) {
  switch (status) {
    case 'TODO': return { label: '0/4', pct: '5%' };
    case 'IN_PROGRESS': return { label: '2/4', pct: '50%' };
    case 'REVIEW': return { label: '3/4', pct: '75%' };
    case 'COMPLETED': return { label: '4/4', pct: '100%' };
    default: return { label: '0/4', pct: '0%' };
  }
}

async function patchTaskStatus(taskId, newStatus) {
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
    console.error("Status update failed:", err);
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
    console.error("Error creating task:", err);
  }
}

function handleSearch(query) {
  const q = query.toLowerCase();
  const filtered = allTasks.filter(t => 
    t.title.toLowerCase().includes(q) || 
    (t.description && t.description.toLowerCase().includes(q))
  );
  renderBoard(filtered);
}

function openCreateModalWithStatus(status) {
  document.getElementById("task-status").value = status;
  toggleModal(true);
}

function toggleModal(show) {
  const modal = document.getElementById("task-modal");
  if (show) modal.classList.remove("hidden");
  else modal.classList.add("hidden");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.innerText = str || "";
  return div.innerHTML;
}

// Bind Global Listeners
document.getElementById("open-modal-btn").addEventListener("click", () => toggleModal(true));
document.getElementById("close-modal-btn").addEventListener("click", () => toggleModal(false));
document.getElementById("task-form").addEventListener("submit", handleCreateTask);
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});

document.addEventListener("DOMContentLoaded", updateAuthUI);