const API_BASE_URL = "http://localhost:3000";
let allClients = [];

// ==================== API CALLS ====================

async function fetchClients() {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${API_BASE_URL}/api/clients`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch clients");
    allClients = await res.json();
    return allClients;
  } catch (err) {
    console.error("Error fetching clients:", err);
  }
}

async function deleteClient(id) {
  if (!confirm("Are you sure you want to remove this client from the database?")) return;

  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert("Client successfully removed.");
      location.reload();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to remove client.");
    }
  } catch (err) {
    console.error("Error deleting client:", err);
  }
}

async function saveClient(event) {
  event.preventDefault();
  const id = document.getElementById('clientId')?.value;
  const isEdit = !!id;

  const clientData = {
    username: document.getElementById('username')?.value,
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
  };

  const token = localStorage.getItem("authToken");
  const url = isEdit ? `${API_BASE_URL}/api/clients/${id}` : `${API_BASE_URL}/api/clients`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(clientData)
    });

    if (res.ok) {
      alert(isEdit ? "Client updated!" : "Client created!");
      window.location.href = 'list.html';
    } else {
      const data = await res.json();
      alert(data.error || "Save failed.");
    }
  } catch (err) {
    console.error("Error saving client:", err);
  }
}

// ==================== UI RENDERING ====================

async function loadClientsList() {
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  grid.innerHTML = '<p style="grid-column: 1/-1;">Calibrating customer data...</p>';

  await fetchClients();

  if (!allClients || allClients.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1;">No scientific observations (clients) found in the database.</p>';
    return;
  }

  grid.innerHTML = allClients.map(c => `
        <div class="client-card">
            <div class="client-avatar">${(c.name || c.username || "?")[0].toUpperCase()}</div>
            <div class="client-content">
                <h3 class="client-name">${c.name || c.username}</h3>
                <div class="client-email"><i class="fas fa-envelope"></i> ${c.email || "No email recorded"}</div>
                <div class="client-info"><i class="fas fa-calendar"></i> Joined: ${new Date(c.registrationDate || Date.now()).toLocaleDateString('fr-FR')}</div>
                <div class="client-info"><i class="fas fa-location-dot"></i> ${c.address || "No address recorded"}</div>
                
                <div class="client-actions">
                    <a href="edit.html?id=${c.id}" class="action-btn edit"><i class="fas fa-user-edit"></i> Edit</a>
                    <button onclick="deleteClient(${c.id})" class="action-btn delete"><i class="fas fa-user-minus"></i> Remove</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function prefillClientForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return;

  await fetchClients();
  const client = allClients.find(c => c.id == id);

  if (client) {
    document.getElementById('clientId').value = client.id;
    document.getElementById('name').value = client.name || '';
    document.getElementById('email').value = client.email || '';
    document.getElementById('phone').value = client.phone || '';
    document.getElementById('address').value = client.address || '';
    if (document.getElementById('username')) {
      document.getElementById('username').value = client.username || '';
      document.getElementById('username').disabled = true; // Typically don't change username
    }
  }
}

// Export functions
window.loadClientsList = loadClientsList;
window.deleteClient = deleteClient;
window.saveClient = saveClient;
window.prefillClientForm = prefillClientForm;
