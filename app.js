(() => {
  'use strict';

  const STORAGE_KEY = 'gestion-locative-v1';

  const VIEW_META = {
    dashboard: { title: 'Tableau de bord' },
    apartments: { title: 'Appartements' },
    tenants:    { title: 'Locataires' },
    leases:     { title: 'Locations' },
    payments:   { title: 'Loyers et paiements' },
    charges:    { title: 'Charges' },
  };

  const defaultState = () => ({
    apartments: [],
    tenants: [],
    leases: [],
    payments: [],
    charges: [],
  });

  let state = load();
  let currentView = 'dashboard';

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return { ...defaultState(), ...JSON.parse(raw) };
    } catch (e) {
      return defaultState();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function fmtMoney(n) {
    return (Number(n) || 0).toLocaleString('fr-FR', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
    });
  }

  function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('fr-FR');
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function findApartment(id) { return state.apartments.find(a => a.id === id); }
  function findTenant(id)    { return state.tenants.find(t => t.id === id); }
  function findLease(id)     { return state.leases.find(l => l.id === id); }

  function leaseLabel(lease) {
    if (!lease) return '—';
    const apt = findApartment(lease.apartmentId);
    const ten = findTenant(lease.tenantId);
    return `${apt ? apt.name : '?'} — ${ten ? ten.firstName + ' ' + ten.lastName : '?'}`.trim();
  }

  function isLeaseActive(lease) {
    const today = todayISO();
    if (lease.startDate && lease.startDate > today) return false;
    if (lease.endDate   && lease.endDate   < today) return false;
    return true;
  }

  // ── Routing ────────────────────────────────────────────

  function setView(name) {
    currentView = name;
    document.querySelectorAll('.nav-item').forEach(el =>
      el.classList.toggle('active', el.dataset.view === name)
    );
    const meta = VIEW_META[name] || {};
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = meta.title || '';
    closeSidebar();
    render();
  }

  // ── Rendering ──────────────────────────────────────────

  function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    const tpl = document.getElementById(`tpl-${currentView}`);
    if (!tpl) return;
    app.appendChild(tpl.content.cloneNode(true));

    const fns = {
      dashboard: renderDashboard,
      apartments: renderApartments,
      tenants:    renderTenants,
      leases:     renderLeases,
      payments:   renderPayments,
      charges:    renderCharges,
    };
    fns[currentView]?.();
    refreshIcons();
  }

  // ── Dashboard ──────────────────────────────────────────

  function renderDashboard() {
    const stats = computeStats();
    setStat('apartments',  stats.apartments);
    setStat('tenants',     stats.tenants);
    setStat('activeLeases',stats.activeLeases);
    setStat('monthlyRent', fmtMoney(stats.monthlyRent));
    setStat('unpaid',      fmtMoney(stats.unpaid));
    setStat('yearCharges', fmtMoney(stats.yearCharges));

    const activeLeasesBody = document.querySelector('[data-list="active-leases"] tbody');
    const active = state.leases.filter(isLeaseActive);
    activeLeasesBody.innerHTML = !active.length
      ? `<tr><td colspan="5" class="empty-state">Aucune location active</td></tr>`
      : active.map(l => {
          const apt = findApartment(l.apartmentId);
          const ten = findTenant(l.tenantId);
          return `<tr>
            <td>${esc(apt?.name || '—')}</td>
            <td>${esc(ten ? ten.firstName + ' ' + ten.lastName : '—')}</td>
            <td>${fmtDate(l.startDate)}</td>
            <td>${fmtMoney(l.monthlyRent)}</td>
            <td>${fmtMoney(l.monthlyCharges)}</td>
          </tr>`;
        }).join('');

    const recentBody = document.querySelector('[data-list="recent-payments"] tbody');
    const recent = [...state.payments]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 8);
    recentBody.innerHTML = !recent.length
      ? `<tr><td colspan="4" class="empty-state">Aucun paiement</td></tr>`
      : recent.map(p => `<tr>
          <td>${fmtDate(p.date)}</td>
          <td>${esc(leaseLabel(findLease(p.leaseId)))}</td>
          <td>${fmtMoney(p.amount)}</td>
          <td>${statusBadge(p.status)}</td>
        </tr>`).join('');
  }

  function setStat(name, value) {
    const el = document.querySelector(`[data-stat="${name}"]`);
    if (el) el.textContent = value;
  }

  function computeStats() {
    const active = state.leases.filter(isLeaseActive);
    const monthlyRent = active.reduce(
      (s, l) => s + (Number(l.monthlyRent) || 0) + (Number(l.monthlyCharges) || 0), 0
    );
    const unpaid = state.payments
      .filter(p => p.status === 'pending')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const yearCharges = state.charges
      .filter(c => c.date && new Date(c.date) >= oneYearAgo)
      .reduce((s, c) => s + (Number(c.amount) || 0), 0);
    return {
      apartments:   state.apartments.length,
      tenants:      state.tenants.length,
      activeLeases: active.length,
      monthlyRent,
      unpaid,
      yearCharges,
    };
  }

  // ── Apartments ─────────────────────────────────────────

  function renderApartments() {
    bindAdd(() => openApartmentForm());
    const tbody = document.querySelector('[data-list="apartments"] tbody');
    if (!state.apartments.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Aucun appartement — cliquez sur « Nouvel appartement » pour commencer.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.apartments.map(a => `<tr>
      <td><strong>${esc(a.name)}</strong></td>
      <td>${esc(a.address || '')}</td>
      <td>${a.surface ? a.surface + ' m²' : '—'}</td>
      <td>${a.rooms || '—'}</td>
      <td class="muted">${esc(a.notes || '')}</td>
      <td class="row-actions">
        <button class="btn-icon" data-edit="${a.id}"><i data-lucide="pencil"></i>Modifier</button>
        <button class="btn-icon danger" data-delete="${a.id}"><i data-lucide="trash-2"></i>Supprimer</button>
      </td>
    </tr>`).join('');
    tbody.querySelectorAll('[data-edit]').forEach(b =>
      b.addEventListener('click', () => openApartmentForm(b.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach(b =>
      b.addEventListener('click', () => deleteApartment(b.dataset.delete)));
    refreshIcons();
  }

  function deleteApartment(id) {
    const used = state.leases.some(l => l.apartmentId === id)
              || state.charges.some(c => c.apartmentId === id);
    const msg = used
      ? 'Cet appartement est utilisé par des locations ou charges. Supprimer quand même ?'
      : 'Supprimer cet appartement ?';
    if (!confirm(msg)) return;
    state.apartments = state.apartments.filter(a => a.id !== id);
    save(); render();
  }

  // ── Tenants ────────────────────────────────────────────

  function renderTenants() {
    bindAdd(() => openTenantForm());
    const tbody = document.querySelector('[data-list="tenants"] tbody');
    if (!state.tenants.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Aucun locataire enregistré.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.tenants.map(t => `<tr>
      <td><strong>${esc(t.lastName)}</strong></td>
      <td>${esc(t.firstName)}</td>
      <td>${esc(t.email || '')}</td>
      <td>${esc(t.phone || '')}</td>
      <td class="muted">${esc(t.notes || '')}</td>
      <td class="row-actions">
        <button class="btn-icon" data-edit="${t.id}"><i data-lucide="pencil"></i>Modifier</button>
        <button class="btn-icon danger" data-delete="${t.id}"><i data-lucide="trash-2"></i>Supprimer</button>
      </td>
    </tr>`).join('');
    tbody.querySelectorAll('[data-edit]').forEach(b =>
      b.addEventListener('click', () => openTenantForm(b.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach(b =>
      b.addEventListener('click', () => deleteTenant(b.dataset.delete)));
    refreshIcons();
  }

  function deleteTenant(id) {
    const used = state.leases.some(l => l.tenantId === id);
    if (!confirm(used
      ? 'Ce locataire a des locations associées. Supprimer quand même ?'
      : 'Supprimer ce locataire ?')) return;
    state.tenants = state.tenants.filter(t => t.id !== id);
    save(); render();
  }

  // ── Leases ─────────────────────────────────────────────

  function renderLeases() {
    bindAdd(() => openLeaseForm());
    const tbody = document.querySelector('[data-list="leases"] tbody');
    if (!state.leases.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Aucune location.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.leases.map(l => {
      const apt = findApartment(l.apartmentId);
      const ten = findTenant(l.tenantId);
      const active = isLeaseActive(l);
      return `<tr>
        <td><strong>${esc(apt?.name || '—')}</strong></td>
        <td>${esc(ten ? ten.firstName + ' ' + ten.lastName : '—')}</td>
        <td>${fmtDate(l.startDate)}</td>
        <td>${fmtDate(l.endDate) || '—'}</td>
        <td>${fmtMoney(l.monthlyRent)}</td>
        <td>${fmtMoney(l.monthlyCharges)}</td>
        <td>${fmtMoney(l.deposit)}</td>
        <td>${active
          ? `<span class="badge active"><i data-lucide="check"></i>Active</span>`
          : `<span class="badge ended"><i data-lucide="circle-slash"></i>Terminée</span>`}</td>
        <td class="row-actions">
          <button class="btn-icon" data-edit="${l.id}"><i data-lucide="pencil"></i>Modifier</button>
          <button class="btn-icon danger" data-delete="${l.id}"><i data-lucide="trash-2"></i>Supprimer</button>
        </td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('[data-edit]').forEach(b =>
      b.addEventListener('click', () => openLeaseForm(b.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach(b =>
      b.addEventListener('click', () => deleteLease(b.dataset.delete)));
    refreshIcons();
  }

  function deleteLease(id) {
    const used = state.payments.some(p => p.leaseId === id);
    if (!confirm(used
      ? 'Cette location a des paiements enregistrés. Supprimer quand même ?'
      : 'Supprimer cette location ?')) return;
    state.leases = state.leases.filter(l => l.id !== id);
    save(); render();
  }

  // ── Payments ───────────────────────────────────────────

  function renderPayments() {
    bindAdd(() => openPaymentForm());

    document.querySelector('[data-action="generate"]')
      ?.addEventListener('click', generateMonthlyPayments);

    const leaseSelect = document.querySelector('[data-filter="lease"]');
    state.leases.forEach(l => leaseSelect.appendChild(
      Object.assign(document.createElement('option'), { value: l.id, textContent: leaseLabel(l) })
    ));

    const applyFilter = () => {
      const leaseId  = leaseSelect.value;
      const statusV  = document.querySelector('[data-filter="status"]').value;
      let rows = [...state.payments];
      if (leaseId) rows = rows.filter(p => p.leaseId === leaseId);
      if (statusV) rows = rows.filter(p => p.status  === statusV);
      rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const tbody = document.querySelector('[data-list="payments"] tbody');
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Aucun paiement.</td></tr>`;
        refreshIcons();
        return;
      }
      tbody.innerHTML = rows.map(p => `<tr>
        <td>${fmtDate(p.date)}</td>
        <td>${esc(leaseLabel(findLease(p.leaseId)))}</td>
        <td>${p.type === 'charges' ? 'Charges' : 'Loyer'}</td>
        <td><strong>${fmtMoney(p.amount)}</strong></td>
        <td>${statusBadge(p.status)}</td>
        <td class="muted">${esc(p.note || '')}</td>
        <td class="row-actions">
          ${p.status === 'pending'
            ? `<button class="btn-icon success" data-mark="${p.id}"><i data-lucide="check-circle"></i>Marquer payé</button>`
            : ''}
          <button class="btn-icon" data-edit="${p.id}"><i data-lucide="pencil"></i>Modifier</button>
          <button class="btn-icon danger" data-delete="${p.id}"><i data-lucide="trash-2"></i>Supprimer</button>
        </td>
      </tr>`).join('');
      tbody.querySelectorAll('[data-edit]').forEach(b =>
        b.addEventListener('click', () => openPaymentForm(b.dataset.edit)));
      tbody.querySelectorAll('[data-delete]').forEach(b =>
        b.addEventListener('click', () => deletePayment(b.dataset.delete)));
      tbody.querySelectorAll('[data-mark]').forEach(b =>
        b.addEventListener('click', () => markPaid(b.dataset.mark)));
      refreshIcons();
    };

    leaseSelect.addEventListener('change', applyFilter);
    document.querySelector('[data-filter="status"]').addEventListener('change', applyFilter);
    applyFilter();
  }

  function deletePayment(id) {
    if (!confirm('Supprimer ce paiement ?')) return;
    state.payments = state.payments.filter(p => p.id !== id);
    save(); render();
  }

  function markPaid(id) {
    const p = state.payments.find(x => x.id === id);
    if (!p) return;
    p.status = 'paid';
    save(); render();
  }

  function generateMonthlyPayments() {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let added = 0;
    state.leases.filter(isLeaseActive).forEach(l => {
      const exists = state.payments.some(
        p => p.leaseId === l.id && p.type === 'rent' && (p.date || '').startsWith(prefix)
      );
      if (!exists && Number(l.monthlyRent) > 0) {
        state.payments.push({
          id: uid(),
          leaseId: l.id,
          date: `${prefix}-05`,
          amount: Number(l.monthlyRent) + (Number(l.monthlyCharges) || 0),
          type: 'rent',
          status: 'pending',
          note: 'Généré automatiquement',
        });
        added++;
      }
    });
    save(); render();
    alert(added
      ? `${added} paiement(s) généré(s) pour ${prefix}.`
      : 'Tous les paiements du mois en cours existent déjà.');
  }

  // ── Charges ────────────────────────────────────────────

  function renderCharges() {
    bindAdd(() => openChargeForm());

    const aptSelect = document.querySelector('[data-filter="apartment"]');
    state.apartments.forEach(a => aptSelect.appendChild(
      Object.assign(document.createElement('option'), { value: a.id, textContent: a.name })
    ));

    const applyFilter = () => {
      const f = aptSelect.value;
      let rows = f ? state.charges.filter(c => c.apartmentId === f) : [...state.charges];
      rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const tbody = document.querySelector('[data-list="charges"] tbody');
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Aucune charge.</td></tr>`;
        refreshIcons();
        return;
      }
      tbody.innerHTML = rows.map(c => `<tr>
        <td>${fmtDate(c.date)}</td>
        <td>${esc(findApartment(c.apartmentId)?.name || '—')}</td>
        <td><span class="category-chip">${esc(c.category || '')}</span></td>
        <td>${esc(c.label || '')}</td>
        <td><strong>${fmtMoney(c.amount)}</strong></td>
        <td class="row-actions">
          <button class="btn-icon" data-edit="${c.id}"><i data-lucide="pencil"></i>Modifier</button>
          <button class="btn-icon danger" data-delete="${c.id}"><i data-lucide="trash-2"></i>Supprimer</button>
        </td>
      </tr>`).join('');
      tbody.querySelectorAll('[data-edit]').forEach(b =>
        b.addEventListener('click', () => openChargeForm(b.dataset.edit)));
      tbody.querySelectorAll('[data-delete]').forEach(b =>
        b.addEventListener('click', () => deleteCharge(b.dataset.delete)));
      refreshIcons();
    };
    aptSelect.addEventListener('change', applyFilter);
    applyFilter();
  }

  function deleteCharge(id) {
    if (!confirm('Supprimer cette charge ?')) return;
    state.charges = state.charges.filter(c => c.id !== id);
    save(); render();
  }

  // ── Helpers ────────────────────────────────────────────

  function bindAdd(handler) {
    document.querySelector('[data-action="add"]')?.addEventListener('click', handler);
  }

  function statusBadge(status) {
    return status === 'paid'
      ? `<span class="badge paid"><i data-lucide="check-circle-2"></i>Payé</span>`
      : `<span class="badge pending"><i data-lucide="clock"></i>En attente</span>`;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  // ── Modal ──────────────────────────────────────────────

  const modal     = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalForm  = document.getElementById('modal-form');

  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  function openModal(title, fields, initial, onSubmit) {
    modalTitle.textContent = title;
    modalForm.innerHTML = '';
    const data = { ...initial };

    fields.forEach(f => {
      if (f.type === 'row') {
        const row = document.createElement('div');
        row.className = 'field-row';
        f.fields.forEach(sub => row.appendChild(buildField(sub, data)));
        modalForm.appendChild(row);
      } else {
        modalForm.appendChild(buildField(f, data));
      }
    });

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML = `<button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
      <button type="submit" class="btn-primary"><i data-lucide="save"></i>Enregistrer</button>`;
    modalForm.appendChild(actions);
    modalForm.querySelector('#cancel-btn').addEventListener('click', closeModal);

    modalForm.onsubmit = e => {
      e.preventDefault();
      onSubmit(collect(modalForm, fields));
      closeModal();
      render();
    };

    modal.hidden = false;
    refreshIcons();
    setTimeout(() => modalForm.querySelector('input,select,textarea')?.focus(), 30);
  }

  function buildField(f, data) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const id = `f-${f.name}`;
    wrap.innerHTML = `<label for="${id}">${f.label}${f.required ? ' *' : ''}</label>`;
    const value = data[f.name] ?? f.default ?? '';
    let el;

    if (f.type === 'select') {
      el = document.createElement('select');
      el.id = id; el.name = f.name;
      if (!f.required) el.appendChild(new Option('—', ''));
      f.options.forEach(o => {
        const opt = new Option(o.label, o.value);
        if (String(value) === String(o.value)) opt.selected = true;
        el.appendChild(opt);
      });
    } else if (f.type === 'textarea') {
      el = document.createElement('textarea');
      el.id = id; el.name = f.name; el.value = value;
    } else {
      el = document.createElement('input');
      el.id = id; el.name = f.name;
      el.type = f.type || 'text';
      if (f.step) el.step = f.step;
      if (f.min !== undefined) el.min = f.min;
      el.value = value;
    }
    if (f.required) el.required = true;
    wrap.appendChild(el);
    return wrap;
  }

  function flatten(fields) {
    return fields.flatMap(f => f.type === 'row' ? f.fields : [f]);
  }

  function collect(form, fields) {
    return Object.fromEntries(flatten(fields).map(f => {
      const el = form.elements[f.name];
      if (!el) return [f.name, null];
      return [f.name, f.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value];
    }));
  }

  function closeModal() {
    modal.hidden = true;
    modalForm.innerHTML = '';
  }

  // ── Form definitions ───────────────────────────────────

  function openApartmentForm(id) {
    const editing = id ? findApartment(id) : null;
    openModal(editing ? 'Modifier l\'appartement' : 'Nouvel appartement', [
      { name: 'name',    label: 'Nom / référence', required: true },
      { name: 'address', label: 'Adresse' },
      { type: 'row', fields: [
        { name: 'surface', label: 'Surface (m²)', type: 'number', step: '0.1', min: 0 },
        { name: 'rooms',   label: 'Pièces',        type: 'number', min: 0 },
      ]},
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ], editing || {}, data => {
      if (editing) Object.assign(editing, data);
      else state.apartments.push({ id: uid(), ...data });
      save();
    });
  }

  function openTenantForm(id) {
    const editing = id ? findTenant(id) : null;
    openModal(editing ? 'Modifier le locataire' : 'Nouveau locataire', [
      { type: 'row', fields: [
        { name: 'lastName',  label: 'Nom',    required: true },
        { name: 'firstName', label: 'Prénom', required: true },
      ]},
      { name: 'email', label: 'Email',     type: 'email' },
      { name: 'phone', label: 'Téléphone'  },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ], editing || {}, data => {
      if (editing) Object.assign(editing, data);
      else state.tenants.push({ id: uid(), ...data });
      save();
    });
  }

  function openLeaseForm(id) {
    if (!state.apartments.length || !state.tenants.length) {
      alert('Ajoutez au moins un appartement et un locataire avant de créer une location.');
      return;
    }
    const editing = id ? findLease(id) : null;
    openModal(editing ? 'Modifier la location' : 'Nouvelle location', [
      { name: 'apartmentId', label: 'Appartement', type: 'select', required: true,
        options: state.apartments.map(a => ({ value: a.id, label: a.name })) },
      { name: 'tenantId', label: 'Locataire', type: 'select', required: true,
        options: state.tenants.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` })) },
      { type: 'row', fields: [
        { name: 'startDate', label: 'Date de début', type: 'date', required: true, default: todayISO() },
        { name: 'endDate',   label: 'Date de fin',   type: 'date' },
      ]},
      { type: 'row', fields: [
        { name: 'monthlyRent',    label: 'Loyer mensuel (€)',    type: 'number', step: '0.01', min: 0, required: true },
        { name: 'monthlyCharges', label: 'Charges mensuelles (€)', type: 'number', step: '0.01', min: 0, default: 0 },
      ]},
      { name: 'deposit', label: 'Dépôt de garantie (€)', type: 'number', step: '0.01', min: 0 },
    ], editing || {}, data => {
      if (editing) Object.assign(editing, data);
      else state.leases.push({ id: uid(), ...data });
      save();
    });
  }

  function openPaymentForm(id) {
    if (!state.leases.length) {
      alert('Créez d\'abord une location.');
      return;
    }
    const editing = id ? state.payments.find(p => p.id === id) : null;
    openModal(editing ? 'Modifier le paiement' : 'Nouveau paiement', [
      { name: 'leaseId', label: 'Location', type: 'select', required: true,
        options: state.leases.map(l => ({ value: l.id, label: leaseLabel(l) })) },
      { type: 'row', fields: [
        { name: 'date',   label: 'Date',         type: 'date',   required: true, default: todayISO() },
        { name: 'amount', label: 'Montant (€)',   type: 'number', step: '0.01', min: 0, required: true },
      ]},
      { type: 'row', fields: [
        { name: 'type',   label: 'Type', type: 'select', required: true,
          options: [{ value: 'rent', label: 'Loyer' }, { value: 'charges', label: 'Charges' }] },
        { name: 'status', label: 'Statut', type: 'select', required: true,
          options: [{ value: 'paid', label: 'Payé' }, { value: 'pending', label: 'En attente' }] },
      ]},
      { name: 'note', label: 'Note', type: 'textarea' },
    ], editing || { type: 'rent', status: 'paid' }, data => {
      if (editing) Object.assign(editing, data);
      else state.payments.push({ id: uid(), ...data });
      save();
    });
  }

  function openChargeForm(id) {
    if (!state.apartments.length) {
      alert('Ajoutez d\'abord un appartement.');
      return;
    }
    const editing = id ? state.charges.find(c => c.id === id) : null;
    openModal(editing ? 'Modifier la charge' : 'Nouvelle charge', [
      { name: 'apartmentId', label: 'Appartement', type: 'select', required: true,
        options: state.apartments.map(a => ({ value: a.id, label: a.name })) },
      { type: 'row', fields: [
        { name: 'date',   label: 'Date',        type: 'date',   required: true, default: todayISO() },
        { name: 'amount', label: 'Montant (€)', type: 'number', step: '0.01', min: 0, required: true },
      ]},
      { name: 'category', label: 'Catégorie', type: 'select', required: true,
        options: ['Taxe foncière','Copropriété','Travaux','Assurance','Entretien','Autre']
          .map(v => ({ value: v, label: v })) },
      { name: 'label', label: 'Libellé' },
    ], editing || {}, data => {
      if (editing) Object.assign(editing, data);
      else state.charges.push({ id: uid(), ...data });
      save();
    });
  }

  // ── Sidebar (mobile) ───────────────────────────────────

  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('overlay');

  document.getElementById('menu-toggle').addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  });
  overlay.addEventListener('click', closeSidebar);

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  // ── Import / Export ────────────────────────────────────

  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `gestion-locative-${todayISO()}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-btn').addEventListener('click', () =>
    document.getElementById('import-file').click()
  );

  document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!confirm('Remplacer les données actuelles par celles du fichier ?')) return;
        state = { ...defaultState(), ...parsed };
        save(); render();
      } catch (err) {
        alert('Fichier invalide : ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ── Navigation init ────────────────────────────────────

  document.querySelectorAll('.nav-item').forEach(b =>
    b.addEventListener('click', () => setView(b.dataset.view))
  );

  setView('dashboard');
})();
