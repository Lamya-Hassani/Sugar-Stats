if (typeof API_BASE_URL === 'undefined') {
  var API_BASE_URL = "http://localhost:3000";
}

// ========== HELPERS ==========

// Token depuis localStorage
function getAuthToken() {
  return localStorage.getItem("authToken") || null;
}

// User depuis localStorage
function getUserInfo() {
  const userJson = localStorage.getItem("authUser");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error("Erreur parsing authUser:", e);
    return null;
  }
}

// Est connecté ?
function isLoggedIn() {
  return !!getAuthToken() && !!getUserInfo();
}

// ========== UI AUTH ==========

function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const user = getUserInfo();

  const authBtn = document.getElementById("auth-btn") || document.querySelector(".login-btn");
  if (authBtn) {
    if (loggedIn) {
      authBtn.textContent = "Mon Profil";
      // Adjust path if needed
      const currentPath = window.location.pathname;
      if (currentPath.includes('pages/')) {
        authBtn.href = "../profile.html";
      } else {
        authBtn.href = "profile.html";
      }
    } else {
      authBtn.textContent = "Connexion";
      if (window.location.pathname.includes('pages/')) {
        // Already in pages/
      } else {
        authBtn.href = "pages/auth.html";
      }
    }
  }
}

// ========== REGISTER ==========

async function handleRegister(event) {
  if (event) event.preventDefault();

  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email") ? document.getElementById("register-email").value.trim() : ""; // Fallback check
  const phone = document.getElementById("register-phone").value.trim();
  const address = document.getElementById("register-address").value.trim();

  // HARDCODED CLIENT ROLE
  const role = "client";

  const msgEl = document.getElementById("register-message");
  if (msgEl) msgEl.textContent = "";

  if (!username || !password) {
    if (msgEl) msgEl.textContent = "Veuillez remplir username et password.";
    return;
  }

  const payload = {
    username,
    password,
    role,
    name: name || username,
    email: email || "",
    phone: phone || "",
    address: address || "",
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      if (msgEl) msgEl.textContent = data.error || "Erreur lors de l'inscription.";
      return;
    }

    if (msgEl) {
      msgEl.style.color = "green";
      msgEl.textContent = "Compte créé ! Veuillez vous connecter.";
    }
    document.getElementById("register-form").reset();

    // Optional: Switch back to login panel after success
    const container = document.getElementById('container');
    if (container) container.classList.remove("right-panel-active");

  } catch (err) {
    console.error(err);
    if (msgEl) {
      msgEl.style.color = "red";
      msgEl.textContent = "Erreur réseau.";
    }
  }
}

// ========== LOGIN ==========

async function handleLogin(event) {
  if (event) event.preventDefault();

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const msgEl = document.getElementById("login-message");
  if (msgEl) msgEl.textContent = "";

  if (!username || !password) {
    if (msgEl) msgEl.textContent = "Veuillez remplir username et password.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (msgEl) {
        msgEl.style.color = "red";
        msgEl.textContent = data.error || "Erreur de connexion.";
      }
      return;
    }

    // Sauvegarde token + user
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUser", JSON.stringify(data.user));

    if (msgEl) {
      msgEl.style.color = "green";
      msgEl.textContent = "Connexion réussie !";
    }

    // Redirect based on role or URL parameter after login
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');

      if (redirect) {
        window.location.href = `../${redirect}`;
      } else if (data.user.role === "admin") {
        window.location.href = "admin/index.html";
      } else {
        window.location.href = "../profile.html";
      }
    }, 1000);


  } catch (err) {
    console.error(err);
    if (msgEl) {
      msgEl.style.color = "red";
      msgEl.textContent = "Erreur réseau.";
    }
  }
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  updateAuthUI();
});