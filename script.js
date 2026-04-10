// ================================================
// YouTube Clone — Complete JavaScript
// Clean, modular, error-free
// ================================================

// ===== STATE =====
var allVideos = [];
var allChannels = [];
var allPlaylists = [];
var allComments = [];
var watchHistory = [];
var likedVideos = {};
var dislikedVideos = {};
var currentUser = null;
var userSubscriptions = [];
var selectedVideo = null;
var miniPlayerActive = false;
var isDark = false;
var currentPage = 'home';
var prevPage = 'home';
var musicPlayer = null;
var musicPlaying = false;
var musicQueue = [];
var musicIndex = 0;
var musicShuffle = false;
var musicRepeat = false;
var musicInterval = null;
var isAuthLogin = true;

// ===== HELPERS =====
function $(id) { return document.getElementById(id); }
function $q(sel) { return document.querySelector(sel); }
function $qa(sel) { return document.querySelectorAll(sel); }

function toast(msg) {
  var el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}

function formatSubs(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function parseViews(s) {
  if (!s) return 0;
  var n = parseFloat(s);
  if (s.indexOf('B') !== -1) return n * 1e9;
  if (s.indexOf('M') !== -1) return n * 1e6;
  if (s.indexOf('K') !== -1) return n * 1e3;
  return n || 0;
}

function parseDuration(d) {
  if (!d) return 0;
  var p = d.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0] || 0;
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  var m = Math.floor(s / 60);
  var sec = Math.floor(s % 60).toString().padStart(2, '0');
  return m + ':' + sec;
}

function avatarColor(name) {
  var colors = ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#009688','#4caf50','#ff9800','#795548'];
  var hash = 0;
  for (var i = 0; i < (name||'').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function makeAvatar(name, size) {
  var letter = (name || '?').charAt(0).toUpperCase();
  return '<div class="avatar-letter" style="background:' + avatarColor(name) + ';width:' + size + 'px;height:' + size + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:500;font-size:' + (size * 0.45) + 'px;">' + letter + '</div>';
}

function embedUrl(url, t) {
  var src = url || '';
  if (src.indexOf('?') === -1) src += '?';
  else src += '&';
  src += 'autoplay=1&rel=0&modestbranding=1&enablejsapi=1';
  if (t) src += '&start=' + Math.floor(t);
  return src;
}

// ===== LOAD STATE =====
function loadState() {
  try { likedVideos = JSON.parse(localStorage.getItem('yt_liked') || '{}'); } catch(e) {}
  try { dislikedVideos = JSON.parse(localStorage.getItem('yt_disliked') || '{}'); } catch(e) {}
  try { watchHistory = JSON.parse(localStorage.getItem('yt_history') || '[]'); } catch(e) {}
  try { allPlaylists = JSON.parse(localStorage.getItem('yt_playlists') || '[]'); } catch(e) {}
  try { currentUser = JSON.parse(localStorage.getItem('yt_user')); } catch(e) {}
  if (currentUser) userSubscriptions = currentUser.subscriptions || [];
  isDark = localStorage.getItem('yt_dark') === 'true';
  if (isDark) document.body.classList.add('dark-mode');
  // Ensure Watch Later exists
  if (!allPlaylists.find(function(p) { return p.name === 'Watch Later'; })) {
    allPlaylists.unshift({ id: 9999, name: 'Watch Later', privacy: 'private', videoIds: [] });
    savePlaylists();
  }
}

function saveLiked()    { localStorage.setItem('yt_liked', JSON.stringify(likedVideos)); }
function saveDisliked() { localStorage.setItem('yt_disliked', JSON.stringify(dislikedVideos)); }
function saveHistory()  { localStorage.setItem('yt_history', JSON.stringify(watchHistory)); }
function savePlaylists() { localStorage.setItem('yt_playlists', JSON.stringify(allPlaylists)); }
function saveUser()     { if (currentUser) localStorage.setItem('yt_user', JSON.stringify(currentUser)); }

// ===== FETCH DATA =====
async function fetchData() {
  try {
    var vr = await fetch('/api/videos');
    allVideos = await vr.json();
  } catch(e) { allVideos = []; }
  try {
    var cr = await fetch('/api/channels');
    allChannels = await cr.json();
  } catch(e) { allChannels = []; }
  try {
    var pr = await fetch('/api/playlists');
    var serverPl = await pr.json();
    if (serverPl.length) allPlaylists = serverPl;
  } catch(e) {}
}

// ===== RENDER VIDEO CARD =====
function renderVideoCard(v) {
  var ch = allChannels.find(function(c) { return c.name === v.channel; });
  var card = document.createElement('div');
  card.className = 'video-card';
  card.innerHTML =
    '<div class="video-thumb-wrap">' +
      '<img src="' + v.thumbnail + '" alt="' + v.title + '" loading="lazy">' +
      '<span class="video-duration">' + v.duration + '</span>' +
    '</div>' +
    '<div class="video-meta">' +
      '<div class="video-meta-avatar">' + makeAvatar(v.channel, 36) + '</div>' +
      '<div class="video-meta-info">' +
        '<div class="video-meta-title">' + v.title + '</div>' +
        '<div class="video-meta-channel">' + v.channel + '</div>' +
        '<div class="video-meta-stats">' + (v.views || '') + ' views · ' + (v.uploadedAt || '') + '</div>' +
      '</div>' +
    '</div>';
  card.addEventListener('click', function() { openWatch(v); });
  return card;
}

// ===== HOME PAGE =====
function renderHome(filter) {
  var grid = $('videoGrid');
  var chips = $('chipsBar');
  if (!grid) return;

  // Chips
  var categories = ['All', 'Entertainment', 'Programming', 'Science', 'Sports', 'Cooking', 'Music', 'Travel', 'Fitness'];
  chips.innerHTML = '';
  categories.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.className = 'chip' + ((!filter && cat === 'All') || filter === cat ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', function() {
      renderHome(cat === 'All' ? null : cat);
    });
    chips.appendChild(btn);
  });

  var videos = filter ? allVideos.filter(function(v) {
    return v.categories && v.categories.some(function(c) {
      return c.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
    });
  }) : allVideos;

  grid.innerHTML = '';
  if (!videos.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No videos found</div></div>';
    return;
  }
  videos.forEach(function(v) { grid.appendChild(renderVideoCard(v)); });
}

// ===== SEARCH =====
function setupSearch() {
  var input = $('searchInput');
  var btn = $('searchBtn');
  var ac = $('searchAC');

  function doSearch() {
    var q = input.value.trim().toLowerCase();
    ac.classList.remove('show');
    if (!q) { navigate('home'); return; }
    var results = allVideos.filter(function(v) {
      return v.title.toLowerCase().indexOf(q) !== -1 || v.channel.toLowerCase().indexOf(q) !== -1;
    });
    navigate('home');
    var grid = $('videoGrid');
    var chips = $('chipsBar');
    chips.innerHTML = '<div style="font-size:14px;color:var(--yt-text-secondary);padding:8px 0;">Results for "' + input.value.trim() + '" — ' + results.length + ' videos</div>';
    grid.innerHTML = '';
    results.forEach(function(v) { grid.appendChild(renderVideoCard(v)); });
    if (!results.length) grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No results found</div><div class="empty-state-desc">Try different keywords</div></div>';
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keypress', function(e) { if (e.key === 'Enter') doSearch(); });

  // Autocomplete
  input.addEventListener('input', function() {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { ac.classList.remove('show'); return; }
    var hits = allVideos.filter(function(v) {
      return v.title.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 6);
    if (!hits.length) { ac.classList.remove('show'); return; }
    ac.innerHTML = '';
    hits.forEach(function(v) {
      var item = document.createElement('div');
      item.className = 'search-ac-item';
      item.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><span>' + v.title + '</span>';
      item.addEventListener('click', function() {
        input.value = v.title;
        ac.classList.remove('show');
        doSearch();
      });
      ac.appendChild(item);
    });
    ac.classList.add('show');
  });
  input.addEventListener('blur', function() { setTimeout(function() { ac.classList.remove('show'); }, 200); });
}

// ===== WATCH PAGE =====
function openWatch(video) {
  if (!video) return;
  selectedVideo = video;
  prevPage = currentPage; // remember where we came from

  // Add to history
  watchHistory = watchHistory.filter(function(h) { return h.videoId !== video.id; });
  watchHistory.unshift({ videoId: video.id, watchedAt: new Date().toISOString() });
  if (watchHistory.length > 200) watchHistory = watchHistory.slice(0, 200);
  saveHistory();
  fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: video.id }) }).catch(function(){});

  // Close mini player if active
  closeMiniPlayer();

  // Hide main, show watch
  $('mainContent').style.display = 'none';
  var wp = $('watchPage');
  wp.classList.add('active');
  wp.style.marginTop = 'var(--yt-header-height)';
  wp.style.marginLeft = 'var(--yt-sidebar-width)';
  if (document.body.classList.contains('sidebar-collapsed')) {
    wp.style.marginLeft = 'var(--yt-sidebar-mini)';
  }

  // Player
  $('watchPlayer').src = embedUrl(video.videoUrl, 0);
  $('watchTitle').textContent = video.title;
  $('watchDescStats').textContent = (video.views || '') + ' views · ' + (video.uploadedAt || '');
  $('watchDescText').textContent = video.description || '';

  // Channel
  var ch = allChannels.find(function(c) { return c.name === video.channel; });
  $('watchChAvatar').innerHTML = makeAvatar(video.channel, 40);
  $('watchChName').textContent = video.channel;
  $('watchChSubs').textContent = ch ? formatSubs(ch.subscribers) + ' subscribers' : '';

  // Subscribe button
  var subBtn = $('watchSubBtn');
  var chId = ch ? ch.id : null;
  var isSubbed = chId && userSubscriptions.indexOf(chId) !== -1;
  subBtn.textContent = isSubbed ? 'Subscribed' : 'Subscribe';
  subBtn.className = 'sub-btn ' + (isSubbed ? 'subscribed' : 'not-subscribed');
  subBtn.onclick = function() {
    if (!chId) return;
    if (userSubscriptions.indexOf(chId) !== -1) {
      userSubscriptions = userSubscriptions.filter(function(id) { return id !== chId; });
      toast('Unsubscribed');
    } else {
      userSubscriptions.push(chId);
      toast('Subscribed!');
    }
    if (currentUser) { currentUser.subscriptions = userSubscriptions; saveUser(); }
    var s = userSubscriptions.indexOf(chId) !== -1;
    subBtn.textContent = s ? 'Subscribed' : 'Subscribe';
    subBtn.className = 'sub-btn ' + (s ? 'subscribed' : 'not-subscribed');
  };

  // Like/dislike
  updateLikeUI();

  // Description toggle
  var desc = $('watchDesc');
  desc.classList.remove('expanded');
  desc.onclick = function() { desc.classList.toggle('expanded'); };

  // Comments
  loadComments(video.id);

  // Recommendations
  renderRecommendations(video);

  window.scrollTo(0, 0);
}

function closeWatch() {
  $('watchPlayer').src = '';
  $('watchPage').classList.remove('active');
  $('mainContent').style.display = '';
  selectedVideo = null;
  // Also close mini player if somehow active
  closeMiniPlayer();
}

function renderRecommendations(video) {
  var sidebar = $('watchSidebar');
  sidebar.innerHTML = '';
  var sameCat = allVideos.filter(function(v) {
    return v.id !== video.id && v.categories && video.categories &&
      v.categories.some(function(c) { return video.categories.indexOf(c) !== -1; });
  });
  var others = allVideos.filter(function(v) { return v.id !== video.id && sameCat.indexOf(v) === -1; });
  var recs = sameCat.slice(0, 6).concat(others.slice(0, 4));

  recs.forEach(function(v) {
    var card = document.createElement('div');
    card.className = 'rec-card';
    card.innerHTML =
      '<div class="rec-thumb"><img src="' + v.thumbnail + '" alt="' + v.title + '" loading="lazy"><span class="video-duration">' + v.duration + '</span></div>' +
      '<div class="rec-info"><div class="rec-title">' + v.title + '</div><div class="rec-channel">' + v.channel + '</div><div class="rec-stats">' + (v.views||'') + ' views · ' + (v.uploadedAt||'') + '</div></div>';
    card.addEventListener('click', function() { openWatch(v); });
    sidebar.appendChild(card);
  });
}

// ===== LIKE / DISLIKE =====
function updateLikeUI() {
  if (!selectedVideo) return;
  var id = selectedVideo.id;
  var lb = $('likeBtn');
  var db = $('dislikeBtn');
  var lc = $('likeCount');
  if (lb) lb.classList.toggle('liked', !!likedVideos[id]);
  if (db) db.classList.toggle('liked', !!dislikedVideos[id]);
  var total = Object.keys(likedVideos).filter(function(k) { return likedVideos[k]; }).length;
  if (lc) lc.textContent = total > 0 ? total : 'Like';
}

function setupLikeDislike() {
  $('likeBtn').addEventListener('click', function() {
    if (!selectedVideo) return;
    var id = selectedVideo.id;
    likedVideos[id] = !likedVideos[id];
    if (likedVideos[id]) dislikedVideos[id] = false;
    saveLiked(); saveDisliked(); updateLikeUI();
    toast(likedVideos[id] ? 'Added to Liked videos' : 'Removed from Liked videos');
  });
  $('dislikeBtn').addEventListener('click', function() {
    if (!selectedVideo) return;
    var id = selectedVideo.id;
    dislikedVideos[id] = !dislikedVideos[id];
    if (dislikedVideos[id]) likedVideos[id] = false;
    saveLiked(); saveDisliked(); updateLikeUI();
  });
}

// ===== COMMENTS =====
async function loadComments(videoId) {
  try {
    var r = await fetch('/api/videos/' + videoId + '/comments');
    allComments = r.ok ? await r.json() : [];
  } catch(e) { allComments = []; }
  renderComments();
}

function renderComments() {
  var list = $('commentsList');
  var header = $('commentsHeader');
  if (!list) return;
  header.textContent = allComments.length + ' Comments';
  list.innerHTML = '';
  if (!allComments.length) {
    list.innerHTML = '<div style="color:var(--yt-text-secondary);font-size:14px;padding:8px 0;">No comments yet. Be the first!</div>';
    return;
  }
  allComments.forEach(function(c) {
    var div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML =
      '<div class="comment-avatar">' + makeAvatar(c.userName, 40) + '</div>' +
      '<div class="comment-body">' +
        '<div class="comment-header"><span class="comment-author">@' + c.userName + '</span><span class="comment-date">' + new Date(c.timestamp).toLocaleDateString() + '</span></div>' +
        '<div class="comment-text">' + c.text + '</div>' +
        '<div class="comment-actions"><button class="comment-action-btn"><svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg> ' + (c.likes || 0) + '</button></div>' +
      '</div>';
    list.appendChild(div);
  });
}

function setupComments() {
  $('commentCancel').addEventListener('click', function() { $('commentInput').value = ''; $('commentInput').blur(); });
  $('commentSubmit').addEventListener('click', async function() {
    var text = $('commentInput').value.trim();
    if (!text) return;
    var name = currentUser ? currentUser.name : 'Guest';
    try {
      await fetch('/api/videos/' + selectedVideo.id + '/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser ? currentUser.id : 0, userName: name, text: text })
      });
      $('commentInput').value = '';
      await loadComments(selectedVideo.id);
      toast('Comment added');
    } catch(e) { toast('Failed to add comment'); }
  });
}

// ===== SHARE MODAL =====
function setupShare() {
  $('shareBtn').addEventListener('click', function() {
    if (!selectedVideo) return;
    $('shareLinkInput').value = window.location.origin + '/?v=' + selectedVideo.id;
    var socials = [
      { icon: '💬', name: 'WhatsApp', url: 'https://wa.me/?text=' },
      { icon: '🐦', name: 'Twitter', url: 'https://twitter.com/intent/tweet?url=' },
      { icon: '📘', name: 'Facebook', url: 'https://www.facebook.com/sharer/sharer.php?u=' },
      { icon: '📧', name: 'Email', url: 'mailto:?body=' },
      { icon: '🔗', name: 'Reddit', url: 'https://www.reddit.com/submit?url=' }
    ];
    var row = $('shareSocial');
    row.innerHTML = '';
    socials.forEach(function(s) {
      var btn = document.createElement('button');
      btn.className = 'share-social-btn';
      btn.innerHTML = '<span class="share-social-icon">' + s.icon + '</span>' + s.name;
      btn.addEventListener('click', function() {
        window.open(s.url + encodeURIComponent($('shareLinkInput').value), '_blank', 'width=600,height=400');
        $('shareModal').classList.remove('active');
      });
      row.appendChild(btn);
    });
    $('shareModal').classList.add('active');
  });
  $('shareClose').addEventListener('click', function() { $('shareModal').classList.remove('active'); });
  $('shareModal').addEventListener('click', function(e) { if (e.target === $('shareModal')) $('shareModal').classList.remove('active'); });
  $('shareCopyBtn').addEventListener('click', function() {
    navigator.clipboard.writeText($('shareLinkInput').value).then(function() { toast('Link copied!'); });
  });
}

// ===== PLAYLIST MODAL =====
function setupPlaylistModal() {
  $('saveBtn').addEventListener('click', function() {
    if (!selectedVideo) return;
    renderPlaylistCheckList();
    $('playlistModal').classList.add('active');
  });
  $('playlistClose').addEventListener('click', function() { $('playlistModal').classList.remove('active'); });
  $('playlistModal').addEventListener('click', function(e) { if (e.target === $('playlistModal')) $('playlistModal').classList.remove('active'); });
  $('newPlBtn').addEventListener('click', function() {
    var name = $('newPlName').value.trim();
    if (!name) return;
    allPlaylists.push({ id: Date.now(), name: name, privacy: 'private', videoIds: selectedVideo ? [selectedVideo.id] : [] });
    savePlaylists(); $('newPlName').value = '';
    renderPlaylistCheckList();
    toast('Playlist "' + name + '" created');
  });
}

function renderPlaylistCheckList() {
  var list = $('playlistCheckList');
  if (!list || !selectedVideo) return;
  list.innerHTML = '';
  allPlaylists.forEach(function(pl) {
    var has = pl.videoIds && pl.videoIds.indexOf(selectedVideo.id) !== -1;
    var div = document.createElement('div');
    div.className = 'playlist-check-item';
    div.innerHTML = '<input type="checkbox" id="plc' + pl.id + '" ' + (has ? 'checked' : '') + '><label for="plc' + pl.id + '">' + pl.name + '</label>';
    div.querySelector('input').addEventListener('change', function(e) {
      if (e.target.checked) {
        if (!pl.videoIds) pl.videoIds = [];
        if (pl.videoIds.indexOf(selectedVideo.id) === -1) pl.videoIds.push(selectedVideo.id);
        toast('Saved to ' + pl.name);
      } else {
        pl.videoIds = (pl.videoIds || []).filter(function(id) { return id !== selectedVideo.id; });
        toast('Removed from ' + pl.name);
      }
      savePlaylists();
    });
    list.appendChild(div);
  });
}

// ===== EXPLORE PAGE =====
function renderExplore() {
  var container = $('exploreContent');
  if (!container) return;
  container.innerHTML = '';
  var cats = {
    'Entertainment': ['entertainment', 'challenge'],
    'Science & Technology': ['science', 'programming', 'web-development'],
    'Sports': ['sports'],
    'Cooking & Food': ['cooking'],
    'Travel': ['travel'],
    'Education': ['education'],
    'Animation & VFX': ['animation', 'vfx', 'graphics'],
    'Fitness': ['fitness', 'health'],
    'Documentary': ['documentary']
  };
  Object.keys(cats).forEach(function(title) {
    var ids = cats[title];
    var vids = allVideos.filter(function(v) {
      return v.categories && v.categories.some(function(c) { return ids.indexOf(c) !== -1; });
    });
    if (!vids.length) return;
    var section = document.createElement('div');
    section.innerHTML = '<div class="page-heading" style="font-size:18px;padding:24px 0 12px;">' + title + '</div>';
    var grid = document.createElement('div');
    grid.className = 'video-grid';
    vids.slice(0, 4).forEach(function(v) { grid.appendChild(renderVideoCard(v)); });
    section.appendChild(grid);
    container.appendChild(section);
  });
}

// ===== TRENDING PAGE =====
function renderTrending() {
  var tabs = $('trendingTabs');
  var list = $('trendingList');
  if (!tabs || !list) return;
  var categories = ['Now', 'Entertainment', 'Sports', 'Science', 'Cooking'];
  tabs.innerHTML = '';
  categories.forEach(function(cat, i) {
    var btn = document.createElement('button');
    btn.className = 'trending-tab' + (i === 0 ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', function() {
      tabs.querySelectorAll('.trending-tab').forEach(function(t) { t.classList.remove('active'); });
      btn.classList.add('active');
      renderTrendingList(cat === 'Now' ? null : cat.toLowerCase());
    });
    tabs.appendChild(btn);
  });
  renderTrendingList(null);
}

function renderTrendingList(category) {
  var list = $('trendingList');
  list.innerHTML = '';
  var vids = category ? allVideos.filter(function(v) {
    return v.categories && v.categories.some(function(c) { return c.indexOf(category) !== -1; });
  }) : allVideos.slice();
  vids.sort(function(a, b) { return parseViews(b.views) - parseViews(a.views); });

  vids.forEach(function(v, i) {
    var item = document.createElement('div');
    item.className = 'trending-item';
    item.innerHTML =
      '<div class="trending-rank">' + (i + 1) + '</div>' +
      '<div class="trending-thumb"><img src="' + v.thumbnail + '" alt="' + v.title + '" loading="lazy"><span class="video-duration">' + v.duration + '</span></div>' +
      '<div class="trending-thumb-info"><div class="trending-t-title">' + v.title + '</div><div class="trending-t-channel">' + v.channel + '</div><div class="trending-t-stats">' + (v.views||'') + ' views · ' + (v.uploadedAt||'') + '</div></div>';
    item.addEventListener('click', function() { openWatch(v); });
    list.appendChild(item);
  });
}

// ===== SHORTS PAGE =====
var shortsObserver = null;
var shortsCurrentVideo = null; // track which video's comments are open

function renderShorts() {
  var feed = $('shortsFeed');
  if (!feed) return;
  feed.innerHTML = '';

  // Inject shorts CSS once
  if (!$('shorts-style')) {
    var style = document.createElement('style');
    style.id = 'shorts-style';
    style.textContent = [
      /* Page layout */
      '.page-shorts-full { padding:0 !important; overflow:hidden; position:relative; }',
      '.shorts-header { position:fixed; top:var(--yt-header-height,56px); left:var(--yt-sidebar-width,240px); right:0; z-index:50; display:flex; align-items:center; gap:12px; padding:8px 16px; background:linear-gradient(to bottom,rgba(0,0,0,0.6),transparent); pointer-events:none; }',
      'body.sidebar-collapsed .shorts-header { left:var(--yt-sidebar-mini,72px); }',
      '.shorts-back-btn { pointer-events:all; background:none; border:none; color:#fff; display:flex; align-items:center; gap:6px; font-size:15px; font-weight:600; cursor:pointer; padding:6px 10px; border-radius:20px; transition:background 0.15s; }',
      '.shorts-back-btn:hover { background:rgba(255,255,255,0.15); }',
      '.shorts-back-btn svg { width:20px; height:20px; fill:#fff; }',
      '.shorts-header-title { color:#fff; font-size:20px; font-weight:700; pointer-events:none; display:flex; align-items:center; gap:6px; }',
      '.shorts-header-title svg { width:24px; height:24px; fill:#ff0000; }',
      /* Feed */
      '.shorts-feed { height:calc(100vh - var(--yt-header-height,56px)); overflow-y:scroll; scroll-snap-type:y mandatory; scrollbar-width:none; }',
      '.shorts-feed::-webkit-scrollbar { display:none; }',
      /* Each short item */
      '.short-item { height:calc(100vh - var(--yt-header-height,56px)); scroll-snap-align:start; display:flex; align-items:center; justify-content:center; position:relative; background:#000; overflow:hidden; }',
      /* Player */
      '.short-player-wrap { position:relative; height:100%; max-height:calc(100vh - var(--yt-header-height,56px)); width:auto; aspect-ratio:9/16; max-width:min(390px,100vw); }',
      '.short-player-wrap img { width:100%; height:100%; object-fit:cover; display:block; }',
      '.short-player-wrap iframe { width:100%; height:100%; border:none; display:block; }',
      '.short-play-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.25); cursor:pointer; transition:opacity 0.2s; }',
      '.short-play-overlay:hover { background:rgba(0,0,0,0.35); }',
      '.short-play-circle { width:60px; height:60px; background:rgba(255,255,255,0.85); border-radius:50%; display:flex; align-items:center; justify-content:center; }',
      '.short-play-circle svg { width:28px; height:28px; fill:#000; margin-left:4px; }',
      /* Bottom info overlay */
      '.short-bottom { position:absolute; bottom:0; left:0; right:80px; padding:16px 16px 24px; background:linear-gradient(transparent,rgba(0,0,0,0.7)); pointer-events:none; }',
      '.short-channel-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }',
      '.short-channel-row .short-avatar-sm { width:36px; height:36px; border-radius:50%; border:1.5px solid #fff; overflow:hidden; flex-shrink:0; }',
      '.short-channel-name { color:#fff; font-size:14px; font-weight:600; }',
      '.short-subscribe-btn { pointer-events:all; background:#fff; color:#000; border:none; border-radius:20px; padding:4px 12px; font-size:12px; font-weight:600; cursor:pointer; margin-left:4px; transition:opacity 0.15s; }',
      '.short-subscribe-btn:hover { opacity:0.85; }',
      '.short-subscribe-btn.subscribed { background:rgba(255,255,255,0.15); color:#fff; }',
      '.short-video-title { color:#fff; font-size:13px; font-weight:400; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; pointer-events:none; }',
      '.short-audio-row { color:rgba(255,255,255,0.8); font-size:12px; margin-top:6px; display:flex; align-items:center; gap:4px; }',
      /* Right actions */
      '.short-right-actions { position:absolute; bottom:24px; right:8px; display:flex; flex-direction:column; align-items:center; gap:20px; }',
      '.short-act { display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer; }',
      '.short-act-btn { width:48px; height:48px; border-radius:50%; background:rgba(255,255,255,0.15); border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px); transition:background 0.15s, transform 0.1s; }',
      '.short-act-btn:hover { background:rgba(255,255,255,0.28); }',
      '.short-act-btn:active { transform:scale(0.92); }',
      '.short-act-btn svg { width:24px; height:24px; fill:#fff; }',
      '.short-act-btn.liked svg { fill:#ff4444; }',
      '.short-act-btn.disliked svg { fill:#aaa; }',
      '.short-act-label { color:#fff; font-size:12px; font-weight:500; text-shadow:0 1px 2px rgba(0,0,0,0.6); }',
      /* Nav arrows */
      '.short-nav-col { position:absolute; right:4px; top:50%; transform:translateY(-100%); display:flex; flex-direction:column; gap:4px; z-index:10; }',
      '.short-nav-btn { width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.12); border:none; color:#fff; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); transition:background 0.15s; }',
      '.short-nav-btn:hover { background:rgba(255,255,255,0.25); }',
      /* Comments panel */
      '.shorts-comments-panel { position:fixed; bottom:0; left:50%; transform:translateX(-50%) translateY(100%); width:min(460px,100vw); height:65vh; background:var(--yt-bg,#fff); border-radius:16px 16px 0 0; z-index:300; transition:transform 0.32s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; box-shadow:0 -4px 24px rgba(0,0,0,0.25); }',
      '.shorts-comments-panel.open { transform:translateX(-50%) translateY(0); }',
      'body.dark-mode .shorts-comments-panel { background:#1a1a1a; }',
      '.shorts-cp-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; border-bottom:1px solid var(--yt-border,#e0e0e0); flex-shrink:0; }',
      'body.dark-mode .shorts-cp-header { border-color:#333; }',
      '.shorts-cp-title { font-size:16px; font-weight:600; color:var(--yt-text,#0f0f0f); }',
      'body.dark-mode .shorts-cp-title { color:#f1f1f1; }',
      '.shorts-cp-close { background:none; border:none; cursor:pointer; padding:4px; border-radius:50%; display:flex; }',
      '.shorts-cp-close svg { width:20px; height:20px; fill:var(--yt-text-secondary,#606060); }',
      '.shorts-cp-list { flex:1; overflow-y:auto; padding:8px 16px; }',
      '.shorts-cp-comment { display:flex; gap:10px; padding:8px 0; }',
      '.shorts-cp-comment-body { flex:1; }',
      '.shorts-cp-comment-author { font-size:13px; font-weight:600; color:var(--yt-text,#0f0f0f); }',
      'body.dark-mode .shorts-cp-comment-author { color:#f1f1f1; }',
      '.shorts-cp-comment-text { font-size:14px; color:var(--yt-text-secondary,#606060); margin-top:2px; line-height:1.4; }',
      'body.dark-mode .shorts-cp-comment-text { color:#aaa; }',
      '.shorts-cp-input-row { display:flex; align-items:center; gap:8px; padding:10px 16px 16px; border-top:1px solid var(--yt-border,#e0e0e0); flex-shrink:0; }',
      'body.dark-mode .shorts-cp-input-row { border-color:#333; }',
      '.shorts-cp-avatar { width:32px; height:32px; border-radius:50%; background:#3f51b5; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:600; font-size:14px; flex-shrink:0; }',
      '.shorts-cp-input { flex:1; border:none; border-bottom:1px solid var(--yt-border,#ccc); background:none; padding:6px 0; font-size:14px; outline:none; color:var(--yt-text,#0f0f0f); }',
      'body.dark-mode .shorts-cp-input { color:#f1f1f1; border-color:#555; }',
      '.shorts-cp-send { background:none; border:none; cursor:pointer; padding:6px; border-radius:50%; display:flex; transition:background 0.15s; }',
      '.shorts-cp-send:hover { background:rgba(0,0,0,0.08); }',
      '.shorts-cp-send svg { width:20px; height:20px; fill:#065fd4; }',
      '.shorts-cp-backdrop { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:299; }',
      '.shorts-cp-backdrop.open { display:block; }',
      /* Music bar redesign */
      '.music-player-bar { position:fixed; bottom:0; left:0; right:0; z-index:200; background:var(--yt-bg,#fff); border-top:1px solid var(--yt-border,#e0e0e0); transform:translateY(100%); transition:transform 0.3s; }',
      'body.dark-mode .music-player-bar { background:#1a1a1a; border-color:#333; }',
      '.music-player-bar.active { transform:translateY(0); }',
      '.music-bar-inner { display:flex; align-items:center; gap:16px; padding:8px 16px 4px; max-width:1400px; margin:0 auto; }',
      '.music-now-info { display:flex; align-items:center; gap:10px; min-width:200px; flex:0 0 auto; }',
      '.music-now-thumb { width:44px; height:44px; border-radius:4px; object-fit:cover; flex-shrink:0; }',
      '.music-now-text { overflow:hidden; }',
      '.music-now-title { font-size:13px; font-weight:600; color:var(--yt-text,#0f0f0f); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; }',
      'body.dark-mode .music-now-title { color:#f1f1f1; }',
      '.music-now-artist { font-size:12px; color:var(--yt-text-secondary,#606060); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; }',
      '.music-center-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; }',
      '.music-controls { display:flex; align-items:center; gap:4px; }',
      '.music-ctrl-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }',
      '.music-ctrl-btn:hover { background:rgba(0,0,0,0.08); }',
      'body.dark-mode .music-ctrl-btn:hover { background:rgba(255,255,255,0.1); }',
      '.music-ctrl-btn svg { width:20px; height:20px; fill:var(--yt-text,#0f0f0f); }',
      'body.dark-mode .music-ctrl-btn svg { fill:#f1f1f1; }',
      '.music-play-btn { width:40px; height:40px; background:var(--yt-text,#0f0f0f) !important; border-radius:50% !important; }',
      '.music-play-btn svg { fill:#fff !important; width:22px; height:22px; }',
      '.music-play-btn:hover { opacity:0.85; }',
      'body.dark-mode .music-play-btn { background:#f1f1f1 !important; }',
      'body.dark-mode .music-play-btn svg { fill:#000 !important; }',
      '.active-ctrl svg { fill:#065fd4 !important; }',
      '.music-progress-row { display:flex; align-items:center; gap:8px; width:100%; padding:0 4px; }',
      '.music-time-label { font-size:11px; color:var(--yt-text-secondary,#606060); flex-shrink:0; min-width:32px; text-align:center; }',
      '.music-seek-wrap { position:relative; flex:1; height:4px; background:rgba(0,0,0,0.15); border-radius:2px; cursor:pointer; }',
      'body.dark-mode .music-seek-wrap { background:rgba(255,255,255,0.2); }',
      '.music-seek-fill { position:absolute; left:0; top:0; height:100%; background:#065fd4; border-radius:2px; pointer-events:none; transition:width 0.1s linear; width:0%; }',
      '.music-seek-range { position:absolute; inset:-8px 0; width:100%; height:20px; opacity:0; cursor:pointer; margin:0; }',
      '.music-seek-wrap:hover .music-seek-fill { background:#1e88e5; }',
      '.music-bar-end { display:flex; align-items:center; gap:4px; flex-shrink:0; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  // Disconnect old observer
  if (shortsObserver) { shortsObserver.disconnect(); shortsObserver = null; }

  // Fixed header with back button + Shorts title
  var header = document.createElement('div');
  header.className = 'shorts-header';
  header.id = 'shortsHeader';
  header.innerHTML =
    '<button class="shorts-back-btn" id="shortsBackBtn">' +
      '<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>' +
      'Back' +
    '</button>' +
    '<div class="shorts-header-title">' +
      '<svg viewBox="0 0 24 24"><path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25z"/></svg>' +
      'Shorts' +
    '</div>';
  // Remove old header if exists
  var old = $('shortsHeader');
  if (old) old.remove();
  document.body.appendChild(header);

  $('shortsBackBtn').addEventListener('click', function() {
    // Stop all shorts videos
    document.querySelectorAll('.short-player-wrap iframe').forEach(function(f) { f.src = ''; });
    if (shortsObserver) { shortsObserver.disconnect(); shortsObserver = null; }
    header.remove();
    navigate(prevPage || 'home');
  });

  var shorts = allVideos.filter(function(v) { return parseDuration(v.duration) < 180; });
  if (!shorts.length) shorts = allVideos.slice(0, 8);

  // Setup comments panel handlers
  setupShortsComments();

  shorts.forEach(function(v, idx) {
    var ytId = '';
    var m = (v.videoUrl || '').match(/embed\/([^?&]+)/);
    if (m) ytId = m[1];

    var ch = allChannels.find(function(c) { return c.name === v.channel; });
    var chId = ch ? ch.id : null;
    var isLiked = !!likedVideos[v.id];
    var isSubbed = chId && userSubscriptions.indexOf(chId) !== -1;
    var likeCount = isLiked ? '1' : '0';

    var item = document.createElement('div');
    item.className = 'short-item';
    item.dataset.idx = idx;
    item.dataset.vid = v.id;
    item.dataset.ytid = ytId;

    item.innerHTML =
      // === Player ===
      '<div class="short-player-wrap" id="short-wrap-' + idx + '">' +
        '<img src="' + v.thumbnail + '" alt="' + v.title + '" style="width:100%;height:100%;object-fit:cover;">' +
        '<div class="short-play-overlay" id="short-overlay-' + idx + '">' +
          '<div class="short-play-circle"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>' +
        '</div>' +
      '</div>' +

      // === Bottom info ===
      '<div class="short-bottom">' +
        '<div class="short-channel-row">' +
          '<div class="short-avatar-sm">' + makeAvatar(v.channel, 36) + '</div>' +
          '<span class="short-channel-name">@' + v.channel.replace(/\s+/g,'').toLowerCase() + '</span>' +
          '<button class="short-subscribe-btn ' + (isSubbed ? 'subscribed' : '') + '" id="short-sub-' + idx + '">' + (isSubbed ? 'Subscribed' : 'Subscribe') + '</button>' +
        '</div>' +
        '<div class="short-video-title">' + v.title + '</div>' +
        '<div class="short-audio-row"><svg style="width:12px;height:12px;fill:rgba(255,255,255,0.8);" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg> Original audio</div>' +
      '</div>' +

      // === Right actions (YouTube Shorts style) ===
      '<div class="short-right-actions">' +
        // Like
        '<div class="short-act">' +
          '<button class="short-act-btn ' + (isLiked ? 'liked' : '') + '" id="short-like-' + idx + '">' +
            '<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>' +
          '</button>' +
          '<span class="short-act-label" id="short-like-count-' + idx + '">' + (parseViews(v.views)||0) + '</span>' +
        '</div>' +
        // Dislike
        '<div class="short-act">' +
          '<button class="short-act-btn" id="short-dislike-' + idx + '">' +
            '<svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>' +
          '</button>' +
          '<span class="short-act-label">Dislike</span>' +
        '</div>' +
        // Comments
        '<div class="short-act">' +
          '<button class="short-act-btn" id="short-comment-' + idx + '">' +
            '<svg viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>' +
          '</button>' +
          '<span class="short-act-label">Comments</span>' +
        '</div>' +
        // Share
        '<div class="short-act">' +
          '<button class="short-act-btn" id="short-share-' + idx + '">' +
            '<svg viewBox="0 0 24 24"><path d="M15 5.63L20.66 12 15 18.37V14h-1c-3.96 0-7.14 1-9.75 3.09 1.84-4.07 5.11-6.4 9.89-7.1l.86-.13V5.63M14 3v6C6.22 10.13 3.11 15.33 2 21c2.78-3.97 6.44-6 12-6v6l8-9-8-9z"/></svg>' +
          '</button>' +
          '<span class="short-act-label">Share</span>' +
        '</div>' +
      '</div>' +

      // Nav arrows
      '<div class="short-nav-col">' +
        (idx > 0 ? '<button class="short-nav-btn" data-nav="' + (idx-1) + '"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#fff;"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg></button>' : '') +
        (idx < shorts.length-1 ? '<button class="short-nav-btn" data-nav="' + (idx+1) + '"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#fff;"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></button>' : '') +
      '</div>';

    // --- Event listeners ---

    // Click overlay → load iframe
    item.querySelector('#short-overlay-' + idx).addEventListener('click', function() {
      loadShortIframe(item, idx, ytId, v);
    });

    // Like button
    item.querySelector('#short-like-' + idx).addEventListener('click', function(e) {
      e.stopPropagation();
      likedVideos[v.id] = !likedVideos[v.id];
      dislikedVideos[v.id] = false;
      saveLiked(); saveDisliked();
      var btn = item.querySelector('#short-like-' + idx);
      btn.classList.toggle('liked', !!likedVideos[v.id]);
      item.querySelector('#short-like-count-' + idx).textContent =
        likedVideos[v.id] ? formatLikeCount(parseViews(v.views) + 1) : formatLikeCount(parseViews(v.views));
      toast(likedVideos[v.id] ? 'Liked!' : 'Removed like');
    });

    // Dislike
    item.querySelector('#short-dislike-' + idx).addEventListener('click', function(e) {
      e.stopPropagation();
      dislikedVideos[v.id] = !dislikedVideos[v.id];
      likedVideos[v.id] = false;
      var lb = item.querySelector('#short-like-' + idx);
      lb.classList.remove('liked');
      var db = item.querySelector('#short-dislike-' + idx);
      db.classList.toggle('disliked', !!dislikedVideos[v.id]);
      saveLiked(); saveDisliked();
    });

    // Subscribe
    item.querySelector('#short-sub-' + idx).addEventListener('click', function(e) {
      e.stopPropagation();
      if (!chId) return;
      if (userSubscriptions.indexOf(chId) !== -1) {
        userSubscriptions = userSubscriptions.filter(function(id) { return id !== chId; });
        this.textContent = 'Subscribe';
        this.classList.remove('subscribed');
        toast('Unsubscribed');
      } else {
        userSubscriptions.push(chId);
        this.textContent = 'Subscribed';
        this.classList.add('subscribed');
        toast('Subscribed!');
      }
      if (currentUser) { currentUser.subscriptions = userSubscriptions; saveUser(); }
    });

    // Comments button
    item.querySelector('#short-comment-' + idx).addEventListener('click', function(e) {
      e.stopPropagation();
      shortsCurrentVideo = v;
      openShortsComments(v.id);
    });

    // Share button
    item.querySelector('#short-share-' + idx).addEventListener('click', function(e) {
      e.stopPropagation();
      $('shareLinkInput').value = window.location.origin + '/?v=' + v.id;
      var socials = [
        { icon: '💬', name: 'WhatsApp', url: 'https://wa.me/?text=' },
        { icon: '🐦', name: 'Twitter', url: 'https://twitter.com/intent/tweet?url=' },
        { icon: '📘', name: 'Facebook', url: 'https://www.facebook.com/sharer/sharer.php?u=' },
        { icon: '📧', name: 'Email', url: 'mailto:?body=' },
      ];
      var row = $('shareSocial');
      row.innerHTML = '';
      socials.forEach(function(s) {
        var btn = document.createElement('button');
        btn.className = 'share-social-btn';
        btn.innerHTML = '<span class="share-social-icon">' + s.icon + '</span>' + s.name;
        btn.addEventListener('click', function() {
          window.open(s.url + encodeURIComponent($('shareLinkInput').value), '_blank', 'width=600,height=400');
          $('shareModal').classList.remove('active');
        });
        row.appendChild(btn);
      });
      $('shareModal').classList.add('active');
    });

    // Nav arrow clicks
    item.querySelectorAll('.short-nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var targetIdx = parseInt(btn.dataset.nav);
        var items = feed.querySelectorAll('.short-item');
        if (items[targetIdx]) items[targetIdx].scrollIntoView({ behavior: 'smooth' });
      });
    });

    feed.appendChild(item);
  });

  // IntersectionObserver: auto-play/stop on scroll
  shortsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var idx = parseInt(entry.target.dataset.idx);
      var ytId2 = entry.target.dataset.ytid;
      var v = shorts[idx];
      var wrap = $('short-wrap-' + idx);
      if (!wrap) return;

      if (entry.isIntersecting) {
        if (ytId2 && !wrap.querySelector('iframe')) {
          loadShortIframe(entry.target, idx, ytId2, v);
        }
      } else {
        // Stop video — replace with thumbnail
        if (wrap.querySelector('iframe')) {
          wrap.innerHTML =
            '<img src="' + v.thumbnail + '" alt="' + v.title + '" style="width:100%;height:100%;object-fit:cover;">' +
            '<div class="short-play-overlay" id="short-overlay-' + idx + '">' +
              '<div class="short-play-circle"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>' +
            '</div>';
          wrap.querySelector('.short-play-overlay').addEventListener('click', function() {
            loadShortIframe(entry.target, idx, ytId2, v);
          });
        }
      }
    });
  }, { threshold: 0.75 });

  feed.querySelectorAll('.short-item').forEach(function(item) {
    shortsObserver.observe(item);
  });
}

function loadShortIframe(item, idx, ytId, v) {
  if (!ytId) return;
  var wrap = $('short-wrap-' + idx);
  if (!wrap) return;
  wrap.innerHTML = '<iframe src="https://www.youtube.com/embed/' + ytId + '?autoplay=1&rel=0&modestbranding=1" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>';
}

function formatLikeCount(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/,'') + 'K';
  return String(n);
}

// ===== SHORTS COMMENTS PANEL =====
function setupShortsComments() {
  // Only setup once
  if ($('shortsCommentsPanel').dataset.setup) return;
  $('shortsCommentsPanel').dataset.setup = '1';

  function close() {
    $('shortsCommentsPanel').classList.remove('open');
    $('shortsCpBackdrop').classList.remove('open');
  }
  $('shortsCpClose').addEventListener('click', close);
  $('shortsCpBackdrop').addEventListener('click', close);
  $('shortsCpSend').addEventListener('click', async function() {
    var text = $('shortsCpInput').value.trim();
    if (!text || !shortsCurrentVideo) return;
    var name = currentUser ? currentUser.name : 'Guest';
    try {
      await fetch('/api/videos/' + shortsCurrentVideo.id + '/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser ? currentUser.id : 0, userName: name, text: text })
      });
      $('shortsCpInput').value = '';
      openShortsComments(shortsCurrentVideo.id);
      toast('Comment added');
    } catch(e) { toast('Failed'); }
  });
  // Update avatar in panel
  if (currentUser) {
    $('shortsCpAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    $('shortsCpAvatar').style.background = avatarColor(currentUser.name);
  }
}

async function openShortsComments(videoId) {
  $('shortsCommentsPanel').classList.add('open');
  $('shortsCpBackdrop').classList.add('open');
  var list = $('shortsCpList');
  list.innerHTML = '<div style="padding:12px;color:#999;font-size:14px;">Loading…</div>';
  try {
    var r = await fetch('/api/videos/' + videoId + '/comments');
    var comments = r.ok ? await r.json() : [];
    list.innerHTML = '';
    if (!comments.length) {
      list.innerHTML = '<div style="padding:12px;color:#999;font-size:14px;">No comments yet. Be the first!</div>';
      return;
    }
    comments.forEach(function(c) {
      var div = document.createElement('div');
      div.className = 'shorts-cp-comment';
      div.innerHTML =
        '<div>' + makeAvatar(c.userName, 32) + '</div>' +
        '<div class="shorts-cp-comment-body">' +
          '<div class="shorts-cp-comment-author">@' + c.userName + ' <span style="font-size:11px;font-weight:400;color:#999;">' + new Date(c.timestamp).toLocaleDateString() + '</span></div>' +
          '<div class="shorts-cp-comment-text">' + c.text + '</div>' +
        '</div>';
      list.appendChild(div);
    });
  } catch(e) {
    list.innerHTML = '<div style="padding:12px;color:#999;">Failed to load comments.</div>';
  }
}

// ===== MUSIC PAGE =====
function renderMusic() {
  var container = $('musicContainer');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--yt-text-secondary);">Loading music...</div>';
  fetch('/api/music').then(function(r) { return r.json(); }).then(function(songs) {
    musicQueue = songs;
    container.innerHTML = '';
    songs.forEach(function(song, i) {
      var row = document.createElement('div');
      row.className = 'music-song-row';
      row.innerHTML =
        '<div class="music-song-num">' + (i + 1) + '</div>' +
        '<div class="music-song-thumb"><img src="' + song.thumbnail + '" alt="' + song.title + '"></div>' +
        '<div class="music-song-info"><div class="music-song-title">' + song.title + '</div><div class="music-song-artist">' + song.artist + ' · ' + song.language + '</div></div>' +
        '<div class="music-song-dur">' + song.duration + '</div>';
      row.addEventListener('click', function() { playMusicTrack(i); });
      container.appendChild(row);
    });
  }).catch(function() { container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><div class="empty-state-title">Failed to load music</div></div>'; });
}

function ensureYTApi() {
  if (window.YT && window.YT.Player) return;
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}
window.onYouTubeIframeAPIReady = function() {};

function playMusicTrack(i) {
  if (i < 0 || i >= musicQueue.length) return;
  musicIndex = i;
  var song = musicQueue[i];
  $('musicNowTitle').textContent = song.title;
  $('musicNowArtist').textContent = song.artist;
  var thumb = $('musicNowThumb');
  if (thumb) { thumb.src = song.thumbnail || ''; thumb.style.display = song.thumbnail ? '' : 'none'; }
  $('musicBar').classList.add('active');
  // reset progress
  $('musicSeek').value = 0;
  $('musicSeekFill').style.width = '0%';
  $('musicCurrent').textContent = '0:00';

  if (musicPlayer && musicPlayer.loadVideoById) {
    musicPlayer.loadVideoById(song.videoId);
    musicPlaying = true; updateMusicUI(); startMusicTimer();
  } else {
    ensureYTApi();
    var check = setInterval(function() {
      if (window.YT && window.YT.Player) {
        clearInterval(check);
        musicPlayer = new YT.Player('ytMusicPlayerDiv', {
          height: '0', width: '0', videoId: song.videoId,
          playerVars: { autoplay: 1, controls: 0 },
          events: {
            onReady: function() { musicPlaying = true; updateMusicUI(); startMusicTimer(); },
            onStateChange: function(e) {
              if (e.data === 1) { musicPlaying = true; updateMusicUI(); }
              if (e.data === 2) { musicPlaying = false; updateMusicUI(); }
              if (e.data === 0) { if (musicRepeat) playMusicTrack(musicIndex); else musicNextTrack(); }
            }
          }
        });
      }
    }, 200);
  }
  startMusicTimer();
}

function startMusicTimer() {
  if (musicInterval) clearInterval(musicInterval);
  musicInterval = setInterval(function() {
    if (!musicPlayer || !musicPlayer.getCurrentTime) return;
    var cur = musicPlayer.getCurrentTime() || 0;
    var dur = musicPlayer.getDuration() || 0;
    $('musicCurrent').textContent = fmtTime(cur);
    $('musicTotal').textContent = fmtTime(dur);
    var pct = dur > 0 ? (cur / dur) * 100 : 0;
    $('musicSeek').value = dur > 0 ? Math.floor((cur / dur) * 1000) : 0;
    $('musicSeekFill').style.width = pct + '%';
  }, 500);
}

function setupMusicControls() {
  $('musicPlayPause').addEventListener('click', function() {
    if (!musicPlayer) return;
    if (musicPlaying) musicPlayer.pauseVideo(); else musicPlayer.playVideo();
    musicPlaying = !musicPlaying;
    updateMusicUI();
  });
  $('musicNext').addEventListener('click', musicNextTrack);
  $('musicPrev').addEventListener('click', function() {
    playMusicTrack(musicIndex > 0 ? musicIndex - 1 : musicQueue.length - 1);
  });
  $('musicShuffle').addEventListener('click', function() {
    musicShuffle = !musicShuffle;
    $('musicShuffle').classList.toggle('active-ctrl', musicShuffle);
    toast(musicShuffle ? 'Shuffle on' : 'Shuffle off');
  });
  $('musicRepeat').addEventListener('click', function() {
    musicRepeat = !musicRepeat;
    $('musicRepeat').classList.toggle('active-ctrl', musicRepeat);
    toast(musicRepeat ? 'Repeat on' : 'Repeat off');
  });
  // Seek bar — drag to seek
  $('musicSeek').addEventListener('input', function() {
    if (musicPlayer && musicPlayer.getDuration) {
      var dur = musicPlayer.getDuration() || 0;
      var t = (this.value / 1000) * dur;
      musicPlayer.seekTo(t, true);
      $('musicSeekFill').style.width = (this.value / 10) + '%';
    }
  });
  // Close / stop
  $('musicCloseBtn').addEventListener('click', function() {
    if (musicPlayer && musicPlayer.stopVideo) musicPlayer.stopVideo();
    if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
    musicPlaying = false;
    $('musicBar').classList.remove('active');
    $('musicSeek').value = 0;
    $('musicSeekFill').style.width = '0%';
    $('musicCurrent').textContent = '0:00';
    $('musicTotal').textContent = '0:00';
    updateMusicUI();
  });
}

function updateMusicUI() {
  var pi = $('musicPlayIcon'), pa = $('musicPauseIcon');
  if (pi) pi.style.display = musicPlaying ? 'none' : '';
  if (pa) pa.style.display = musicPlaying ? '' : 'none';
}

function musicNextTrack() {
  var next = musicShuffle ? Math.floor(Math.random() * musicQueue.length) : (musicIndex + 1) % musicQueue.length;
  playMusicTrack(next);
}

// ===== HISTORY PAGE =====
function renderHistory() {
  var list = $('historyList');
  if (!list) return;
  if (!watchHistory.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏱️</div><div class="empty-state-title">Keep track of what you watch</div><div class="empty-state-desc">Watch history isn\'t viewable when signed out.</div></div>';
    return;
  }
  list.innerHTML = '';
  watchHistory.forEach(function(h) {
    var v = allVideos.find(function(vid) { return vid.id === h.videoId; });
    if (!v) return;
    var item = document.createElement('div');
    item.className = 'list-video-item';
    item.innerHTML =
      '<div class="list-video-thumb"><img src="' + v.thumbnail + '" alt="' + v.title + '"><span class="video-duration">' + v.duration + '</span></div>' +
      '<div class="list-video-info"><div class="list-video-title">' + v.title + '</div><div class="list-video-channel">' + v.channel + '</div><div class="list-video-stats">' + (v.views||'') + ' views · ' + new Date(h.watchedAt).toLocaleDateString() + '</div></div>';
    item.addEventListener('click', function() { openWatch(v); });
    list.appendChild(item);
  });
}

// ===== LIKED VIDEOS PAGE =====
function renderLiked() {
  var list = $('likedList');
  if (!list) return;
  var ids = Object.keys(likedVideos).filter(function(k) { return likedVideos[k]; }).map(Number);
  var vids = allVideos.filter(function(v) { return ids.indexOf(v.id) !== -1; });
  if (!vids.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👍</div><div class="empty-state-title">No liked videos yet</div><div class="empty-state-desc">Videos you like will show up here.</div></div>';
    return;
  }
  list.innerHTML = '';
  vids.forEach(function(v) {
    var item = document.createElement('div');
    item.className = 'list-video-item';
    item.innerHTML =
      '<div class="list-video-thumb"><img src="' + v.thumbnail + '" alt="' + v.title + '"><span class="video-duration">' + v.duration + '</span></div>' +
      '<div class="list-video-info"><div class="list-video-title">' + v.title + '</div><div class="list-video-channel">' + v.channel + '</div><div class="list-video-stats">' + (v.views||'') + ' views</div></div>';
    item.addEventListener('click', function() { openWatch(v); });
    list.appendChild(item);
  });
}

// ===== PLAYLISTS PAGE =====
function renderPlaylists() {
  var grid = $('playlistGrid');
  var detail = $('playlistDetail');
  if (!grid) return;
  detail.style.display = 'none';
  grid.style.display = '';
  grid.innerHTML = '';
  allPlaylists.forEach(function(pl) {
    var vids = (pl.videoIds || []).map(function(id) { return allVideos.find(function(v) { return v.id === id; }); }).filter(Boolean);
    var card = document.createElement('div');
    card.className = 'playlist-card';
    card.innerHTML =
      '<div class="playlist-card-thumb">' +
        (vids.length ? '<img src="' + vids[0].thumbnail + '">' : '') +
        '<div class="playlist-card-count"><span style="font-size:20px;">▶</span>' + vids.length + ' videos</div>' +
      '</div>' +
      '<div class="playlist-card-body"><div class="playlist-card-name">' + pl.name + '</div><div class="playlist-card-meta">' + pl.privacy + '</div></div>';
    card.addEventListener('click', function() { openPlaylistDetail(pl.id); });
    grid.appendChild(card);
  });
}

function openPlaylistDetail(plId) {
  var pl = allPlaylists.find(function(p) { return p.id === plId; });
  if (!pl) return;
  $('playlistGrid').style.display = 'none';
  var detail = $('playlistDetail');
  detail.style.display = 'block';
  var vids = (pl.videoIds || []).map(function(id) { return allVideos.find(function(v) { return v.id === id; }); }).filter(Boolean);
  detail.innerHTML = '<button class="action-btn-single" style="margin-bottom:16px;" onclick="renderPlaylists()">← Back</button><div class="page-heading">' + pl.name + ' · ' + vids.length + ' videos</div>';
  vids.forEach(function(v) {
    var item = document.createElement('div');
    item.className = 'list-video-item';
    item.innerHTML =
      '<div class="list-video-thumb"><img src="' + v.thumbnail + '" alt="' + v.title + '"><span class="video-duration">' + v.duration + '</span></div>' +
      '<div class="list-video-info"><div class="list-video-title">' + v.title + '</div><div class="list-video-channel">' + v.channel + '</div></div>';
    item.addEventListener('click', function() { openWatch(v); });
    detail.appendChild(item);
  });
  if (!vids.length) detail.innerHTML += '<div class="empty-state"><div class="empty-state-title">This playlist has no videos</div></div>';
}

// ===== CHANNEL PAGE =====
function renderChannel(channelName) {
  var container = $('channelContent');
  if (!container) return;
  var name = channelName || (currentUser ? currentUser.name : 'Your Channel');
  var ch = allChannels.find(function(c) { return c.name === name; });
  var vids = allVideos.filter(function(v) { return v.channel === name; });

  container.innerHTML =
    '<div class="channel-banner"></div>' +
    '<div class="channel-header">' +
      '<div class="channel-avatar-big">' + makeAvatar(name, 80) + '</div>' +
      '<div class="channel-info-section">' +
        '<div class="channel-title">' + name + '</div>' +
        '<div class="channel-handle">@' + name.replace(/\s+/g, '').toLowerCase() + ' · ' + (ch ? formatSubs(ch.subscribers) : '0') + ' subscribers · ' + vids.length + ' videos</div>' +
      '</div>' +
    '</div>' +
    '<div class="channel-tabs-bar"><button class="channel-tab-btn active" data-tab="videos">Videos</button><button class="channel-tab-btn" data-tab="about">About</button></div>' +
    '<div id="channelTabContent"></div>';

  container.querySelectorAll('.channel-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('.channel-tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderChannelTab(btn.dataset.tab, name, vids, ch);
    });
  });
  renderChannelTab('videos', name, vids, ch);
}

function renderChannelTab(tab, name, vids, ch) {
  var content = $('channelTabContent');
  if (tab === 'videos') {
    content.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'video-grid';
    vids.forEach(function(v) { grid.appendChild(renderVideoCard(v)); });
    content.appendChild(grid);
    if (!vids.length) content.innerHTML = '<div class="empty-state"><div class="empty-state-title">No videos yet</div></div>';
  } else {
    content.innerHTML = '<div style="max-width:600px;padding:16px 0;"><div class="page-heading" style="font-size:16px;">About</div><p style="color:var(--yt-text-secondary);line-height:1.6;">' + (ch ? ch.description : '') + '</p><div style="margin-top:16px;color:var(--yt-text-secondary);font-size:14px;">Joined Jan 2020 · ' + vids.length + ' videos · ' + (vids.reduce(function(a,v){return a+parseViews(v.views);},0)).toLocaleString() + ' total views</div></div>';
  }
}

// ===== STUDIO PAGE =====
function renderStudio() {
  var container = $('studioContent');
  if (!container) return;
  var totalViews = allVideos.reduce(function(a, v) { return a + parseViews(v.views); }, 0);
  var totalSubs = allChannels.reduce(function(a, c) { return a + c.subscribers; }, 0);

  container.innerHTML =
    '<div class="studio-cards">' +
      '<div class="studio-card"><div class="studio-card-label">Total views</div><div class="studio-card-value">' + (totalViews / 1e6).toFixed(1) + 'M</div><div class="studio-card-change">↑ 12.3%</div></div>' +
      '<div class="studio-card"><div class="studio-card-label">Subscribers</div><div class="studio-card-value">' + formatSubs(totalSubs) + '</div><div class="studio-card-change">↑ 4.8%</div></div>' +
      '<div class="studio-card"><div class="studio-card-label">Watch time (hrs)</div><div class="studio-card-value">' + Math.floor(totalViews * 0.02 / 60).toLocaleString() + '</div><div class="studio-card-change">↑ 8.1%</div></div>' +
      '<div class="studio-card"><div class="studio-card-label">Videos</div><div class="studio-card-value">' + allVideos.length + '</div><div class="studio-card-change">Active</div></div>' +
    '</div>' +
    '<div class="page-heading" style="font-size:16px;">Top videos</div>';
  var sorted = allVideos.slice().sort(function(a,b) { return parseViews(b.views) - parseViews(a.views); });
  sorted.slice(0, 8).forEach(function(v) {
    var item = document.createElement('div');
    item.className = 'list-video-item';
    item.innerHTML = '<div class="list-video-thumb"><img src="' + v.thumbnail + '"><span class="video-duration">' + v.duration + '</span></div><div class="list-video-info"><div class="list-video-title">' + v.title + '</div><div class="list-video-channel">' + v.views + ' views</div></div>';
    item.addEventListener('click', function() { openWatch(v); });
    container.appendChild(item);
  });
}

// ===== SETTINGS PAGE =====
function renderSettings() {
  var container = $('settingsContent');
  if (!container) return;
  container.innerHTML =
    '<div class="settings-section">' +
      '<div class="settings-section-title">Appearance</div>' +
      '<div class="settings-row"><div><div class="settings-label">Dark theme</div><div class="settings-desc">Reduce glare and improve night viewing</div></div><label class="toggle-switch"><input type="checkbox" id="darkToggle" ' + (isDark ? 'checked' : '') + '><span class="toggle-slider"></span></label></div>' +
    '</div>' +
    '<div class="settings-section">' +
      '<div class="settings-section-title">Account</div>' +
      (currentUser ?
        '<div class="settings-row"><div class="settings-label">Name: ' + currentUser.name + '</div></div>' +
        '<div class="settings-row"><div class="settings-label">Email: ' + currentUser.email + '</div></div>' +
        '<div class="settings-row"><button class="action-btn-single" id="signOutBtn">Sign out</button></div>'
        : '<div class="settings-row"><button class="action-btn-single" onclick="$(\'authModal\').classList.add(\'active\')">Sign in</button></div>'
      ) +
    '</div>';
  $('darkToggle').addEventListener('change', function() {
    isDark = this.checked;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('yt_dark', isDark.toString());
    toast(isDark ? 'Dark theme on' : 'Dark theme off');
  });
  var so = $('signOutBtn');
  if (so) so.addEventListener('click', function() {
    currentUser = null; userSubscriptions = [];
    localStorage.removeItem('yt_user');
    updateAvatarUI();
    renderSettings();
    toast('Signed out');
  });
}

// ===== NOTIFICATION PANEL =====
function setupNotifications() {
  var notifications = [
    { icon: '🔔', text: 'New video from MrBeast', time: '2 hours ago', unread: true },
    { icon: '💬', text: 'Someone replied to your comment', time: '5 hours ago', unread: true },
    { icon: '👍', text: 'Your comment got 10 likes', time: '1 day ago', unread: true },
    { icon: '📺', text: 'Dude Perfect uploaded a new video', time: '2 days ago', unread: false },
    { icon: '🔴', text: 'Mark Rober is live now', time: '3 days ago', unread: false },
  ];

  $('notiBtn').addEventListener('click', function() {
    var panel = $('notiPanel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      var list = $('notiList');
      list.innerHTML = '';
      notifications.forEach(function(n, i) {
        var item = document.createElement('div');
        item.className = 'noti-item' + (n.unread ? ' unread' : '');
        item.innerHTML = '<div class="noti-icon">' + n.icon + '</div><div><div class="noti-text">' + n.text + '</div><div class="noti-time">' + n.time + '</div></div>';
        item.addEventListener('click', function() { notifications[i].unread = false; item.classList.remove('unread'); });
        list.appendChild(item);
      });
    }
  });
  $('notiClose').addEventListener('click', function() { $('notiPanel').classList.remove('open'); });
}

// ===== AUTH =====
function setupAuth() {
  $('avatarBtn').addEventListener('click', function() {
    if (currentUser) { navigate('settings'); }
    else { $('authModal').classList.add('active'); }
  });
  $('authClose').addEventListener('click', function() { $('authModal').classList.remove('active'); });
  $('authModal').addEventListener('click', function(e) { if (e.target === $('authModal')) $('authModal').classList.remove('active'); });
  $('authToggle').addEventListener('click', function() {
    isAuthLogin = !isAuthLogin;
    $('authTitle').textContent = isAuthLogin ? 'Sign in' : 'Register';
    $('authSubmitBtn').textContent = isAuthLogin ? 'Sign in' : 'Register';
    $('authName').style.display = isAuthLogin ? 'none' : '';
    $('authToggle').textContent = isAuthLogin ? "Don't have an account? Register" : 'Already have an account? Sign in';
  });
  $('authSubmitBtn').addEventListener('click', async function() {
    var email = $('authEmail').value.trim();
    var password = $('authPassword').value;
    if (!email || !password) { toast('Please fill all fields'); return; }
    var url = isAuthLogin ? '/api/auth/login' : '/api/auth/register';
    var body = { email: email, password: password };
    if (!isAuthLogin) body.name = $('authName').value.trim() || 'User';
    try {
      var r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var data = await r.json();
      if (r.ok) {
        currentUser = data.user;
        userSubscriptions = currentUser.subscriptions || [];
        saveUser();
        updateAvatarUI();
        $('authModal').classList.remove('active');
        toast('Welcome, ' + currentUser.name + '!');
      } else {
        toast(data.error || 'Failed');
      }
    } catch(e) { toast('Connection error'); }
  });
}

function updateAvatarUI() {
  var btn = $('avatarBtn');
  var ca = $('commentAvatar');
  if (currentUser) {
    btn.innerHTML = '<span>' + currentUser.name.charAt(0).toUpperCase() + '</span>';
    btn.style.background = avatarColor(currentUser.name);
    if (ca) ca.textContent = currentUser.name.charAt(0).toUpperCase();
  } else {
    btn.innerHTML = '<span>?</span>';
    btn.style.background = '';
  }
}

// ===== MINI PLAYER =====
function openMiniPlayer() {
  if (!selectedVideo) return;
  var mp = $('miniPlayer');
  $('miniPlayerIframe').src = embedUrl(selectedVideo.videoUrl, 0);
  $('miniTitle').textContent = selectedVideo.title;
  $('miniChannel').textContent = selectedVideo.channel;
  mp.classList.add('active');
  miniPlayerActive = true;
}

function closeMiniPlayer() {
  $('miniPlayerIframe').src = '';
  $('miniPlayer').classList.remove('active');
  miniPlayerActive = false;
}

function setupMiniPlayer() {
  $('miniExpand').addEventListener('click', function() {
    if (selectedVideo) { closeMiniPlayer(); openWatch(selectedVideo); }
  });
  $('miniClose').addEventListener('click', function() {
    closeMiniPlayer(); selectedVideo = null;
  });
}

// ===== NAVIGATION =====
function navigate(page) {
  // Close watch page if open — NO mini player, just close cleanly
  if ($('watchPage').classList.contains('active')) {
    $('watchPlayer').src = '';
    $('watchPage').classList.remove('active');
    $('mainContent').style.display = '';
    selectedVideo = null;
  }
  // Also stop mini player if somehow still active
  closeMiniPlayer();

  // Stop shorts videos when leaving shorts
  if (currentPage === 'shorts') {
    if (shortsObserver) { shortsObserver.disconnect(); shortsObserver = null; }
    document.querySelectorAll('.short-player-wrap iframe').forEach(function(f) { f.src = ''; });
  }

  currentPage = page;
  $qa('.page').forEach(function(p) { p.classList.remove('active'); });
  var pageEl = $('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  // Highlight sidebar
  $qa('.sidebar-item').forEach(function(item) {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Render page content
  switch (page) {
    case 'home': renderHome(); break;
    case 'explore': renderExplore(); break;
    case 'trending': renderTrending(); break;
    case 'shorts': renderShorts(); break;
    case 'music': renderMusic(); break;
    case 'history': renderHistory(); break;
    case 'playlists': renderPlaylists(); break;
    case 'liked': renderLiked(); break;
    case 'settings': renderSettings(); break;
    case 'studio': renderStudio(); break;
  }
  if (page !== 'shorts' && shortsObserver) { shortsObserver.disconnect(); shortsObserver = null; }
  window.scrollTo(0, 0);
}

// ===== SIDEBAR =====
function setupSidebar() {
  $qa('.sidebar-item').forEach(function(item) {
    item.addEventListener('click', function() {
      navigate(item.dataset.page);
    });
  });

  $('hamburgerBtn').addEventListener('click', function() {
    var sb = $('sidebar');
    sb.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
    // Update watch page margins if open
    if ($('watchPage').classList.contains('active')) {
      $('watchPage').style.marginLeft = sb.classList.contains('collapsed') ? 'var(--yt-sidebar-mini)' : 'var(--yt-sidebar-width)';
    }
  });

  $('logoBtn').addEventListener('click', function() { navigate('home'); });
}

// ===== CLEAR HISTORY =====
function setupHistory() {
  $('clearHistoryBtn').addEventListener('click', function() {
    watchHistory = [];
    saveHistory();
    fetch('/api/history', { method: 'DELETE' }).catch(function(){});
    renderHistory();
    toast('Watch history cleared');
  });
}

// ===== NEW PLAYLIST =====
function setupNewPlaylist() {
  $('newPlaylistBtn').addEventListener('click', function() {
    var name = prompt('Playlist name:');
    if (!name || !name.trim()) return;
    allPlaylists.push({ id: Date.now(), name: name.trim(), privacy: 'private', videoIds: [] });
    savePlaylists();
    renderPlaylists();
    toast('Playlist created');
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async function() {
  loadState();
  updateAvatarUI();
  await fetchData();

  setupSidebar();
  setupSearch();
  setupLikeDislike();
  setupComments();
  setupShare();
  setupPlaylistModal();
  setupMiniPlayer();
  setupMusicControls();
  setupNotifications();
  setupAuth();
  setupHistory();
  setupNewPlaylist();

  // Voice search
  $('voiceBtn').addEventListener('click', function() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice search not supported'); return; }
    var rec = new SR();
    rec.onresult = function(e) {
      var text = e.results[0][0].transcript;
      $('searchInput').value = text;
      $('searchBtn').click();
    };
    rec.onerror = function() { toast('Voice search failed'); };
    toast('Listening...');
    rec.start();
  });

  // Upload button
  $('uploadBtn').addEventListener('click', function() { toast('Upload coming soon!'); });

  // Description expand
  $('watchDesc').addEventListener('click', function() {
    this.classList.toggle('expanded');
  });

  renderHome();
  ensureYTApi();

  // Back button on watch page
  $('watchBackBtn').addEventListener('click', function() {
    // Stop video before going back
    $('watchPlayer').src = '';
    $('watchPage').classList.remove('active');
    $('mainContent').style.display = '';
    selectedVideo = null;
    // Restore previous page without triggering mini player
    currentPage = prevPage || 'home';
    $qa('.page').forEach(function(p) { p.classList.remove('active'); });
    var pageEl = $('page-' + currentPage);
    if (pageEl) pageEl.classList.add('active');
    $qa('.sidebar-item').forEach(function(item) { item.classList.toggle('active', item.dataset.page === currentPage); });
    window.scrollTo(0, 0);
  });

  // Dynamic styles for back button + music bar
  var dynStyle = document.createElement('style');
  dynStyle.textContent = [
    '.watch-back-btn { display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--yt-text,#0f0f0f);font-size:14px;font-weight:500;cursor:pointer;padding:8px 12px 8px 4px;border-radius:20px;margin-bottom:8px;transition:background 0.15s; }',
    '.watch-back-btn:hover { background:var(--yt-surface,#f2f2f2); }',
    '.watch-back-btn svg { width:20px;height:20px;fill:currentColor; }',
    'body.dark-mode .watch-back-btn { color:#fff; }',
    'body.dark-mode .watch-back-btn:hover { background:rgba(255,255,255,0.1); }',
  ].join('\n');
  document.head.appendChild(dynStyle);
});
