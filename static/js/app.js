// static/js/app.js

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshBtn');
  const spinner = document.getElementById('spinner');
  const notesList = document.getElementById('notesList');

  // Modal elements
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle"></h2>
        <button class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body" id="modalBody"></div>
      <button class="tweet-btn" id="tweetBtn">Tweet this</button>
    </div>`;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.close-btn');
  const modalTitle = modal.querySelector('#modalTitle');
  const modalBody = modal.querySelector('#modalBody');
  const tweetBtn = modal.querySelector('#tweetBtn');

  function openModal(note) {
    modalTitle.textContent = note.title;
    modalBody.innerHTML = `
      <p class="note-updated"><strong>Updated:</strong> ${new Date(note.updated).toLocaleString()}</p>
      <p>${note.summary}</p>
      <p><a href="${note.link}" target="_blank" rel="noopener">Read full release note</a></p>`;
    const tweetText = `${note.title} ${note.link}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    tweetBtn.onclick = () => window.open(tweetUrl, '_blank');
    modal.classList.add('show');
  }

  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });

  async function loadNotes() {
    spinner.classList.remove('hidden');
    try {
      const res = await fetch('/api/notes');
      const notes = await res.json();
      notesList.innerHTML = '';
      notes.forEach((note, idx) => {
        const li = document.createElement('li');
        li.dataset.idx = idx;
        li.innerHTML = `
          <div class="note-title">${note.title}</div>
          <div class="note-updated">${new Date(note.updated).toLocaleString()}</div>`;
        li.addEventListener('click', () => openModal(note));
        notesList.appendChild(li);
      });
    } catch (err) {
      console.error('Failed to fetch notes', err);
      notesList.innerHTML = '<li>Error loading notes.</li>';
    } finally {
      spinner.classList.add('hidden');
    }
  }

  refreshBtn.addEventListener('click', loadNotes);
  // Initial load
  loadNotes();
});
