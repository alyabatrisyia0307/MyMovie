const TMDB_API_KEY = '717e506a5ffb4d6f182a9643bade7b6c'; 
const API_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let currentMovie = null;
const $ = (id) => document.getElementById(id);

window.addEventListener('DOMContentLoaded', () => {
  loadMoviesByCategory('popular', '🔥 Popular Right Now');
});

//  dropdown genre 
$('genreSelect').addEventListener('change', (e) => {
  const genreId = e.target.value;
  if (genreId) {
    const genreName = e.target.options[e.target.selectedIndex].text;
    loadMoviesByCategory('discover', `${genreName} Movies`, genreId);
  } else {
    loadMoviesByCategory('popular', '🔥 Popular Right Now');
  }
});

// 1. LOAD MOVIES (POPULAR / BY GENRE)
async function loadMoviesByCategory(type, titleText, genreId = '') {
  $('gridTitle').textContent = titleText;
  $('movieGrid').innerHTML = '<p>Loading movies...</p>';
  
  let url = '';
  if (type === 'popular') {
    url = `${API_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
  } else {
    url = `${API_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=en-US&page=1`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    // if wrong API , TMDB give status 401
    if (!res.ok) {
      throw new Error(data.status_message || 'API Error');
    }

    renderGrid(data.results.slice(0, 20)); 
  } catch (err) {
    $('movieGrid').innerHTML = `<p style="color:#ff6b6b">Failed to load: ${err.message}</p>`;
  }
}

// 2.  GRID MOVIE
function renderGrid(movies) {
  const grid = $('movieGrid');
  grid.innerHTML = '';

  if (!movies || movies.length === 0) {
    grid.innerHTML = '<p style="color:#aaa">No movies found.</p>';
    return;
  }

  movies.forEach(m => {
    const posterUrl = m.poster_path ? IMG_URL + m.poster_path : 'https://via.placeholder.com/150x225?text=No+Poster';
    
    const div = document.createElement('div');
    div.className = 'grid-item';
    div.innerHTML = `
      <img src="${posterUrl}" alt="${m.title}">
      <div class="grid-info">
        <h4 title="${m.title}">${m.title}</h4>
        <p>⭐ ${m.vote_average ? m.vote_average.toFixed(1) : '0.0'}</p>
      </div>
    `;
    // when user klik movie in grid, fetch detail full
    div.addEventListener('click', () => fetchMovieDetails(m.id));
    grid.appendChild(div);
  });
}

// 3. (SEARCH)
$('searchBtn').addEventListener('click', searchMovie);
$('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchMovie();
});

async function searchMovie() {
  const title = $('searchInput').value.trim();
  if (!title) return showStatus('Please enter a movie title.', 'error');
  
  showStatus('Loading...', '');
  $('resultCard').classList.add('hidden');

  try {
    const res = await fetch(`${API_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.status_message || 'API Error');
    
    if (data.results.length === 0) {
      $('movieGrid').innerHTML = ''; // clear grid
      $('gridTitle').textContent = `Search Results for "${title}"`;
      return showStatus('Movie not found. Try another title.', 'error');
    }

    // change title grid and show all result 
    $('gridTitle').textContent = `Search Results for "${title}"`;
    renderGrid(data.results.slice(0, 20)); 
    
    showStatus(`Found ${data.results.length} results. Click a movie to see details.`, 'success');
    
  } catch (err) {
    showStatus(`Failed: ${err.message}`, 'error');
  }
}

// 4. FETCH FULL DETAIL
async function fetchMovieDetails(movieId) {
  try {
    const detailRes = await fetch(`${API_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    const data = await detailRes.json();
    
    if (!detailRes.ok) throw new Error(data.status_message);
    
    currentMovie = data;
    displayMovie(currentMovie);
    generateSuggestion(currentMovie);
    $('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
  } catch (err) {
    showStatus(`Failed to load details: ${err.message}`, 'error');
  }
}

// 5. SHOW DETAIL
function displayMovie(m) {
  $('resultCard').classList.remove('hidden');
  $('poster').src = m.poster_path ? IMG_URL + m.poster_path : 'https://via.placeholder.com/200x300?text=No+Poster';
  $('movieTitle').textContent = m.title;
  $('movieYear').textContent = m.release_date || 'N/A';
  $('movieRating').textContent = m.vote_average ? m.vote_average.toFixed(1) : '0.0';
  $('movieRuntime').textContent = m.runtime || 'N/A';
  $('moviePlot').textContent = m.overview || 'No overview available.';
  
  $('watchCount').value = 1;
  $('calcResult').textContent = '';
}

// 6. SUGGESTION LOGIC
function generateSuggestion(m) {
  const rating = m.vote_average || 0;
  const runtime = m.runtime || 0;
  const releaseYear = m.release_date ? parseInt(m.release_date.split('-')[0]) : 0;
  
  let suggestion = '', mood = '', runtimeNote = '';

  if (rating >= 8.0) suggestion = '🌟 MUST WATCH! Highly rated by audiences worldwide.';
  else if (rating >= 6.5) suggestion = '👍 Great choice! Generally well-received.';
  else if (rating >= 5.0) suggestion = '🙂 Mixed reviews. Good for a casual watch.';
  else suggestion = '⚠️ Low rating. Watch only if you are a hardcore fan.';

  if (runtime > 150) runtimeNote = ' It\'s a long movie (>2.5 hours) — grab some snacks!';
  else if (runtime > 0 && runtime < 90) runtimeNote = ' Short & sweet. Perfect for a quick watch.';
  else if (runtime > 0) runtimeNote = ' Comfortable length for movie night.';

  if (releaseYear >= 2020) mood = 'Modern blockbuster release.';
  else if (releaseYear >= 2000) mood = 'A modern classic from the 2000s.';
  else if (releaseYear > 0) mood = 'A vintage classic.';

  $('suggestion').innerHTML = `${suggestion}<br>${mood} ${runtimeNote}`;
}

// 7. CALCULATION LOGIC
$('calcBtn').addEventListener('click', () => {
  if (!currentMovie || !currentMovie.runtime) return showStatus('Search a valid movie with runtime first.', 'error');

  const count = parseInt($('watchCount').value);
  if (isNaN(count) || count < 1) {
    $('calcResult').textContent = 'Please enter a valid watch count (1 or more).';
    $('calcResult').style.color = '#ff6b6b';
    return;
  }

  const totalMinutes = currentMovie.runtime * count;
  const hours = (totalMinutes / 60).toFixed(2);
  const days = (totalMinutes / (60 * 24)).toFixed(2);

  $('calcResult').style.color = '#8ff0a4';
  $('calcResult').innerHTML = `Total watch time: <strong>${totalMinutes} minutes</strong> (≈ ${hours} hours / ${days} days)`;
});

// 8. ADD TO WATCHLIST
$('addBtn').addEventListener('click', () => {
  if (!currentMovie) return showStatus('Search a movie first.', 'error');
  
  const watchCount = parseInt($('watchCount').value) || 1;
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');

  const newItem = {
    id: Date.now(),
    tmdbId: currentMovie.id,
    title: currentMovie.title,
    year: currentMovie.release_date ? currentMovie.release_date.split('-')[0] : 'N/A',
    runtime: currentMovie.runtime || 0,
    rating: currentMovie.vote_average || 0,
    poster: currentMovie.poster_path ? IMG_URL + currentMovie.poster_path : '',
    watchCount: watchCount,
    suggestion: $('suggestion').textContent,
    watched: false
  };

  if (list.some(m => m.tmdbId === newItem.tmdbId)) {
    return showStatus('This movie is already in your watchlist.', 'error');
  }

  list.push(newItem);
  localStorage.setItem('watchlist', JSON.stringify(list));
  showStatus(`"${newItem.title}" added to watchlist!`, 'success');
});

function showStatus(msg, type) {
  const el = $('status');
  el.textContent = msg;
  el.className = 'status ' + (type || '');
}