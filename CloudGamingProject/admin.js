async function fetchUsers() {
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Network response not ok');
    const users = await res.json();
    renderUsers(users);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5">Error: ${e.message}</td></tr>`;
  }
}

function renderUsers(users) {
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '';
  const list = Object.values(users || {});
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

document.getElementById('btnRefresh').addEventListener('click', fetchUsers);
window.addEventListener('DOMContentLoaded', fetchUsers);

async function fetchVisits() {
  const tbody = document.querySelector('#visitsTable tbody');
  tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  try {
    const res = await fetch('/api/visits');
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    const visits = data.visits || [];
    const badge = document.getElementById('visitCount');
    if (badge) badge.textContent = `Visits: ${data.count || visits.length}`;
    renderVisits(visits);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4">Error: ${e.message}</td></tr>`;
  }
}

function renderVisits(visits) {
  const tbody = document.querySelector('#visitsTable tbody');
  tbody.innerHTML = '';
  if (!visits || visits.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No visits yet.</td></tr>';
    return;
  }
  visits.slice().reverse().forEach((v, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${escapeHtml(v.ts)}</td>
      <td>${escapeHtml(v.ip)}</td>
      <td style="max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${escapeHtml(v.ua)}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('btnRefreshVisits').addEventListener('click', fetchVisits);
window.addEventListener('DOMContentLoaded', fetchVisits);
