// Redirect if already logged in
if (localStorage.getItem('dashboardUser')) {
    window.location.href = 'dashboard.html';
}

function toggleView(view) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const subtitle = document.getElementById('authSubtitle');
    const errorBox = document.getElementById('errorBox');

    // Clear errors
    errorBox.style.display = 'none';

    if (view === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
        subtitle.innerText = 'Create a new dashboard account';
    } else {
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
        subtitle.innerText = 'Please enter your details to sign in';
    }
}

function showError(msg) {
    const errorBox = document.getElementById('errorBox');
    errorBox.innerText = msg;
    errorBox.style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('dashboardUser', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            showError(data.error || "Login Failed.");
        }
    } catch (err) {
        showError("Network error. Is the server running?");
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const user = document.getElementById('signupUser').value.trim();
    const pass = document.getElementById('signupPass').value;

    try {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await res.json();
        if (res.ok) {
            // Immediately log them in
            localStorage.setItem('dashboardUser', JSON.stringify({ username: user, role: 'Member' }));
            window.location.href = 'dashboard.html';
        } else {
            showError(data.error || "Signup Failed.");
        }
    } catch (err) {
        showError("Network error. Is the server running?");
    }
}

// Theme Toggle Logic
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerText = isLight ? '🌙' : '🌓';
}

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerText = '🌙';
}
