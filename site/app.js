(() => {
  'use strict';

  const STORAGE_KEY = 'foot-geneve-v1';
  const MAX_TERRAINS = 10;
  const DEFAULT_SLOTS = ['07:00','09:00','11:00','13:00','15:00','17:00'];

  const SEED_TERRAINS = [
    { id: 't1',  name: 'Bout-du-Monde — Synthétique 1',  lieu: 'Genève (Champel)',     surface: 'Synthétique',  slots: DEFAULT_SLOTS },
    { id: 't2',  name: 'Bout-du-Monde — Synthétique 2',  lieu: 'Genève (Champel)',     surface: 'Synthétique',  slots: DEFAULT_SLOTS },
    { id: 't3',  name: 'Bout-du-Monde — Gazon A',        lieu: 'Genève (Champel)',     surface: 'Gazon naturel',slots: DEFAULT_SLOTS },
    { id: 't4',  name: 'Centre sportif de Vessy',         lieu: 'Genève (Vessy)',       surface: 'Synthétique',  slots: DEFAULT_SLOTS },
    { id: 't5',  name: 'Centre sportif des Vernets',      lieu: 'Genève (Plainpalais)', surface: 'Synthétique',  slots: DEFAULT_SLOTS },
    { id: 't6',  name: 'Stade de la Fontenette',          lieu: 'Carouge',              surface: 'Synthétique',  slots: DEFAULT_SLOTS },
    { id: 't7',  name: 'Stade de Lancy-Florimont',        lieu: 'Petit-Lancy',          surface: 'Synthétique',  slots: DEFAULT_SLOTS },
    { id: 't8',  name: 'Stade des Arbères',               lieu: 'Meyrin',               surface: 'Synthétique',  slots: DEFAULT_SLOTS },
    { id: 't9',  name: 'Centre des Evaux — Compétition',  lieu: 'Thônex',               surface: 'Gazon naturel',slots: DEFAULT_SLOTS },
    { id: 't10', name: 'Centre des Evaux — Synthétique',  lieu: 'Thônex',               surface: 'Synthétique',  slots: DEFAULT_SLOTS },
  ];

  /* ── State ─────────────────────────────────────── */
  let state = load();
  let currentDate = todayStr();
  let pendingSlot = null;
  let editingTerrainId = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { terrains: SEED_TERRAINS, reservations: [] };
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  /* ── Dates ─────────────────────────────────────── */
  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function formatDateFR(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return new Date(+y, +m - 1, +d).toLocaleDateString('fr-CH', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function isPast(dateStr, timeStr) {
    const [h, min] = timeStr.split(':').map(Number);
    const slot = new Date(dateStr);
    slot.setHours(h, min, 0, 0);
    return slot < new Date();
  }

  function addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function addTwoHours(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const end = new Date(0, 0, 0, h + 2, m);
    return end.getHours().toString().padStart(2,'0') + ':' + end.getMinutes().toString().padStart(2,'0');
  }

  /* ── Reservations ──────────────────────────────── */
  function genCode() { return 'GVA-' + Math.floor(1000 + Math.random() * 9000); }

  function isSlotTaken(terrainId, dateStr, timeStr) {
    return state.reservations.some(r =>
      r.terrainId === terrainId && r.date === dateStr && r.slot === timeStr
    );
  }

  /* ── Navigation ────────────────────────────────── */
  function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === name);
    });
    closeMobileNav();
  }

  function closeMobileNav() {
    document.getElementById('mobile-nav').classList.remove('open');
  }

  /* ── Render booking table ──────────────────────── */
  function renderBookingTable() {
    document.getElementById('current-date').textContent = formatDateFR(currentDate);
    const table = document.getElementById('booking-table');
    table.innerHTML = '';

    // En-tête
    const header = document.createElement('div');
    header.className = 'booking-row booking-header';
    header.innerHTML = `
      <div class="brow-cell"><span class="brow-header-label">Terrain</span></div>
      <div class="brow-cell"><span class="brow-header-label">Lieu</span></div>
      <div class="brow-cell"><span class="brow-header-label">Surface</span></div>
      <div class="brow-cell"><span class="brow-header-label">Créneaux disponibles</span></div>
    `;
    table.appendChild(header);

    state.terrains.forEach(terrain => {
      const row = document.createElement('div');
      row.className = 'booking-row';

      const surfaceClass = terrain.surface === 'Gazon naturel' ? 'brow-surface-gazon' : 'brow-surface-synth';

      const slotsHtml = terrain.slots.map(timeStr => {
        const past  = isPast(currentDate, timeStr);
        const taken = isSlotTaken(terrain.id, currentDate, timeStr);
        const cls   = past ? 'slot-past' : taken ? 'slot-taken' : 'slot-free';
        const label = `${timeStr}–${addTwoHours(timeStr)}`;
        return `<span class="slot-chip ${cls}" data-tid="${terrain.id}" data-slot="${timeStr}">${label}</span>`;
      }).join('');

      row.innerHTML = `
        <div class="brow-cell">
          <div class="brow-name">${esc(terrain.name)}</div>
        </div>
        <div class="brow-cell brow-lieu">${esc(terrain.lieu)}</div>
        <div class="brow-cell ${surfaceClass}">${esc(terrain.surface)}</div>
        <div class="brow-cell brow-slots">${slotsHtml}</div>
      `;

      // Clics sur créneaux libres
      row.querySelectorAll('.slot-chip.slot-free').forEach(chip => {
        chip.addEventListener('click', () => {
          const tid  = chip.dataset.tid;
          const slot = chip.dataset.slot;
          const t    = state.terrains.find(x => x.id === tid);
          openReserveModal(t, slot);
        });
      });

      table.appendChild(row);
    });
  }

  /* ── Reserve modal ─────────────────────────────── */
  function openReserveModal(terrain, timeStr) {
    pendingSlot = { terrain, timeStr };
    document.getElementById('slot-summary').innerHTML = `
      <strong>${esc(terrain.name)}</strong>
      ${formatDateFR(currentDate)}<br>
      ${timeStr} – ${addTwoHours(timeStr)} (2 h) &nbsp;·&nbsp; ${esc(terrain.lieu)} &nbsp;·&nbsp; ${esc(terrain.surface)}
    `;
    document.getElementById('field-name').value = '';
    document.getElementById('field-phone').value = '';
    document.getElementById('field-name').classList.remove('error');
    showModal('modal-reserve');
  }

  function confirmReservation() {
    const name = document.getElementById('field-name').value.trim();
    if (!name) {
      document.getElementById('field-name').classList.add('error');
      document.getElementById('field-name').focus();
      return;
    }
    const code = genCode();
    state.reservations.push({
      code,
      terrainId:   pendingSlot.terrain.id,
      terrainName: pendingSlot.terrain.name,
      date:        currentDate,
      slot:        pendingSlot.timeStr,
      name,
      phone: document.getElementById('field-phone').value.trim(),
      createdAt: new Date().toISOString(),
    });
    save();
    hideModal('modal-reserve');
    document.getElementById('booking-code-display').textContent = code;
    showModal('modal-confirm');
    renderBookingTable();
  }

  /* ── Lookup ────────────────────────────────────── */
  function lookupReservation() {
    const code = document.getElementById('lookup-code').value.trim().toUpperCase();
    const res  = state.reservations.find(r => r.code === code);
    const container = document.getElementById('lookup-result');

    if (!res) {
      container.innerHTML = `<p style="color:var(--red);margin-top:8px">Aucune réservation trouvée pour ce code.</p>`;
      return;
    }

    const past = isPast(res.date, res.slot);
    container.innerHTML = `
      <div class="lookup-result-box">
        <h3>Réservation ${esc(res.code)}</h3>
        <div class="result-row"><span class="result-label">Terrain</span><span class="result-value">${esc(res.terrainName)}</span></div>
        <div class="result-row"><span class="result-label">Date</span><span class="result-value">${formatDateFR(res.date)}</span></div>
        <div class="result-row"><span class="result-label">Créneau</span><span class="result-value">${res.slot} – ${addTwoHours(res.slot)} (2 h)</span></div>
        <div class="result-row"><span class="result-label">Nom</span><span class="result-value">${esc(res.name)}</span></div>
        ${res.phone ? `<div class="result-row"><span class="result-label">Tél.</span><span class="result-value">${esc(res.phone)}</span></div>` : ''}
        <div class="cancel-section">
          ${past
            ? `<p style="color:var(--gray-400);font-size:13px">Ce créneau est passé — annulation impossible.</p>`
            : `<button class="btn btn-danger btn-sm" id="cancel-res-btn">Annuler cette réservation</button>`}
        </div>
      </div>
    `;

    if (!past) {
      document.getElementById('cancel-res-btn').addEventListener('click', () => {
        if (!confirm('Confirmer l\'annulation de cette réservation ?')) return;
        state.reservations = state.reservations.filter(r => r.code !== code);
        save();
        container.innerHTML = `<p style="color:var(--green);margin-top:8px;font-weight:600">Réservation annulée.</p>`;
        document.getElementById('lookup-code').value = '';
        renderBookingTable();
      });
    }
  }

  /* ── Admin ─────────────────────────────────────── */
  function renderAdmin() {
    const list = document.getElementById('admin-list');
    list.innerHTML = '';
    const n = state.terrains.length;
    const countEl = document.getElementById('terrain-count');
    countEl.textContent = `${n} / ${MAX_TERRAINS} terrain${n > 1 ? 's' : ''}`;
    countEl.className = 'terrain-count' + (n >= MAX_TERRAINS ? ' at-limit' : '');
    document.getElementById('add-terrain-btn').disabled = n >= MAX_TERRAINS;

    state.terrains.forEach(terrain => {
      const row = document.createElement('div');
      row.className = 'admin-row';
      const surfaceBadgeClass = terrain.surface === 'Gazon naturel' ? 'badge-surface-gazon' : 'badge-surface-synth';
      row.innerHTML = `
        <div class="admin-row-info">
          <div class="admin-row-name">${esc(terrain.name)}</div>
          <div class="admin-row-meta">
            <span class="badge badge-location"><i data-lucide="map-pin"></i>${esc(terrain.lieu)}</span>
            <span class="badge ${surfaceBadgeClass}">${esc(terrain.surface)}</span>
            <span class="badge badge-location"><i data-lucide="clock"></i>${terrain.slots.length} créneau${terrain.slots.length > 1 ? 'x' : ''}</span>
          </div>
        </div>
        <div class="admin-row-actions">
          <button class="btn btn-ghost btn-sm edit-btn" data-id="${terrain.id}"><i data-lucide="pencil"></i></button>
          <button class="btn btn-danger btn-sm del-btn" data-id="${terrain.id}"><i data-lucide="trash-2"></i></button>
        </div>
      `;
      row.querySelector('.edit-btn').addEventListener('click', () => openTerrainModal(terrain.id));
      row.querySelector('.del-btn').addEventListener('click', () => deleteTerrain(terrain.id));
      list.appendChild(row);
    });

    lucide.createIcons();
  }

  function deleteTerrain(id) {
    const terrain = state.terrains.find(t => t.id === id);
    if (!terrain) return;
    const hasFuture = state.reservations.some(r => r.terrainId === id && !isPast(r.date, r.slot));
    if (hasFuture) { showToast('Ce terrain a des réservations actives — suppression impossible.'); return; }
    if (!confirm(`Supprimer « ${terrain.name} » ?`)) return;
    state.terrains = state.terrains.filter(t => t.id !== id);
    state.reservations = state.reservations.filter(r => r.terrainId !== id);
    save(); renderAdmin(); renderBookingTable();
    showToast('Terrain supprimé.');
  }

  /* ── Terrain modal ─────────────────────────────── */
  function openTerrainModal(id = null) {
    editingTerrainId = id;
    document.getElementById('terrain-modal-title').textContent = id ? 'Modifier le terrain' : 'Ajouter un terrain';
    if (id) {
      const t = state.terrains.find(x => x.id === id);
      document.getElementById('t-name').value    = t.name;
      document.getElementById('t-lieu').value    = t.lieu;
      document.getElementById('t-surface').value = t.surface;
      document.getElementById('t-slots').value   = t.slots.join('\n');
    } else {
      document.getElementById('t-name').value    = '';
      document.getElementById('t-lieu').value    = '';
      document.getElementById('t-surface').value = 'Synthétique';
      document.getElementById('t-slots').value   = DEFAULT_SLOTS.join('\n');
    }
    showModal('modal-terrain');
  }

  function saveTerrain() {
    const name    = document.getElementById('t-name').value.trim();
    const lieu    = document.getElementById('t-lieu').value.trim();
    const surface = document.getElementById('t-surface').value;
    const rawSlots = document.getElementById('t-slots').value
      .split('\n').map(s => s.trim()).filter(s => /^\d{2}:\d{2}$/.test(s));

    if (!name || !lieu) { showToast('Nom et lieu sont obligatoires.'); return; }

    if (editingTerrainId) {
      const t = state.terrains.find(x => x.id === editingTerrainId);
      t.name = name; t.lieu = lieu; t.surface = surface;
      t.slots = rawSlots.length ? rawSlots : DEFAULT_SLOTS;
    } else {
      if (state.terrains.length >= MAX_TERRAINS) { showToast(`Limite de ${MAX_TERRAINS} terrains atteinte.`); return; }
      state.terrains.push({ id: 't' + Date.now(), name, lieu, surface, slots: rawSlots.length ? rawSlots : DEFAULT_SLOTS });
    }
    save(); hideModal('modal-terrain'); renderAdmin(); renderBookingTable();
    showToast(editingTerrainId ? 'Terrain mis à jour.' : 'Terrain ajouté.');
  }

  /* ── Modals ────────────────────────────────────── */
  function showModal(id) { document.getElementById(id).removeAttribute('hidden'); }
  function hideModal(id) { document.getElementById(id).setAttribute('hidden', ''); }

  /* ── Toast ─────────────────────────────────────── */
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ── Escape ────────────────────────────────────── */
  function esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Init ──────────────────────────────────────── */
  function init() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showView(btn.dataset.view);
        if (btn.dataset.view === 'admin') renderAdmin();
        if (btn.dataset.view === 'terrains') renderBookingTable();
      });
    });

    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('mobile-nav').classList.toggle('open');
    });

    document.getElementById('prev-day').addEventListener('click', () => {
      currentDate = addDays(currentDate, -1); renderBookingTable();
    });
    document.getElementById('next-day').addEventListener('click', () => {
      currentDate = addDays(currentDate, 1); renderBookingTable();
    });

    document.getElementById('modal-close').addEventListener('click',       () => hideModal('modal-reserve'));
    document.getElementById('modal-cancel-btn').addEventListener('click',  () => hideModal('modal-reserve'));
    document.getElementById('modal-confirm-btn').addEventListener('click', confirmReservation);
    document.getElementById('modal-reserve').addEventListener('click', e => {
      if (e.target === e.currentTarget) hideModal('modal-reserve');
    });

    document.getElementById('confirm-close').addEventListener('click',  () => hideModal('modal-confirm'));
    document.getElementById('confirm-ok-btn').addEventListener('click', () => hideModal('modal-confirm'));

    document.getElementById('lookup-btn').addEventListener('click', lookupReservation);
    document.getElementById('lookup-code').addEventListener('keydown', e => {
      if (e.key === 'Enter') lookupReservation();
    });

    document.getElementById('add-terrain-btn').addEventListener('click',    () => openTerrainModal());
    document.getElementById('terrain-modal-close').addEventListener('click', () => hideModal('modal-terrain'));
    document.getElementById('terrain-cancel-btn').addEventListener('click',  () => hideModal('modal-terrain'));
    document.getElementById('terrain-save-btn').addEventListener('click',    saveTerrain);
    document.getElementById('modal-terrain').addEventListener('click', e => {
      if (e.target === e.currentTarget) hideModal('modal-terrain');
    });

    renderBookingTable();
    lucide.createIcons();
  }

  init();
})();
