// public/script.js
// Talks to the Express + MySQL API using fetch() and async/await.

const API_BASE = 'http://localhost:3000';

const form = document.getElementById('add-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const counter = document.getElementById('counter');
const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');

// ---------- Helpers ----------

function showMessage(text, type = '') {
  message.textContent = text;
  message.className = 'message' + (type ? ` ${type}` : '');
}

function clearMessage() {
  message.textContent = '';
  message.className = 'message';
}

function setLoading(isLoading) {
  loading.hidden = !isLoading;
}

function updateCounter(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  totalCount.textContent = total;
  completedCount.textContent = done;
  counter.hidden = total === 0;
}

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (_) {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---------- Rendering ----------

function renderTasks(tasks) {
  list.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.hidden = false;
    counter.hidden = true;
    return;
  }

  emptyState.hidden = true;
  counter.hidden = false;

  for (const task of tasks) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.completed;
    checkbox.setAttribute('aria-label', 'Mark task as completed');
    checkbox.addEventListener('change', () => toggleTask(task, checkbox));

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-ghost';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editTask(task));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(actions);
    list.appendChild(li);
  }

  updateCounter(tasks);
}

// ---------- API actions ----------

async function loadTasks() {
  setLoading(true);
  try {
    const tasks = await request('/tasks');
    renderTasks(tasks);
    clearMessage();
  } catch (err) {
    showMessage(err.message, 'error');
  } finally {
    setLoading(false);
  }
}

async function addTask(title) {
  try {
    await request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    input.value = '';
    showMessage('Task added.', 'success');
    await loadTasks();
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function toggleTask(task, checkbox) {
  try {
    await request(`/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: checkbox.checked }),
    });
    await loadTasks();
  } catch (err) {
    checkbox.checked = !checkbox.checked; // revert
    showMessage(err.message, 'error');
  }
}

async function editTask(task) {
  const newTitle = prompt('Edit task title:', task.title);
  if (newTitle === null) return; // cancelled

  const trimmed = newTitle.trim();
  if (trimmed === '') {
    showMessage('Title cannot be empty.', 'error');
    return;
  }

  try {
    await request(`/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: trimmed, completed: !!task.completed }),
    });
    showMessage('Task updated.', 'success');
    await loadTasks();
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function deleteTask(task) {
  if (!confirm(`Delete "${task.title}"?`)) return;

  try {
    await request(`/tasks/${task.id}`, { method: 'DELETE' });
    showMessage('Task deleted.', 'success');
    await loadTasks();
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

// ---------- Form submit ----------

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (title === '') {
    showMessage('Please enter a task title.', 'error');
    return;
  }
  addTask(title);
});

// ---------- Boot ----------

loadTasks();