/* =========================================
   1. Constants & Storage Keys
   ========================================= */
const STORAGE_KEYS = {
  PROBLEMS: 'stuck_problems_v1',
  THEME: 'stuck_theme_v1',
};

/* =========================================
   2. DOM References
   ========================================= */
const elements = {
  form: document.getElementById('problem-form'),
  input: document.getElementById('problem-input'),
  list: document.getElementById('problem-list'),
  emptyState: document.getElementById('empty-state'),
  count: document.getElementById('problem-count'),
  themeToggle: document.getElementById('theme-toggle'),
};

/* =========================================
   3. State & Storage Helpers
   ========================================= */
let problems = loadProblems();

function loadProblems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROBLEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProblems() {
  localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(problems));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/* =========================================
   4. Theme Controller
   ========================================= */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  elements.themeToggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function initTheme() {
  const current = document.documentElement.dataset.theme || 'light';
  applyTheme(current);
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* =========================================
   5. Rendering
   ========================================= */
function createProblemElement(problem) {
  const li = document.createElement('li');
  li.className = 'problem-card';
  li.dataset.id = problem.id;

  const header = document.createElement('div');
  header.className = 'problem-card-header';

  const time = document.createElement('time');
  time.className = 'problem-time';
  time.textContent = formatDate(problem.createdAt);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.title = 'Mark as solved / delete';
  deleteBtn.setAttribute('aria-label', 'Delete problem');
  deleteBtn.textContent = '×';

  const body = document.createElement('p');
  body.className = 'problem-text';
  // Using textContent safely renders math symbols like "<" or ">" without breaking HTML
  body.textContent = problem.text;

  header.append(time, deleteBtn);
  li.append(header, body);
  return li;
}

function render() {
  const total = problems.length;
  elements.count.textContent = `${total} ${total === 1 ? 'problem' : 'problems'} saved`;
  elements.emptyState.classList.toggle('hidden', total > 0);

  elements.list.replaceChildren(...problems.map(createProblemElement));
}

/* =========================================
   6. Actions & Event Listeners
   ========================================= */
function addProblem(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  problems.unshift({
    id: generateId(),
    text: trimmed,
    createdAt: Date.now(),
  });

  saveProblems();
  render();
}

function removeProblem(id) {
  problems = problems.filter((item) => item.id !== id);
  saveProblems();
  render();
}

function bindEvents() {
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    addProblem(elements.input.value);
    elements.input.value = '';
    elements.input.focus();
  });

  elements.input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      elements.form.requestSubmit();
    }
  });

  // Event delegation: one listener handles delete clicks for all cards
  elements.list.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const card = btn.closest('.problem-card');
    if (card) removeProblem(card.dataset.id);
  });

  elements.themeToggle.addEventListener('click', toggleTheme);
}

/* =========================================
   7. App Initialization
   ========================================= */
initTheme();
bindEvents();
render();