const SERVER_DATA = [
  { id: 'srv-east-01', name: 'East Node 1', status: 'Online', load: '42%', location: 'EU', uptime: '18h 32m' },
  { id: 'srv-us-west', name: 'West Node 2', status: 'Online', load: '37%', location: 'US', uptime: '12h 05m' },
  { id: 'srv-apac-03', name: 'APAC Node 3', status: 'Maintenance', load: '68%', location: 'APAC', uptime: '2h 20m' }
];

const PLAN_DATA = [
  { id: 'basic', name: 'Basic', price: 'Free', users: 'Unlimited', status: 'Active' },
  { id: 'pro', name: 'Pro', price: '$9.99/mo', users: 'Priority', status: 'Active' },
  { id: 'enterprise', name: 'Enterprise', price: '$29.99/mo', users: 'Premium', status: 'Active' }
];

const USER_DATA = [
  { id: 'guest-001', name: 'Guest User', device: 'Web Browser', connected_at: '2026-07-25 12:32:00' },
  { id: 'guest-002', name: 'Guest User 2', device: 'Mobile', connected_at: '2026-07-25 12:35:45' }
];

const VISIT_DATA = [
  { ts: '2026-07-25 12:32:00', ip: '127.0.0.1', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome' },
  { ts: '2026-07-25 12:35:45', ip: '127.0.0.1', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) Safari' }
];

let currentUsers = [];
let currentVisits = [];
let currentServers = [];
let currentPlans = [];
let currentMaintenanceEnabled = false;

function ensureAdminNotice() {
  let el = document.getElementById('adminNotice');
  if (!el) {
    el = document.createElement('div');
    el.id = 'adminNotice';
    el.style.position = 'fixed';
    el.style.top = '12px';
    el.style.right = '12px';
    el.style.zIndex = '1050';
    document.body.appendChild(el);
  }
  return el;
}

function showAdminNotice(message, timeout = 6000) {
  const container = ensureAdminNotice();
  const note = document.createElement('div');
  note.className = 'alert alert-warning';
  note.style.minWidth = '220px';
  note.textContent = message;
  container.appendChild(note);
  setTimeout(() => note.remove(), timeout);
}

async function fetchUsers() {
  const tbody = document.querySelector('#usersTable tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
  try {
    if (location.protocol === 'file:') {
      showAdminNotice('Admin must be opened via the server (http://localhost:5000/admin.html)');
      throw new Error('Opened via file:// — cannot reach API');
    }
    const res = await fetch(`${location.origin}/api/users`);
    if (!res.ok) throw new Error('Network response not ok');
    const users = await res.json();
    currentUsers = Object.values(users || {});
  } catch (e) {
    console.warn('fetchUsers failed:', e);
    showAdminNotice('Could not reach backend — showing sample data');
    currentUsers = USER_DATA.slice();
  }
  renderUsers(currentUsers);
  updateDashboardStats();
}

function renderUsers(users) {
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const list = users || [];
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No connected users.</td></tr>';
    return;
  }

  list.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(u.id)}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.device || '')}</td>
      <td>${escapeHtml(u.connected_at || '')}</td>
      <td><button class="btn btn-sm btn-danger btn-delete" data-id="${escapeHtml(u.id)}">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', onDelete));
  updateDashboardStats();
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function onDelete(e) {
  const id = e.currentTarget.dataset.id;
  if (!confirm(`Delete user ${id}?`)) return;
  try {
    const res = await fetch('/api/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      fetchUsers();
    } else {
      alert('Delete failed: ' + (data.message || res.statusText));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function showPanel(panelId) {
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  const target = document.getElementById(panelId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }
  const button = document.querySelector(`.sidebar-item[data-panel="${panelId}"]`);
  if (button) button.classList.add('active');
}

function updateDashboardStats() {
  const usersCount = document.getElementById('usersCount');
  const visitsCount = document.getElementById('visitsCount');
  const dashboardUsers = document.getElementById('dashboardUsers');
  const dashboardVisits = document.getElementById('dashboardVisits');
  const dashboardServers = document.getElementById('dashboardServers');
  const dashboardPlans = document.getElementById('dashboardPlans');

  const usersTotal = currentUsers.length;
  const visitsTotal = currentVisits.length;
  const serversTotal = currentServers.length;
  const plansTotal = currentPlans.length;

  if (usersCount) usersCount.textContent = `Users: ${usersTotal}`;
  if (visitsCount) visitsCount.textContent = `Visits: ${visitsTotal}`;
  if (dashboardUsers) dashboardUsers.textContent = usersTotal;
  if (dashboardVisits) dashboardVisits.textContent = visitsTotal;
  if (dashboardServers) dashboardServers.textContent = serversTotal;
  if (dashboardPlans) dashboardPlans.textContent = plansTotal;
}

async function fetchMaintenanceState() {
  const badge = document.getElementById('maintenanceStatusBadge');
  if (badge) badge.textContent = 'Checking...';
  try {
    if (location.protocol === 'file:') throw new Error('file protocol');
    const res = await fetch(`${location.origin}/api/maintenance`);
    if (!res.ok) throw new Error('Network response not ok');
    const json = await res.json();
    currentMaintenanceEnabled = Boolean(json.maintenance);
  } catch (e) {
    console.warn('fetchMaintenanceState failed:', e);
    showAdminNotice('Không thể tải trạng thái bảo trì.');
    currentMaintenanceEnabled = false;
  }
  updateMaintenanceControls();
  return currentMaintenanceEnabled;
}

function updateMaintenanceControls() {
  const button = document.getElementById('btnToggleMaintenance');
  const badge = document.getElementById('maintenanceStatusBadge');
  if (badge) {
    badge.textContent = currentMaintenanceEnabled ? 'Maintenance ON' : 'Maintenance OFF';
    badge.className = `badge ${currentMaintenanceEnabled ? 'bg-warning text-dark' : 'bg-success text-dark'} py-2 px-3`;
  }
  if (button) {
    button.textContent = currentMaintenanceEnabled ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode';
  }
}

async function setMaintenanceState(enabled) {
  try {
    const res = await fetch(`${location.origin}/api/maintenance/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maintenance: enabled })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      currentMaintenanceEnabled = Boolean(data.maintenance);
      showAdminNotice(`Maintenance mode ${currentMaintenanceEnabled ? 'enabled' : 'disabled'}.`);
    } else {
      throw new Error(data.message || 'Unable to update maintenance mode');
    }
  } catch (err) {
    console.warn('setMaintenanceState failed:', err);
    showAdminNotice('Không thể cập nhật chế độ bảo trì.');
  }
  updateMaintenanceControls();
  return currentMaintenanceEnabled;
}

function filterUsers(query) {
  const normalized = (query || '').trim().toLowerCase();
  const filtered = currentUsers.filter(user => {
    return user.id.toLowerCase().includes(normalized) ||
      user.name.toLowerCase().includes(normalized) ||
      (user.device || '').toLowerCase().includes(normalized);
  });
  renderUsers(filtered);
}

function filterVisits(query) {
  const normalized = (query || '').trim().toLowerCase();
  const filtered = currentVisits.filter(visit => {
    return visit.ts.toLowerCase().includes(normalized) ||
      visit.ip.toLowerCase().includes(normalized) ||
      visit.ua.toLowerCase().includes(normalized);
  });
  renderVisits(filtered);
}

async function fetchServers() {
  const grid = document.getElementById('serversGrid');
  if (grid) grid.innerHTML = '<div class="server-card">Loading servers...</div>';
  try {
    if (location.protocol === 'file:') throw new Error('file protocol');
    const res = await fetch(`${location.origin}/api/servers`);
    if (!res.ok) throw new Error('Network response not ok');
    currentServers = await res.json();
  } catch (e) {
    console.warn('fetchServers failed:', e);
    showAdminNotice('Could not fetch servers from backend — using defaults');
    currentServers = SERVER_DATA;
  }
  renderServers(currentServers);
  updateDashboardStats();
}

function renderServers(servers) {
  const grid = document.getElementById('serversGrid');
  if (!grid) return;
  const list = servers || [];
  if (list.length === 0) {
    grid.innerHTML = '<div class="server-card">No servers configured.</div>';
    return;
  }

  grid.innerHTML = '';
  list.forEach(server => {
    const card = document.createElement('div');
    card.className = 'server-card';
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h3 class="h6 mb-1">${escapeHtml(server.name)}</h3>
          <small class="text-muted">${escapeHtml(server.location)}</small>
        </div>
        <span class="badge ${server.status === 'Online' ? 'bg-success' : server.status === 'Maintenance' ? 'bg-warning text-dark' : 'bg-secondary'}">${escapeHtml(server.status)}</span>
      </div>
      <p class="mb-1 text-muted">Load: ${escapeHtml(server.load || 'N/A')}</p>
      <p class="mb-1 text-muted">Uptime: ${escapeHtml(server.uptime || 'N/A')}</p>
      <button class="btn btn-sm btn-outline-light mt-3" data-action="toggle-server" data-id="${escapeHtml(server.id)}">${server.status === 'Online' ? 'Put in Maintenance' : 'Return Online'}</button>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-action="toggle-server"]').forEach(button => {
    button.addEventListener('click', () => {
      const serverId = button.dataset.id;
      const server = currentServers.find(item => item.id === serverId);
      if (server) toggleServerStatus(server);
    });
  });
}

async function fetchPlans() {
  const grid = document.getElementById('plansGrid');
  if (grid) grid.innerHTML = '<div class="plan-card">Loading plans...</div>';
  try {
    if (location.protocol === 'file:') throw new Error('file protocol');
    const res = await fetch(`${location.origin}/api/plans`);
    if (!res.ok) throw new Error('Network response not ok');
    currentPlans = await res.json();
  } catch (e) {
    console.warn('fetchPlans failed:', e);
    showAdminNotice('Could not fetch plans from backend — using defaults');
    currentPlans = PLAN_DATA;
  }
  renderPlans(currentPlans);
  updateDashboardStats();
}

function renderPlans(plans) {
  const grid = document.getElementById('plansGrid');
  if (!grid) return;
  const list = plans || [];
  if (list.length === 0) {
    grid.innerHTML = '<div class="plan-card">No plans available.</div>';
    return;
  }

  grid.innerHTML = '';
  list.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h3 class="h6 mb-1">${escapeHtml(plan.name)}</h3>
          <small class="text-muted">${escapeHtml(plan.id)}</small>
        </div>
        <span class="badge ${plan.status === 'Active' ? 'bg-info text-dark' : 'bg-secondary'}">${escapeHtml(plan.status)}</span>
      </div>
      <p class="mb-1 text-muted">Price: ${escapeHtml(plan.price)}</p>
      <p class="mb-1 text-muted">Access: ${escapeHtml(plan.users)}</p>
      <button class="btn btn-sm btn-outline-light mt-3" data-action="toggle-plan" data-id="${escapeHtml(plan.id)}">${plan.status === 'Active' ? 'Disable Plan' : 'Activate Plan'}</button>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-action="toggle-plan"]').forEach(button => {
    button.addEventListener('click', () => {
      const planId = button.dataset.id;
      const plan = currentPlans.find(item => item.id === planId);
      if (plan) togglePlanStatus(plan);
    });
  });
}

async function toggleServerStatus(server) {
  const nextStatus = server.status === 'Online' ? 'Maintenance' : 'Online';
  try {
    const res = await fetch('/api/servers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: server.id, status: nextStatus })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      fetchServers();
    } else {
      alert('Server update failed: ' + (data.message || res.statusText));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function togglePlanStatus(plan) {
  const nextStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
  try {
    const res = await fetch('/api/plans/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, status: nextStatus })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      fetchPlans();
    } else {
      alert('Plan update failed: ' + (data.message || res.statusText));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => item.addEventListener('click', () => showPanel(item.dataset.panel)));

  const btnRefreshUsers = document.getElementById('btnRefreshUsers');
  if (btnRefreshUsers) btnRefreshUsers.addEventListener('click', fetchUsers);

  const usersSearch = document.getElementById('usersSearch');
  if (usersSearch) usersSearch.addEventListener('input', () => filterUsers(usersSearch.value));

  const btnRefreshVisits = document.getElementById('btnRefreshVisits');
  if (btnRefreshVisits) btnRefreshVisits.addEventListener('click', fetchVisits);

  const visitsSearch = document.getElementById('visitsSearch');
  if (visitsSearch) visitsSearch.addEventListener('input', () => filterVisits(visitsSearch.value));

  const btnRefreshServers = document.getElementById('btnRefreshServers');
  if (btnRefreshServers) btnRefreshServers.addEventListener('click', fetchServers);

  const btnRefreshPlans = document.getElementById('btnRefreshPlans');
  if (btnRefreshPlans) btnRefreshPlans.addEventListener('click', fetchPlans);

  const btnReloadDashboard = document.getElementById('btnReloadDashboard');
  if (btnReloadDashboard) btnReloadDashboard.addEventListener('click', () => {
    fetchUsers();
    fetchVisits();
    fetchServers();
    fetchPlans();
    fetchMaintenanceState();
  });

  const btnToggleMaintenance = document.getElementById('btnToggleMaintenance');
  if (btnToggleMaintenance) btnToggleMaintenance.addEventListener('click', () => {
    setMaintenanceState(!currentMaintenanceEnabled);
  });

  const btnClearCache = document.getElementById('btnClearCache');
  if (btnClearCache) btnClearCache.addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });

  const btnExportLogs = document.getElementById('btnExportLogs');
  if (btnExportLogs) btnExportLogs.addEventListener('click', exportVisitLogs);

  const toggleAutoRefresh = document.getElementById('toggleAutoRefresh');
  let autoRefreshInterval = null;
  const setAutoRefresh = enabled => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
    if (enabled) {
      autoRefreshInterval = setInterval(() => {
        fetchUsers();
        fetchVisits();
        fetchServers();
        fetchPlans();
        fetchMaintenanceState();
      }, 15000);
    }
  };
  if (toggleAutoRefresh) {
    toggleAutoRefresh.addEventListener('change', () => {
      setAutoRefresh(toggleAutoRefresh.checked);
    });
    setAutoRefresh(toggleAutoRefresh.checked);
  }

  const toggleDarkMode = document.getElementById('toggleDarkMode');
  if (toggleDarkMode) toggleDarkMode.addEventListener('change', () => {
    document.body.classList.toggle('bg-dark');
    document.body.classList.toggle('text-light');
  });

  fetchUsers();
  fetchVisits();
  fetchServers();
  fetchPlans();
  fetchMaintenanceState();
  showPanel('panel-dashboard');
});
function exportVisitLogs() {
  const rows = currentVisits.map((item, index) => [index + 1, item.ts, item.ip, item.ua]);
  const csv = ['No,Timestamp,IP,User-Agent', ...rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'visit-logs.csv';
  link.click();
  URL.revokeObjectURL(url);
}

async function fetchVisits() {
  const tbody = document.querySelector('#visitsTable tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  try {
    if (location.protocol === 'file:') throw new Error('file protocol');
    const res = await fetch(`${location.origin}/api/visits`);
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    currentVisits = data.visits || [];
    const visitsCount = data.count || currentVisits.length;
    const badge = document.getElementById('visitsCount');
    if (badge) badge.textContent = `Visits: ${visitsCount}`;
  } catch (e) {
    console.warn('fetchVisits failed:', e);
    showAdminNotice('Could not fetch visits — showing sample logs');
    currentVisits = VISIT_DATA.slice();
    const badge = document.getElementById('visitsCount');
    if (badge) badge.textContent = `Visits: ${currentVisits.length}`;
  }
  renderVisits(currentVisits);
  updateDashboardStats();
}

function renderVisits(visits) {
  const tbody = document.querySelector('#visitsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!visits || visits.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No visits yet.</td></tr>';
    return;
  }
  visits.slice().reverse().forEach((v, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(v.ts)}</td>
      <td>${escapeHtml(v.ip)}</td>
      <td style="max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${escapeHtml(v.ua)}</td>
    `;
    tbody.appendChild(tr);
  });
}
