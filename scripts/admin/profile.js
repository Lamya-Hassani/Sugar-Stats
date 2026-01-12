const API_BASE_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('authUser')) || JSON.parse(localStorage.getItem('user'));

    if (!user || user.role !== 'admin') {
        window.location.href = '../auth.html';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/clients/${user.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
        });

        if (res.ok) {
            const freshUser = await res.json();
            populateForm(freshUser);
        } else {
            // Fallback to local storage if API fails (or if endpoint is different)
            populateForm(user);
        }

    } catch (e) {
        populateForm(user);
    }
});

function populateForm(data) {
    document.getElementById('adminId').value = data.id;
    document.getElementById('username').value = data.username || '';
    document.getElementById('name').value = data.name || '';
    document.getElementById('email').value = data.email || '';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('adminId').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const payload = {
        name,
        email
    };

    if (password) {
        payload.password = password;
    }

    try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const updatedUser = await res.json();
            // Update local storage
            localStorage.setItem('authUser', JSON.stringify(updatedUser));
            localStorage.setItem('user', JSON.stringify(updatedUser)); 

            window.showToast("Profil mis à jour avec succès !", "success");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            const data = await res.json();
            window.showToast(data.error || "Erreur de mise à jour", "error");
        }
    } catch (err) {
        console.error(err);
        window.showToast("Erreur réseau", "error");
    }
});
