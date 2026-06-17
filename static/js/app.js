// static/js/app.js

document.addEventListener('DOMContentLoaded', () => {

  // ── Element refs ────────────────────────────────────────────
  const refreshBtn   = document.getElementById('refreshBtn');
  const exportBtn    = document.getElementById('exportBtn');
  const spinner      = document.getElementById('spinner');
  const notesList    = document.getElementById('notesList');
  const themeToggle  = document.getElementById('themeToggle');
  const searchInput  = document.getElementById('searchInput');
  const noteCount    = document.getElementById('noteCount');
  const lastFetched  = document.getElementById('lastFetched');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const toastEl      = document.getElementById('toast');

  let currentNotes   = [];
  let toastTimer     = null;

  // ── Theme ───────────────────────────────────────────────────
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isLight = savedTheme === 'light' || (savedTheme === null && !prefersDark);
  document.body.classList.toggle('light-mode', isLight);
  themeToggle.checked = isLight;

  themeToggle.addEventListener('change', e => {
    const light = e.target.checked;
    document.body.classList.toggle('light-mode', light);
    localStorage.setItem('theme', light ? 'light' : 'dark');
  });

  // ── Toast helper ─────────────────────────────────────────────
  function showToast(msg, duration = 2200) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
  }

  // ── Relative time helper ─────────────────────────────────────
  function relativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)   return 'just now';
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30)  return `${d}d ago`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo ago`;
    return `${Math.floor(mo / 12)}y ago`;
  }

  // ── Skeleton loader ──────────────────────────────────────────
  function showSkeletons(n = 6) {
    notesList.innerHTML = Array.from({ length: n }, () => `
      <li class="skeleton" aria-hidden="true">
        <div class="skeleton-title"></div>
        <div class="skeleton-sub"></div>
      </li>`).join('');
  }

  // ── Modal ────────────────────────────────────────────────────
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modalTitle');
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle"></h2>
        <button class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body" id="modalBody"></div>
      <div class="modal-actions">
        <button class="tweet-btn" id="tweetBtn">🐦 Tweet this</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const closeBtn   = modal.querySelector('.close-btn');
  const modalTitle = modal.querySelector('#modalTitle');
  const modalBody  = modal.querySelector('#modalBody');
  const tweetBtn   = modal.querySelector('#tweetBtn');

  function openModal(note) {
    modalTitle.textContent = note.title;
    // Sanitise: parse as HTML but only extract text content for summary
    const parser = new DOMParser();
    const parsed = parser.parseFromString(note.summary || '', 'text/html');
    const safeSummary = parsed.body.innerHTML; // keeps safe HTML from feed
    modalBody.innerHTML = `
      <p class="note-updated"><strong>Updated:</strong> ${new Date(note.updated).toLocaleString()}</p>
      <div>${safeSummary}</div>
      <p><a href="${note.link}" target="_blank" rel="noopener noreferrer">Read full release note →</a></p>`;
    tweetBtn.onclick = () => {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(note.title + ' ' + note.link)}`;
      window.open(url, '_blank');
    };
    modal.classList.add('show');
    closeBtn.focus();
  }

  function closeModal() { modal.classList.remove('show'); }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Escape key closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });

  // ── Render filtered list ─────────────────────────────────────
  function renderList(notes) {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = query
      ? notes.filter(n =>
          n.title.toLowerCase().includes(query) ||
          (n.summary || '').toLowerCase().includes(query))
      : notes;

    // Update count
    const total = notes.length;
    noteCount.textContent = query
      ? `${filtered.length} of ${total} notes`
      : `${total} note${total !== 1 ? 's' : ''}`;

    // Update page title
    document.title = `BigQuery Release Notes (${total})`;

    if (!filtered.length) {
      notesList.innerHTML = `
        <li class="state-msg">
          <div class="state-icon">${query ? '🔍' : '📭'}</div>
          <p>${query ? 'No notes match your search.' : 'No release notes found.'}</p>
          ${query ? `<button class="retry-btn" id="clearSearch">Clear search</button>` : ''}
        </li>`;
      document.getElementById('clearSearch')?.addEventListener('click', () => {
        searchInput.value = '';
        renderList(currentNotes);
      });
      return;
    }

    notesList.innerHTML = '';
    filtered.forEach(note => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="note-info">
          <div class="note-title">${note.title}</div>
          <div class="note-updated">${relativeTime(note.updated)}</div>
        </div>
        <button class="copy-btn" title="Copy title and link">Copy</button>`;

      li.addEventListener('click', () => openModal(note));

      const copyBtn = li.querySelector('.copy-btn');
      copyBtn.addEventListener('click', async e => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(`${note.title}\n${note.link}`);
          copyBtn.textContent = '✓ Copied';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch {
          showToast('⚠️ Could not copy to clipboard.');
        }
      });

      notesList.appendChild(li);
    });
  }

  // ── Load notes ───────────────────────────────────────────────
  async function loadNotes(isRefresh = false) {
    spinner.classList.remove('hidden');
    refreshBtn.disabled = true;
    if (!isRefresh) showSkeletons();

    try {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const notes = await res.json();
      currentNotes = notes;

      exportBtn.disabled = notes.length === 0;
      exportBtn.title = notes.length === 0 ? 'No notes to export' : 'Export all notes as CSV';

      const now = new Date();
      lastFetched.textContent = `Last updated: ${now.toLocaleTimeString()}`;

      renderList(notes);

      if (isRefresh) showToast('✅ Notes refreshed!');
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      notesList.innerHTML = `
        <li class="state-msg">
          <div class="state-icon">⚠️</div>
          <p><strong>Could not load release notes.</strong></p>
          <p>Check your network connection and try again.</p>
          <button class="retry-btn" id="retryBtn">Retry</button>
        </li>`;
      document.getElementById('retryBtn')?.addEventListener('click', () => loadNotes());
      showToast('❌ Failed to load notes.');
    } finally {
      spinner.classList.add('hidden');
      refreshBtn.disabled = false;
    }
  }

  // ── Search (debounced) ───────────────────────────────────────
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderList(currentNotes), 250);
  });

  // ── Export CSV ───────────────────────────────────────────────
  exportBtn.addEventListener('click', () => {
    if (!currentNotes.length) return;
    const escape = s => `"${(s || '').replace(/"/g, '""')}"`;
    const header = ['Title', 'Link', 'Updated', 'Summary'];
    const rows   = currentNotes.map(n => [
      escape(n.title), escape(n.link), escape(n.updated), escape(n.summary)
    ].join(','));
    const csv  = [header.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: 'bigquery_release_notes.csv'
    });
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 CSV downloaded!');
  });

  // ── Refresh button ───────────────────────────────────────────
  refreshBtn.addEventListener('click', () => loadNotes(true));

  // ── Scroll-to-top ────────────────────────────────────────────
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
  });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ── Initial load ─────────────────────────────────────────────
  loadNotes();
});
