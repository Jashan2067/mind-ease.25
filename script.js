
(() => {
  // --------- Helpers ----------
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  // ------- Tabs ----------
  function openTab(tabName) {
    const tabs = document.getElementsByClassName('tabcontent');
    for (let tab of tabs) tab.style.display = 'none';

    pauseAllMedia();
    resetMeditationTimer();

    const el = document.getElementById(tabName);
    if (el) el.style.display = 'block';

    // load journals only when journal tab active
    if (tabName === 'journal') loadJournals();
    // update chart when analytics opened
    if (tabName === 'analysis') renderChart();
  }

  // Setup tab buttons
  document.addEventListener('DOMContentLoaded', () => {
    // wire nav buttons
    $$('.tablink').forEach(btn => {
      btn.addEventListener('click', e => {
        const t = btn.dataset.tab || btn.getAttribute('data-tab');
        if (t) openTab(t);
      });
    });

    // hero CTA buttons
    $$('[data-tab-target]').forEach(b => {
      b.addEventListener('click', () => {
        const t = b.getAttribute('data-tab-target');
        if (t) openTab(t);
      });
    });

    // default
    openTab('home');

    // other setup
    setupMediaControls();
    setupMeditation();
    setupJournalControls();
    setupChat();
    setupGames();
    setupDarkMode();
    registerServiceWorker();
  });

  // ------- Media controls --------
  function pauseAllMedia() {
    $$('audio, video').forEach(m => {
      try { m.pause(); if (m.currentTime) m.currentTime = 0; } catch (e) { }
    });
  }

  function setupMediaControls() {
    const all = $$('audio, video');
    all.forEach(media => {
      media.addEventListener('play', () => {
        all.forEach(other => { if (other !== media) other.pause(); });
      });
    });
  }

  // ------- Meditation (Custom Timer) ----------
  let medInterval = null;
  let medTimeLeft = 1500; // default 25 mins
  let medIsRunning = false;

  function setupMeditation() {
    const startBtn = $('#startTimer');
    const resetBtn = $('#resetTimer');
    const customInput = $('#customMinutes');
    const modeBtns = $$('.timer-mode-btn');

    // Timer mode button handlers
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (medIsRunning) return; // Don't change mode while running

        // Update active state
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Set time based on mode
        const minutes = parseInt(btn.dataset.minutes) || 25;
        medTimeLeft = minutes * 60;

        // Update custom input to match
        if (customInput) customInput.value = minutes;

        updateMeditationDisplay();
      });
    });

    if (startBtn) startBtn.addEventListener('click', toggleMeditationTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetMeditationTimer);

    if (customInput) {
      // Update display as user types
      customInput.addEventListener('input', () => {
        if (!medIsRunning) {
          let val = customInput.value;
          if (val === '') return;
          let mins = parseInt(val);
          if (!isNaN(mins) && mins > 0 && mins <= 180) {
            medTimeLeft = mins * 60;
            updateMeditationDisplay();
            // Remove active state from mode buttons when custom time is set
            modeBtns.forEach(b => b.classList.remove('active'));
          }
        }
      });

      // Validate and finalize on blur/enter
      customInput.addEventListener('change', () => {
        if (!medIsRunning) {
          let mins = parseInt(customInput.value);
          if (isNaN(mins) || mins < 1) mins = 1;
          if (mins > 180) mins = 180;
          customInput.value = mins;
          medTimeLeft = mins * 60;
          updateMeditationDisplay();
        }
      });

      // Initialize with input value
      let mins = parseInt(customInput.value) || 25;
      medTimeLeft = mins * 60;
    }

    // Initial display update
    updateMeditationDisplay();

    // reset on tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && medIsRunning) {
        // Optional: pause or keep running?
      }
    });
  }

  function toggleMeditationTimer() {
    if (medIsRunning) {
      stopMeditationTimer();
    } else {
      startMeditationTimer();
    }
  }

  function startMeditationTimer() {
    if (medIsRunning) return;
    medIsRunning = true;
    const startBtn = $('#startTimer');
    if (startBtn) startBtn.textContent = 'Pause';

    // Disable input while running
    const customInput = $('#customMinutes');
    if (customInput) customInput.disabled = true;

    medInterval = setInterval(() => {
      medTimeLeft--;
      updateMeditationDisplay();
      if (medTimeLeft <= 0) {
        completeMeditation();
      }
    }, 1000);
  }

  function stopMeditationTimer() {
    medIsRunning = false;
    clearInterval(medInterval);
    const startBtn = $('#startTimer');
    if (startBtn) startBtn.textContent = 'Start';

    // Enable input when paused/stopped
    const customInput = $('#customMinutes');
    if (customInput) customInput.disabled = false;
  }

  function resetMeditationTimer() {
    stopMeditationTimer();
    const customInput = $('#customMinutes');
    let mins = 25;
    if (customInput) {
      mins = parseInt(customInput.value) || 25;
    }
    medTimeLeft = mins * 60;
    updateMeditationDisplay();
  }

  function completeMeditation() {
    stopMeditationTimer();
    medTimeLeft = 0; // ensure 00:00
    updateMeditationDisplay();
    speak("Session complete. Great job!");
  }

  function updateMeditationDisplay() {
    const display = $('#timerDisplay');
    if (!display) return;
    const h = Math.floor(medTimeLeft / 3600);
    const m = Math.floor((medTimeLeft % 3600) / 60);
    const s = medTimeLeft % 60;
    display.textContent = `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

    // Update document title for visibility
    if (medIsRunning) {
      document.title = `(${display.textContent}) MindEase`;
    } else {
      document.title = 'MindEase — Your Mental Wellness Companion';
    }
  }

  // ------- Journal System ----------
  const JOURNAL_KEY = 'mindease_journals_v1';
  let autosaveTimer = null;

  function setupJournalControls() {
    const saveBtn = $('#saveJournal');
    const clearBtn = $('#clearJournals');
    const input = $('#journalInput');
    const search = $('#journalSearch');
    const moodSel = $('#journalMood');

    if (saveBtn) saveBtn.addEventListener('click', onSaveJournal);
    if (clearBtn) clearBtn.addEventListener('click', onClearJournals);
    if (search) search.addEventListener('input', () => loadJournals());
    if (moodSel) moodSel.addEventListener('change', () => loadJournals());

    // autosave draft
    if (input) {
      input.addEventListener('input', () => {
        document.getElementById('autosaveNote').textContent = 'Autosave: saving...';
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => {
          localStorage.setItem('mindease_draft', input.value);
          document.getElementById('autosaveNote').textContent = 'Autosave: saved';
        }, 700);
      });

      // load draft if available
      const draft = localStorage.getItem('mindease_draft');
      if (draft) input.value = draft;
    }
  }

  function onSaveJournal() {
    const textEl = $('#journalInput');
    const mood = $('#journalMood') ? $('#journalMood').value : 'any';
    const text = textEl.value.trim();
    if (!text) { alert('Please write something first!'); return; }

    const journals = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    const entry = {
      id: Date.now(),
      text,
      mood,
      created: new Date().toLocaleString()
    };
    journals.unshift(entry);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journals));
    // remove draft
    localStorage.removeItem('mindease_draft');
    $('#journalInput').value = '';
    document.getElementById('autosaveNote').textContent = 'Autosave: not saved';
    loadJournals();
    renderChart();
  }

  function onClearJournals() {
    if (!confirm('Delete all journal entries? This cannot be undone.')) return;
    localStorage.removeItem(JOURNAL_KEY);
    loadJournals();
    renderChart();
  }

  function loadJournals() {
    const list = $('#journalList');
    if (!list) return;
    const journals = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    const search = $('#journalSearch') ? $('#journalSearch').value.toLowerCase() : '';
    const moodFilter = $('#journalMood') ? $('#journalMood').value : 'any';

    list.innerHTML = '';
    journals.forEach((entry, idx) => {
      const matchesSearch = entry.text.toLowerCase().includes(search) || entry.created.toLowerCase().includes(search);
      const matchesMood = (moodFilter === 'any') || (entry.mood === moodFilter);
      if (!matchesSearch || !matchesMood) return;

      const li = document.createElement('li');
      li.className = 'journal-item';

      const left = document.createElement('div');
      left.style.flex = '1';
      const content = document.createElement('div');
      content.innerText = entry.text;
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerText = `${entry.mood} • ${entry.created}`;

      left.appendChild(content);
      left.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.innerText = '✏️';
      editBtn.title = 'Edit entry';
      editBtn.addEventListener('click', () => editJournal(entry.id));

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.innerText = '🗑️';
      delBtn.title = 'Delete entry';
      delBtn.addEventListener('click', () => deleteJournal(entry.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function editJournal(id) {
    const journals = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    const idx = journals.findIndex(j => j.id === id);
    if (idx < 0) return;
    const entry = journals[idx];
    $('#journalInput').value = entry.text;
    $('#journalMood').value = entry.mood || 'any';
    // delete the old entry; user will save to update
    journals.splice(idx, 1);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journals));
    loadJournals();
  }

  function deleteJournal(id) {
    let journals = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    journals = journals.filter(j => j.id !== id);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journals));
    loadJournals();
    renderChart();
  }

  // ------- Chart / Analytics ----------
  let chartInstance = null;
  function renderChart() {
    const ctx = document.getElementById('moodChart');
    if (!ctx) return;
    const journals = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');

    // collect counts by mood for last 7 entries (or all)
    const moodCounts = {};
    journals.forEach(j => {
      const m = j.mood || 'unknown';
      moodCounts[m] = (moodCounts[m] || 0) + 1;
    });
    const labels = Object.keys(moodCounts).length ? Object.keys(moodCounts) : ['No data'];
    const data = labels.map(l => moodCounts[l] || 0);

    if (chartInstance) chartInstance.destroy();

    // Use different colors based on dark mode
    const isDark = document.body.classList.contains('dark');
    const barColor = isDark ? 'rgba(163, 179, 217, 0.7)' : 'rgba(255, 112, 67, 0.7)'; // Light blue for dark mode, coral for light mode

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Entries by Mood', data, backgroundColor: barColor }] },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: isDark ? '#F0F4F8' : '#1E293B' },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
          },
          x: {
            ticks: { color: isDark ? '#F0F4F8' : '#1E293B' },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
          }
        }
      }
    });

    const avg = computeAverageMood(journals);
    $('#insightBox').innerHTML = `💡 Entries: <b>${journals.length}</b> • ${avg ? 'Average mood: ' + avg : 'Add entries to see trends'}`;
  }

  // very simple mood average mapping
  function computeAverageMood(journals) {
    if (!journals.length) return null;
    const map = { '😊': 5, '😐': 3, '😢': 1, '😡': 0, '😴': 2 };
    let total = 0, count = 0;
    journals.forEach(j => {
      if (map[j.mood] !== undefined) { total += map[j.mood]; count++; }
    });
    return count ? (Math.round((total / count) * 10) / 10) : null;
  }

  // ------- Clara Chat (frontend rule-based with voice) ----------
  function setupChat() {
    const sendBtn = $('#sendBtn');
    const userMsg = $('#userMsg');
    const voiceBtn = $('#voiceBtn');
    const chatWindow = $('#chatWindow');

    if (sendBtn) sendBtn.addEventListener('click', sendToClara);
    if (userMsg) userMsg.addEventListener('keydown', e => { if (e.key === 'Enter') sendToClara(); });

    // voice input
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        startSpeechRecognition().then(text => {
          if (text) {
            $('#userMsg').value = text;
            sendToClara();
          }
        }).catch(() => { alert('Speech recognition not available'); });
      });
    }

    // open chat button
    $('#openChatBtn')?.addEventListener('click', () => openTab('chat'));
  }

  function appendChat(who, text) {
    const win = $('#chatWindow');
    if (!win) return;
    const div = document.createElement('div');
    div.className = 'chat-bubble ' + (who === 'user' ? 'chat-user' : 'chat-clara');
    div.innerHTML = `<strong>${who === 'user' ? 'You' : 'Clara'}:</strong> <div>${escapeHtml(text)}</div>`;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
  }

  function sendToClara() {
    const input = $('#userMsg');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    appendChat('user', text);
    input.value = '';

    // simple rule-based replies (extend or replace with API call)
    const txt = text.toLowerCase();
    let reply = "I'm here to listen. Tell me how you're feeling.";
    if (txt.includes('hello') || txt.includes('hi')) reply = "Hello! How are you feeling today?";
    else if (txt.includes('sad') || txt.includes('depressed')) reply = "I'm sorry you're feeling sad. Take a slow breath with me.";
    else if (txt.includes('stress') || txt.includes('anx')) reply = "Let's try a quick breathing exercise — breathe in for 4, out for 4.";
    else if (txt.includes('help')) reply = "You can try journaling for a minute, or try the 5-minute meditation.";
    // speak reply
    appendChat('clara', reply);
    speak(reply);
  }

  // ------- Voice utilities (speech recognition + synth) ----------
  function startSpeechRecognition() {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return reject();
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = e => resolve(e.results[0][0].transcript);
      rec.onerror = () => reject();
      rec.start();
    });
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // ------- Dark mode ----------
  function setupDarkMode() {
    const toggle = $('#darkToggle');
    const saved = localStorage.getItem('mindease_dark') === '1';
    if (saved) document.body.classList.add('dark');

    if (toggle) {
      toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('mindease_dark', document.body.classList.contains('dark') ? '1' : '0');
      });
    }
  }

  // ------- PWA: register service worker ----------
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* ignore */ });
    }
  }

  // ------- Games (Breathing, Bubble, Memory, Doodle) ----------
  function setupGames() {
    // wire open buttons
    $$('.game-card button').forEach(btn => btn.addEventListener('click', () => openGame(btn.dataset.game)));
    $('#closeGame')?.addEventListener('click', closeGame);

    // breathing
    $('#startBreath')?.addEventListener('click', startBreathingCycle);
    $('#stopBreath')?.addEventListener('click', stopBreathingCycle);

    // bubbles
    $('#spawnBubbles')?.addEventListener('click', spawnBubbles);
    $('#clearBubbles')?.addEventListener('click', clearBubbles);

    // memory
    $('#resetMemory')?.addEventListener('click', resetMemory);

    // doodle
    initDoodle();
    initMemory();
    initZen();
  }

  function openGame(name) {
    // hide other tabs and show games tab
    openTab('games');
    $$('.game-panel').forEach(p => { p.classList.remove('active'); p.setAttribute('aria-hidden', 'true'); });
    const el = $('#' + name);
    if (el) { el.classList.add('active'); el.setAttribute('aria-hidden', 'false'); }
    // specific initializers
    if (name === 'memory') resetMemory();
    if (name === 'breathing') { $('#breathingText').textContent = 'Breathe slowly...'; }
  }

  function closeGame() {
    $$('.game-panel').forEach(p => { p.classList.remove('active'); p.setAttribute('aria-hidden', 'true'); });
    // return to home
    openTab('home');
  }

  // -- Breathing --
  let _breathTimer = null; // toggles inhale/exhale
  function startBreathingCycle() {
    const circle = $('#breathingCircle');
    const text = $('#breathingText');
    if (!circle) return;
    stopBreathingCycle();
    let phase = 0; // 0 inhale, 1 hold, 2 exhale
    text.textContent = 'Start: inhale';
    circle.classList.add('inhale');
    _breathTimer = setInterval(() => {
      phase = (phase + 1) % 3;
      if (phase === 0) { circle.classList.add('inhale'); text.textContent = 'Inhale...'; }
      else if (phase === 1) { text.textContent = 'Hold...'; }
      else { circle.classList.remove('inhale'); text.textContent = 'Exhale...'; }
    }, 4000);
  }

  function stopBreathingCycle() {
    clearInterval(_breathTimer); _breathTimer = null;
    const circle = $('#breathingCircle');
    if (circle) circle.classList.remove('inhale');
    const text = $('#breathingText'); if (text) text.textContent = 'Stopped';
  }

  // -- Bubble pop --
  function spawnBubbles() {
    const area = $('#bubbleArea'); if (!area) return;
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('div');
      const size = 30 + Math.round(Math.random() * 60);
      b.className = 'bubble';
      b.style.width = size + 'px'; b.style.height = size + 'px';
      b.style.left = (Math.random() * 80) + '%';
      b.style.top = (Math.random() * 70) + '%';
      b.style.background = `rgba(45,140,255,${0.18 + Math.random() * 0.6})`;
      b.addEventListener('click', e => {
        b.style.transform = 'scale(0.2)'; b.style.opacity = '0';
        setTimeout(() => b.remove(), 180);
      });
      area.appendChild(b);
    }
  }

  function clearBubbles() { const area = $('#bubbleArea'); if (area) area.innerHTML = ''; }

  // -- Memory match --
  let _memoryState = { cards: [], flipped: [], lock: false };
  function initMemory() { resetMemory(); }

  function resetMemory() {
    const grid = $('#memoryGrid'); if (!grid) return;
    const symbols = ['🍃', '🌸', '✨', '🌙', '🍂', '🌊'];
    const pool = symbols.concat(symbols).slice(0, 6 * 1); // keep 6 pairs max
    // shuffle and pick 6 pairs (12 items)
    const deck = pool.concat(pool).slice(0, 12).sort(() => Math.random() - 0.5);
    // simpler: use 6 symbols twice
    const items = symbols.slice(0, 6).reduce((arr, s) => arr.concat([s, s]), []).sort(() => Math.random() - 0.5);
    grid.innerHTML = '';
    _memoryState = { cards: items, flipped: [], lock: false };
    items.forEach((sym, i) => {
      const c = document.createElement('div');
      c.className = 'memory-card'; c.dataset.index = i; c.textContent = '';
      c.addEventListener('click', () => onMemoryClick(c));
      grid.appendChild(c);
    });
  }

  function onMemoryClick(cardEl) {
    if (!_memoryState || _memoryState.lock) return;
    const idx = parseInt(cardEl.dataset.index, 10);
    if (_memoryState.flipped.includes(idx)) return;
    revealCard(cardEl, idx);
    _memoryState.flipped.push(idx);
    if (_memoryState.flipped.length === 2) {
      const [a, b] = _memoryState.flipped; const match = _memoryState.cards[a] === _memoryState.cards[b];
      if (!match) { _memoryState.lock = true; setTimeout(() => { hideIndex(a); hideIndex(b); _memoryState.flipped = []; _memoryState.lock = false; }, 800); }
      else { _memoryState.flipped = []; }
    }
  }

  function revealCard(el, idx) { el.classList.add('flipped'); el.textContent = _memoryState.cards[idx]; }
  function hideIndex(idx) { const el = document.querySelector(`.memory-card[data-index="${idx}"]`); if (el) { el.classList.remove('flipped'); el.textContent = ''; } }

  // -- Doodle canvas --
  function initDoodle() {
    const canvas = $('#doodleCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 4;
    let drawing = false;
    function pos(e) { const r = canvas.getBoundingClientRect(); return { x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left, y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top }; }
    canvas.addEventListener('pointerdown', e => { drawing = true; ctx.beginPath(); const p = pos(e); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.strokeStyle = $('#doodleColor')?.value || '#2d8cff'; ctx.stroke(); });
    canvas.addEventListener('pointerup', () => drawing = false); canvas.addEventListener('pointerleave', () => drawing = false);
    $('#clearDoodle')?.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); });
  }

  // -- Zen Garden --
  function initZen() {
    const canvas = $('#zenCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.4)';

    let drawing = false;
    let lastX = 0, lastY = 0;

    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) * (canvas.width / r.width),
        y: ((e.touches ? e.touches[0].clientY : e.clientY) - r.top) * (canvas.height / r.height)
      };
    }

    function drawPattern(x, y) {
      const pattern = $('#zenPattern')?.value || 'circles';
      ctx.strokeStyle = `rgba(${100 + Math.random() * 55}, ${85 + Math.random() * 40}, ${60 + Math.random() * 25}, 0.35)`;

      switch (pattern) {
        case 'circles':
          // Draw concentric circles
          for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(x, y, i * 8, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;

        case 'lines':
          // Draw rake lines
          if (lastX && lastY) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Parallel lines
            const dx = x - lastX;
            const dy = y - lastY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              const nx = -dy / dist;
              const ny = dx / dist;
              for (let offset of [-10, -5, 5, 10]) {
                ctx.beginPath();
                ctx.moveTo(lastX + nx * offset, lastY + ny * offset);
                ctx.lineTo(x + nx * offset, y + ny * offset);
                ctx.stroke();
              }
            }
          }
          break;

        case 'waves':
          // Draw wave patterns
          if (lastX && lastY) {
            const steps = 20;
            const dx = (x - lastX) / steps;
            const dy = (y - lastY) / steps;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            for (let i = 0; i <= steps; i++) {
              const px = lastX + dx * i;
              const py = lastY + dy * i + Math.sin(i * 0.5) * 5;
              ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
          break;

        case 'spiral':
          // Draw small spiral
          ctx.beginPath();
          for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
            const radius = angle * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (angle === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          break;
      }
    }

    canvas.addEventListener('pointerdown', e => {
      drawing = true;
      const p = getPos(e);
      lastX = p.x;
      lastY = p.y;
      drawPattern(p.x, p.y);
    });

    canvas.addEventListener('pointermove', e => {
      if (!drawing) return;
      const p = getPos(e);
      drawPattern(p.x, p.y);
      lastX = p.x;
      lastY = p.y;
    });

    canvas.addEventListener('pointerup', () => { drawing = false; lastX = 0; lastY = 0; });
    canvas.addEventListener('pointerleave', () => { drawing = false; lastX = 0; lastY = 0; });

    $('#clearZen')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  // ------- Read More Articles ----------
  function setupReadMore() {
    const readMoreBtn = $('#readMoreBtn');
    const moreArticles = $('#moreArticles');

    if (readMoreBtn && moreArticles) {
      readMoreBtn.addEventListener('click', () => {
        if (moreArticles.classList.contains('hidden')) {
          moreArticles.classList.remove('hidden');
          readMoreBtn.textContent = 'Show Less';
        } else {
          moreArticles.classList.add('hidden');
          readMoreBtn.textContent = 'Read More';
        }
      });
    }
  }

  // Call setupReadMore in the DOMContentLoaded listener
  document.addEventListener('DOMContentLoaded', () => {
    setupReadMore();
  });

  // ------- Utilities ----------
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

})();
