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
  imageInput: document.getElementById('image-input'),
  attachBtn: document.getElementById('attach-btn'),
  imagePreview: document.getElementById('image-preview'),
  previewImg: document.getElementById('preview-img'),
  removeImageBtn: document.getElementById('remove-image-btn'),
  scrollTopBtn: document.getElementById('scroll-top-btn'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importInput: document.getElementById('import-input'),
};

/* =========================================
   3. State & Storage Helpers
   ========================================= */
let problems = loadProblems();
let pendingImage = null; // image waiting to be saved with the next problem
let pendingPins = [];    // notes placed on the pending image

function loadProblems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROBLEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProblems() {
  try {
    localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(problems));
    return true;
  } catch {
    return false; // storage is full
  }
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
   4. Pins (notes on images)
   ========================================= */
function createPinElement(pin, index) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'pin';
  el.style.left = pin.x + '%';
  el.style.top = pin.y + '%';
  el.textContent = index + 1;
  el.dataset.index = index;

  const note = document.createElement('span');
  note.className = 'pin-note';
  note.textContent = pin.note;
  el.append(note);

  return el;
}

function renderPendingPins() {
  elements.imagePreview.querySelectorAll('.pin').forEach((p) => p.remove());
  pendingPins.forEach((pin, i) => elements.imagePreview.append(createPinElement(pin, i)));
}

/* =========================================
   5. Image Helpers
   ========================================= */
// Shrinks the image so it fits in localStorage
function resizeImage(file, maxSize = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // JPEG has no transparency
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };

    img.src = url;
  });
}

async function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  try {
    pendingImage = await resizeImage(file);
    pendingPins = [];
    renderPendingPins();
    elements.previewImg.src = pendingImage;
    elements.imagePreview.classList.remove('hidden');
  } catch {
    alert('Sorry, that image could not be loaded.');
  }
}

function clearPendingImage() {
  pendingImage = null;
  pendingPins = [];
  renderPendingPins();
  elements.previewImg.removeAttribute('src');
  elements.imagePreview.classList.add('hidden');
  elements.imageInput.value = ''; // lets you pick the same file again
}

/* =========================================
   6. Theme Controller
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
   7. Rendering
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

  header.append(time, deleteBtn);
  li.append(header);

  if (problem.text) {
    const body = document.createElement('p');
    body.className = 'problem-text';
    // textContent safely renders symbols like "<" or ">" without breaking HTML
    body.textContent = problem.text;
    li.append(body);
  }

  if (problem.image) {
    const wrap = document.createElement('div');
    wrap.className = 'image-wrap';

    const img = document.createElement('img');
    img.className = 'problem-image';
    img.src = problem.image;
    img.alt = 'Attached image';
    wrap.append(img);

    (problem.pins || []).forEach((pin, i) => wrap.append(createPinElement(pin, i)));
    li.append(wrap);
  }

  return li;
}

function render() {
  const total = problems.length;
  elements.count.textContent = `${total} ${total === 1 ? 'problem' : 'problems'} saved`;
  elements.emptyState.classList.toggle('hidden', total > 0);

  elements.list.replaceChildren(...problems.map(createProblemElement));
}

/* =========================================
   8. Actions
   ========================================= */
function addProblem(text) {
  const trimmed = text.trim();
  if (!trimmed && !pendingImage) return false;

  problems.unshift({
    id: generateId(),
    text: trimmed,
    image: pendingImage,
    pins: pendingImage ? [...pendingPins] : [],
    createdAt: Date.now(),
  });

  if (!saveProblems()) {
    problems.shift(); // undo, nothing was saved
    alert('Storage is full. Delete some old problems or use a smaller image.');
    return false;
  }

  clearPendingImage();
  render();
  return true;
}

function removeProblem(id) {
  problems = problems.filter((item) => item.id !== id);
  saveProblems();
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(problems, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `problems-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  if (!file) return;
  const before = problems;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error('Not a list');

    // Skip problems that already exist (same id)
    const existingIds = new Set(problems.map((p) => p.id));
    const fresh = imported.filter(
      (p) => p && p.id && (p.text || p.image) && !existingIds.has(p.id)
    );

    problems = [...fresh, ...problems].sort((a, b) => b.createdAt - a.createdAt);

    if (!saveProblems()) {
      problems = before; // storage full, undo
      alert('Storage is full. Could not import.');
    } else {
      render();
      alert(`Imported ${fresh.length} new problem(s).`);
    }
  } catch {
    alert('That file is not a valid backup.');
  }

  elements.importInput.value = ''; // lets you pick the same file again
}

/* =========================================
   9. Event Listeners
   ========================================= */
function bindEvents() {
  // Save problem
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (addProblem(elements.input.value)) {
      elements.input.value = '';
    }
    elements.input.focus();
  });

  // Shift + Enter to save
  elements.input.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      elements.form.requestSubmit();
    }
  });

  // Paste a screenshot straight into the textarea
  elements.input.addEventListener('paste', (e) => {
    const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      handleImageFile(file);
    }
  });

  // Cards: tap a pin to show its note, or delete a problem
  elements.list.addEventListener('click', (e) => {
    const pin = e.target.closest('.pin');
    if (pin) {
      pin.classList.toggle('open');
      return;
    }

    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const card = btn.closest('.problem-card');
    if (card) removeProblem(card.dataset.id);
  });

  // Theme
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Images
  elements.attachBtn.addEventListener('click', () => elements.imageInput.click());

  elements.imageInput.addEventListener('change', () => {
    handleImageFile(elements.imageInput.files[0]);
  });

  elements.removeImageBtn.addEventListener('click', clearPendingImage);

  // Click the preview image to drop a note pin
  elements.previewImg.addEventListener('click', (e) => {
    const rect = elements.previewImg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const note = prompt('Write a note for this spot:');
    if (!note || !note.trim()) return;

    pendingPins.push({ x: +x.toFixed(2), y: +y.toFixed(2), note: note.trim() });
    renderPendingPins();
  });

  // Click a pin in the preview to delete it
  elements.imagePreview.addEventListener('click', (e) => {
    const pin = e.target.closest('.pin');
    if (!pin) return;
    if (confirm('Delete this note?')) {
      pendingPins.splice(Number(pin.dataset.index), 1);
      renderPendingPins();
    }
  });

  // Import / Export
  elements.exportBtn.addEventListener('click', exportData);
  elements.importBtn.addEventListener('click', () => elements.importInput.click());
  elements.importInput.addEventListener('change', () => {
    importData(elements.importInput.files[0]);
  });

  // Scroll to top
  window.addEventListener('scroll', () => {
    elements.scrollTopBtn.classList.toggle('show', window.scrollY > 400);
  });

  elements.scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* =========================================
   10. App Initialization
   ========================================= */
initTheme();
bindEvents();
render();
