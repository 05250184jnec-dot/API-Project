// public/script.js
// Dashboard version. Uses the same API: GET/POST /tasks, PATCH/PUT/DELETE /tasks/:id

console.log('TaskFlow script loaded');

const API_BASE = 'http://localhost:3000';
const RING_CIRCUMFERENCE = 2 * Math.PI * 52; // matches the SVG circle radius

const $ = (id) => document.getElementById(id);
const form = $('add-form');
const input = $('task-input');
const list = $('task-list');
const loading = $('loading');
const emptyState = $('empty-state');
const emptyTitle = $('empty-title');
const emptyText = $('empty-text');
const searchInput = $('search');
const showingEl = $('showing');
const toasts = $('toasts');
const nav = $('nav');

const statTotal = $('stat-total');
const statDone = $('stat-done');
const statLeft = $('stat-left');
const statRate = $('stat-rate');
const ringFill = $('ring-fill');
const ringPercent = $('ring-percent');
const ringCaption = $('ring-caption');
const nextTitle = $('next-title');
const nextHint = $('next-hint');
const nextDoneBtn = $('next-done');
const badgeAll = $('badge-all');
const badgeActive = $('badge-active');
const badgeDone = $('badge-done');
const greetingEl = $('greeting');
const todayEl = $('today');
const footerText = $('footer-text');

let tasks = [];
let currentFilter = 'all';
let searchTerm = '';

// ---------- Header ----------

function setGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  greetingEl.textContent = `${part}!`;
  todayEl.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ---------- Toasts ----------

function toast(text, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`.trim();
  el.textContent = text;
  toasts.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------- HTTP ----------

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let msg = `Something went wrong (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (_) {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---------- Stats & progress ----------

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const left = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  statTotal.textContent = total;
  statDone.textContent = done;
  statLeft.textContent = left;
  statRate.textContent = `${percent}%`;

  ringFill.style.strokeDasharray = RING_CIRCUMFERENCE;
  ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - percent / 100);
  ringPercent.textContent = `${percent}%`;
  ringCaption.textContent = `${done} of ${total} done`;

  badgeAll.textContent = total;
  badgeActive.textContent = left;
  badgeDone.textContent = done;

  footerText.textContent = encouragement(percent, total);
}

function encouragement(percent, total) {
  if (total === 0) return 'Add a task to start your day.';
  if (percent === 100) return 'Everything is done. Well earned!';
  if (percent >= 50) return 'More than halfway there. Keep it up!';
  if (percent > 0) return 'Nice start. One step at a time.';
  return "Let's check off the first one.";
}

function updateNextCard() {
  const nextTask = tasks.find((t) => !t.completed);

  if (!nextTask) {
    nextTitle.textContent = tasks.length === 0 ? 'Nothing queued' : 'All clear!';
    nextHint.textContent =
      tasks.length === 0
        ? 'Add a task to see what is next.'
        : 'You have no active tasks right now.';
    nextDoneBtn.hidden = true;
    nextDoneBtn.onclick = null;
    return;
  }

  nextTitle.textContent = nextTask.title;
  nextHint.textContent = 'Your next task in line.';
  nextDoneBtn.hidden = false;
  nextDoneBtn.onclick = () => setCompleted(nextTask, true);
}

// ---------- Filtering ----------

function visibleTasks() {
  let result = tasks;

  if (currentFilter === 'active') result = result.filter((t) => !t.completed);
  if (currentFilter === 'done') result = result.filter((t) => t.completed);

  if (searchTerm) {
    result = result.filter((t) => t.title.toLowerCase().includes(searchTerm));
  }

  return result;
}

function updateShowingLabel(count) {
  const labels = { all: 'All tasks', active: 'In progress', done: 'Completed' };
  const base = labels[currentFilter];
  showingEl.textContent = searchTerm
    ? `${count} result${count === 1 ? '' : 's'} for "${searchTerm}"`
    : `${base} · ${count} shown`;
}

function updateEmptyState(shown) {
  emptyState.hidden = shown.length > 0;
  if (shown.length > 0) return;

  if (searchTerm) {
    emptyTitle.textContent = 'No matches';
    emptyText.textContent = 'Try a different search term.';
  } else if (tasks.length === 0) {
    emptyTitle.textContent = 'Your list is empty';
    emptyText.textContent = "Add your first task above and let's get moving.";
  } else if (currentFilter === 'done') {
    emptyTitle.textContent = 'Nothing finished yet';
    emptyText.textContent = 'Check off a task and it will show up here.';
  } else {
    emptyTitle.textContent = 'All done!';
    emptyText.textContent = 'Every task is complete. Enjoy the moment.';
  }
}

// ---------- Rendering ----------

function renderTasks() {
  const shown = visibleTasks();
  list.innerHTML = '';

  for (const task of shown) {
    list.appendChild(createTaskItem(task));
  }

  updateStats();
  updateNextCard();
  updateShowingLabel(shown.length);
  updateEmptyState(shown);
}

function createTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!task.completed;
  checkbox.setAttribute('aria-label', 'Mark as completed');
  checkbox.addEventListener('change', () => setCompleted(task, checkbox.checked, checkbox));

  const title = document.createElement('span');
  title.className = 'task-title';
  title.textContent = task.title;
  title.addEventListener('dblclick', () => startEdit(li, task));

  const tag = document.createElement('span');
  tag.className = 'task-tag';
  tag.textContent = task.completed ? 'Done' : 'Active';

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn btn-ghost';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => startEdit(li, task));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteTask(task));

  actions.append(editBtn, deleteBtn);
  li.append(checkbox, title, tag, actions);
  return li;
}

// ---------- Inline editing ----------

function startEdit(li, task) {
  const titleEl = li.querySelector('.task-title');
  if (!titleEl) return;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'task-edit-input';
  editInput.value = task.title;
  editInput.maxLength = 255;

  titleEl.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  let finished = false;

  const finish = async (save) => {
    if (finished) return;
    finished = true;

    const newTitle = editInput.value.trim();
    if (!save || newTitle === '' || newTitle === task.title) {
      if (save && newTitle === '') toast('Title cannot be empty.', 'error');
      renderTasks();
      return;
    }

    try {
      await request(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle, completed: !!task.completed }),
      });
      toast('Task updated', 'success');
      await loadTasks();
    } catch (err) {
      toast(err.message, 'error');
      renderTasks();
    }
  };

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  editInput.addEventListener('blur', () => finish(true));
}

// ---------- API actions ----------

async function loadTasks() {
  loading.hidden = false;
  try {
    tasks = await request('/tasks');
    renderTasks();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    loading.hidden = true;
  }
}

async function addTask(title) {
  try {
    await request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    input.value = '';
    toast('Task added', 'success');
    await loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function setCompleted(task, completed, checkbox = null) {
  try {
    await request(`/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
    if (completed) toast('Nice work!', 'success');
    await loadTasks();
  } catch (err) {
    if (checkbox) checkbox.checked = !checkbox.checked;
    toast(err.message, 'error');
  }
}

async function deleteTask(task) {
  if (!confirm(`Delete "${task.title}"?`)) return;

  try {
    await request(`/tasks/${task.id}`, { method: 'DELETE' });
    toast('Task deleted');
    await loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ---------- Events ----------

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (title === '') {
    toast('Please enter a task first.', 'error');
    input.focus();
    return;
  }
  addTask(title);
});

nav.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (!btn) return;

  currentFilter = btn.dataset.filter;
  nav.querySelectorAll('.nav-item').forEach((b) =>
    b.classList.toggle('active', b === btn)
  );
  renderTasks();
});

searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderTasks();
});

// ---------- Boot ----------

setGreeting();
loadTasks();