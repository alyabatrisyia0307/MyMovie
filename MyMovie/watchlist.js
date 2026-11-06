const $ = (id) => document.getElementById(id);
let editId = null;

// 1. READ (the data)
function loadList() {
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  renderList(list);
  renderSummary(list);
}

function renderList(list) {
  const container = $('listContainer');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div class="empty">Your watchlist is empty. Go search some movies!</div>';
    return;
  }

  list.forEach(movie => {
    // SAFETY CHECK: Ensure required data exists, otherwise skip the movie
    if (!movie.title || !movie.id) return; 

    const div = document.createElement('div');
    div.className = 'movie-item';
    
    // Prevent errors if runtime or rating is missing
    const runtime = movie.runtime || 0;
    const rating = movie.rating || 0;
    const watchCount = movie.watchCount || 1;
    const year = movie.year || 'N/A';
    
    const totalMins = runtime * watchCount;
    
    const isWatched = movie.watched === true;
    const statusBtnText = isWatched ? '✅ Watched' : '⏳ Not Watched';
    const statusBtnColor = isWatched ? '#8ff0a4' : '#ffd369';

    div.innerHTML = `
      <div class="info">
        <h4>${movie.title} (${year})</h4>
        <p>⭐ Rating: ${parseFloat(rating).toFixed(1)} | ⏱️ Runtime: ${runtime} min</p>
        <p>Watching <strong>${watchCount}×</strong> = ${totalMins} min total</p>
      </div>
      <div class="actions">
        <button class="btn small toggle-watch" data-toggle="${movie.id}" style="background: ${statusBtnColor}; color: #1a1a2e; min-width: 120px; font-weight: bold;">
          ${statusBtnText}
        </button>
        <button class="btn small secondary" data-edit="${movie.id}">Edit</button>
        <button class="btn small danger" data-delete="${movie.id}">Delete</button>
      </div>
    `;
    container.appendChild(div);
  });

  // Event Listeners
  container.querySelectorAll('[data-toggle]').forEach(btn =>
    btn.addEventListener('click', () => toggleWatched(parseInt(btn.dataset.toggle)))
  );
  container.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.edit)))
  );
  container.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => deleteMovie(parseInt(btn.dataset.delete)))
  );
}

// 2. CALCULATION LOGIC ( Watched & Unwatched)
function renderSummary(list) {
  const summary = $('summary');
  
  // Count valid movies only
  const validList = list.filter(m => m.title && m.id);
  const watchedCount = validList.filter(m => m.watched === true).length;
  const unwatchedCount = validList.length - watchedCount;
  
  $('statWatched').textContent = watchedCount;
  $('statUnwatched').textContent = unwatchedCount;

  if (validList.length === 0) {
    summary.textContent = 'No movies in watchlist yet.';
    return;
  }
  
  const totalMovies = validList.length;
  const totalMinutes = validList.reduce((sum, m) => sum + ((m.runtime || 0) * (m.watchCount || 1)), 0);
  const avgRating = (validList.reduce((s, m) => s + (m.rating || 0), 0) / totalMovies).toFixed(2);
  const hours = (totalMinutes / 60).toFixed(1);

  summary.innerHTML = `
    📊 You have <strong>${totalMovies}</strong> movie(s) planned.<br>
    ⏱️ Total watch time: <strong>${totalMinutes} minutes</strong> (≈ ${hours} hours).<br>
    ⭐ Average rating: <strong>${avgRating} / 10</strong>.
  `;
}

// 3. TOGGLE WATCHED
function toggleWatched(id) {
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const idx = list.findIndex(m => m.id === id);
  
  if (idx !== -1) {
    list[idx].watched = !list[idx].watched;
    localStorage.setItem('watchlist', JSON.stringify(list));
    loadList(); 
  }
}

// 4. EDIT MODAL
function openEditModal(id) {
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const movie = list.find(m => m.id === id);
  if (!movie) return;

  editId = id;
  $('editTitle').value = movie.title;
  $('editCount').value = movie.watchCount || 1;
  $('editRating').value = movie.rating || 0;
  $('editWatched').checked = movie.watched === true;
  
  $('editModal').classList.remove('hidden');
}

$('cancelEditBtn').addEventListener('click', () => {
  $('editModal').classList.add('hidden');
  editId = null;
});

$('saveEditBtn').addEventListener('click', () => {
  
  const watchCount = parseInt($('editCount').value);
  const rating = parseFloat($('editRating').value);
  const watched = $('editWatched').checked;

  // Validation (remove check for title)
  if (!watchCount || watchCount < 1) return alert('Watch count must be at least 1.');
  if (!rating || rating < 1 || rating > 10) return alert('Rating must be between 1 and 10.');

  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const idx = list.findIndex(m => m.id === editId);
  
  if (idx !== -1) {
    list[idx] = { 
      ...list[idx], 
      watchCount, 
      rating, 
      watched 
    };
    
    localStorage.setItem('watchlist', JSON.stringify(list));
    $('editModal').classList.add('hidden');
    editId = null;
    loadList();
  }
});

// 5. DELETE
function deleteMovie(id) {
  if (!confirm('Are you sure you want to delete this movie?')) return;
  
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const filtered = list.filter(m => m.id !== id);
  
  localStorage.setItem('watchlist', JSON.stringify(filtered));
  loadList();
}

// call the function when page load
loadList();