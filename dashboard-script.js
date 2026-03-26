let allDepartments = [];
let allClubs = [];
let allEvents = [];
let chartInstances = {};
let authenticatedUser = null;

window.onload = async function () {
    // Authentication Check
    const storedUser = localStorage.getItem('dashboardUser');
    if (!storedUser) {
        window.location.href = 'auth.html';
        return;
    }

    authenticatedUser = JSON.parse(storedUser);
    document.getElementById('welcomeUser').innerText = authenticatedUser.username;

    setupFormListeners();
    await fetchAllData();
};

function logout() {
    localStorage.removeItem('dashboardUser');
    window.location.href = 'auth.html';
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg || "Action successful!";
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Application Navigation
function showSection(id, element) {
    if (id === "admin") {
        const pwd = prompt("Default admin password is 'Admin123'. Enter Admin Password:");
        if (pwd !== "Admin123") {
            alert("Incorrect Password! Access Denied.");
            return;
        }
    }

    document.querySelectorAll("section").forEach(sec => {
        sec.classList.remove("active");
    });

    document.querySelectorAll(".topNav li").forEach(li => {
        li.classList.remove("active-nav");
    });

    document.getElementById(id).classList.add("active");
    if (element) element.classList.add("active-nav");

    if (id === "overview") {
        setTimeout(drawCharts, 50);
    }
}

// Data Fetching
async function fetchAllData() {
    await Promise.all([
        fetchOverview(),
        fetchDepartments(),
        fetchClubs(),
        fetchEvents(),
        fetchLeaderboard()
    ]);
    drawCharts();
    populateDropdowns();
}

async function fetchOverview() {
    try {
        const res = await fetch('/api/overview');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('totalDepartments').innerText = data.totalDepartments || 0;
            document.getElementById('totalClubs').innerText = data.totalClubs || 0;
            document.getElementById('totalEvents').innerText = data.totalEvents || 0;
            document.getElementById('totalParticipation').innerText = data.totalParticipation || 0;
            document.getElementById('overallScore').innerText = data.overallScore + '/100';
        }
    } catch (err) { console.error(err); }
}

async function fetchDepartments() {
    try {
        const res = await fetch('/api/departments');
        if (res.ok) {
            allDepartments = await res.json();
            renderDepartments();
        }
    } catch (err) { console.error(err); }
}

async function fetchClubs() {
    try {
        const res = await fetch('/api/clubs');
        if (res.ok) {
            allClubs = await res.json();
            renderClubs();
        }
    } catch (err) { console.error(err); }
}

async function fetchEvents() {
    try {
        const res = await fetch('/api/events');
        if (res.ok) {
            allEvents = await res.json();
            renderEvents();
        }
    } catch (err) { console.error(err); }
}

async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
            const data = await res.json();

            const topClubsList = document.getElementById('topClubsList');
            topClubsList.innerHTML = data.topClubs.map(c => `<li>
                <div><span class="clubTag coding-tag">${c.event_count} events</span> ${c.name}</div>
            </li>`).join('') || "<li>No clubs found</li>";

            const topDeptsList = document.getElementById('topDeptsList');
            topDeptsList.innerHTML = data.topDepartments.map(d => `<li>
                <div><span class="clubTag custom-purple-tag">${d.performance_score} pt</span> ${d.name}</div>
            </li>`).join('') || "<li>No departments found</li>";

            if (data.mostActiveClub) {
                document.getElementById('mostActiveClub').innerText = data.mostActiveClub.name;
                document.getElementById('mostActiveClubDesc').innerText = `${data.mostActiveClub.event_count} events conducted`;
            }

            if (data.topEvent) {
                document.getElementById('topEvent').innerText = data.topEvent.name;
                document.getElementById('topEventDesc').innerText = `${data.topEvent.participants} participants`;
            }
        }
    } catch (err) { console.error(err); }
}

// Rendering UI
function renderDepartments() {
    const tableBody = document.getElementById('departmentsTableBody');
    const query = (document.getElementById('searchDept').value || '').toLowerCase();

    let filtered = allDepartments.filter(d => d.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='3' class='text-center text-muted'>No departments found.</td></tr>";
        return;
    }

    tableBody.innerHTML = filtered.map(d => `<tr>
        <td style="font-weight: 500; color: var(--text-main);">${d.name}</td>
        <td><span class="clubTag ${d.performance_score >= 80 ? 'cultural-tag' : 'sports-tag'}" style="margin:0">${d.performance_score}/100</span></td>
        <td><button class="btn btn-glass" style="padding: 5px 10px; font-size: 0.8rem;" onclick="viewDepartment(${d.id})">View Details</button></td>
    </tr>`).join('');
}

function viewDepartment(id) {
    const dept = allDepartments.find(d => d.id === id);
    if (!dept) return;

    // Populate generic info
    document.getElementById('detailDeptName').innerText = dept.name;
    document.getElementById('detailDeptScore').innerText = `${dept.performance_score}/100`;

    // Connect Clubs
    const deptClubs = allClubs.filter(c => c.dept_id === id);
    document.getElementById('detailDeptClubCount').innerText = deptClubs.length;

    const clubsGrid = document.getElementById('detailClubsGrid');
    if (deptClubs.length === 0) {
        clubsGrid.innerHTML = "<div class='text-center text-muted full-width'>No clubs under this department.</div>";
    } else {
        clubsGrid.innerHTML = deptClubs.map(c => `
            <div class="glass-card stat-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
                <div style="display:flex; justify-content: space-between; width: 100%;">
                    <h3 style="color: var(--text-main); font-size: 1.2rem; font-weight: 600;">${c.name}</h3>
                    <span class="clubTag coding-tag" style="margin:0">${c.performance_score} pt</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-muted);">Advisor: ${c.faculty_advisor}</p>
                <span class="clubTag robotics-tag" style="margin-top: 5px;">${c.category}</span>
            </div>
        `).join('');
    }

    // Unselect nav items and show strictly the department details section
    document.querySelectorAll(".topNav li").forEach(li => li.classList.remove("active-nav"));
    document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
    document.getElementById('department-details').classList.add("active");
}

let activeClubCategory = 'All';

function setClubCategory(category, element) {
    activeClubCategory = category;

    // UI Updates
    document.querySelectorAll('.toggle-tag').forEach(tag => {
        tag.style.opacity = '0.6';
        tag.classList.remove('active-tag');
        tag.style.borderWidth = '1px';
    });

    element.style.opacity = '1';
    element.classList.add('active-tag');
    element.style.borderWidth = '2px';

    // Re-render
    renderClubs();
}

function renderClubs() {
    const grid = document.getElementById('clubsGrid');
    const deptFilter = document.getElementById('filterClubDept').value;
    const query = (document.getElementById('searchClub').value || '').toLowerCase();

    let filtered = allClubs.filter(c => {
        const matchDept = deptFilter === 'All' || c.dept_id == deptFilter;
        const matchSearch = c.name.toLowerCase().includes(query) || (c.dept_name && c.dept_name.toLowerCase().includes(query));
        const matchCat = activeClubCategory === 'All' || c.category === activeClubCategory;
        return matchDept && matchSearch && matchCat;
    });

    if (filtered.length === 0) {
        grid.innerHTML = "<div class='text-center text-muted full-width'>No clubs found.</div>";
        return;
    }

    grid.innerHTML = filtered.map(c => `
        <div class="glass-card stat-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
            <div style="display:flex; justify-content: space-between; width: 100%;">
                <h3 style="color: var(--text-main); font-size: 1.2rem; font-weight: 600;">${c.name}</h3>
                <span class="clubTag coding-tag" style="margin:0">${c.performance_score} pt</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--accent-purple);">${c.dept_name || 'No Dept'}</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Advisor: ${c.faculty_advisor}</p>
            <span class="clubTag robotics-tag" style="margin-top: 5px;">${c.category}</span>
        </div>
    `).join('');
}

function renderEvents() {
    const tableBody = document.getElementById('eventsTableBody');
    const clubFilter = document.getElementById('filterEventClub').value;
    const query = (document.getElementById('searchEvent').value || '').toLowerCase();

    let filtered = allEvents.filter(e => {
        const matchClub = clubFilter === 'All' || e.club_id == clubFilter;
        const matchSearch = e.name.toLowerCase().includes(query) || e.description.toLowerCase().includes(query);
        return matchClub && matchSearch;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='5' class='text-center text-muted'>No events found.</td></tr>";
        return;
    }

    tableBody.innerHTML = filtered.map(e => `<tr>
        <td>
            <div style="font-weight: 500; color: var(--text-main);">${e.name}</div>
            <div class="text-muted" style="font-size: 0.8rem;">${e.description}</div>
            ${e.image_url ? `<a href="${e.image_url}" target="_blank" style="font-size: 0.8rem; color: var(--accent-cyan);">View Attachment</a>` : ''}
        </td>
        <td>${e.club_name || 'N/A'}<br><span style="font-size: 0.75rem; color: var(--accent-purple);">${e.dept_name || ''}</span></td>
        <td>${e.date}</td>
        <td><span class="clubTag cultural-tag" style="margin:0">${e.participants}</span></td>
        <td>
            <button class="btn btn-glass" style="padding: 5px 10px; font-size: 0.8rem; border-color: #ff4757; color: #ff4757;" onclick="deleteEvent(${e.id})">Delete</button>
        </td>
    </tr>`).join('');
}

function populateDropdowns() {
    // Admin Add Forms
    const clubDeptSelect = document.getElementById('newClubDeptId');
    const eventClubSelect = document.getElementById('newEventClubId');
    const partEventSelect = document.getElementById('partEventId');

    // Filter Dropdowns
    const filterClubDept = document.getElementById('filterClubDept');
    const filterEventClub = document.getElementById('filterEventClub');

    let deptOptions = "<option value='All'>All Departments</option>" +
        allDepartments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

    let clubOptions = "<option value='All'>All Clubs</option>" +
        allClubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    let eventOptions = allEvents.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

    if (filterClubDept) filterClubDept.innerHTML = deptOptions;
    if (clubDeptSelect) clubDeptSelect.innerHTML = allDepartments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

    if (filterEventClub) filterEventClub.innerHTML = clubOptions;
    if (eventClubSelect) eventClubSelect.innerHTML = allClubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (partEventSelect) partEventSelect.innerHTML = eventOptions;
}

// Chart Visualization
async function drawCharts() {
    try {
        const res = await fetch('/api/analytics');
        if (!res.ok) return;
        const data = await res.json();

        const isLight = document.body.classList.contains('light-mode');
        Chart.defaults.color = isLight ? '#0f172a' : 'rgba(255,255,255,0.7)';
        Chart.defaults.font.family = 'Outfit, sans-serif';
        const gridColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)';

        // 1. Bar Chart (Club Scores)
        if (chartInstances.bar) chartInstances.bar.destroy();
        const ctxBar = document.getElementById('clubScoreChart').getContext('2d');
        chartInstances.bar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: data.clubs.map(c => c.label),
                datasets: [{
                    label: 'Performance Score',
                    data: data.clubs.map(c => c.score),
                    backgroundColor: 'rgba(77, 163, 255, 0.7)',
                    borderColor: '#4da3ff',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: gridColor } },
                    x: { grid: { display: false } }
                }
            }
        });

        // 2. Line Chart (Event Trends)
        if (chartInstances.line) chartInstances.line.destroy();
        const ctxLine = document.getElementById('eventTrendChart').getContext('2d');
        chartInstances.line = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: data.participationTrends.map(t => t.date),
                datasets: [{
                    label: 'Participants',
                    data: data.participationTrends.map(t => t.count),
                    borderColor: '#00ffff',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#8a2be2',
                    pointBorderColor: isLight ? '#0f172a' : '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: gridColor } },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch (err) { console.error("Error drawing charts", err); }
}

// Admin Form Submissions
function setupFormListeners() {
    document.getElementById('deptForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newDeptName').value;
        const score = parseInt(document.getElementById('newDeptScore').value);

        const res = await fetch('/api/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, performance_score: score })
        });

        if (res.ok) {
            showToast("Department Created!");
            if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            e.target.reset();
            fetchAllData();
        }
    });

    document.getElementById('clubForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('newClubName').value,
            dept_id: document.getElementById('newClubDeptId').value,
            faculty_advisor: document.getElementById('newClubAdvisor').value,
            category: document.getElementById('newClubCategory').value,
            performance_score: parseInt(document.getElementById('newClubScore').value)
        };

        const res = await fetch('/api/clubs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("Club Created!");
            if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            e.target.reset();
            fetchAllData();
        }
    });

    document.getElementById('eventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('newEventName').value);
        formData.append('club_id', document.getElementById('newEventClubId').value);
        formData.append('date', document.getElementById('newEventDate').value);
        formData.append('description', document.getElementById('newEventDesc').value);
        formData.append('participants', document.getElementById('newEventParticipants').value);

        const fileInput = document.getElementById('newEventImage');
        if (fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
        }

        const res = await fetch('/api/events', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            showToast("Event Created!");
            if (typeof confetti === 'function') confetti({ particleCount: 150, zIndex: 9999, spread: 80, origin: { y: 0.6 } });
            e.target.reset();
            fetchAllData();
        }
    });

    document.getElementById('participationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const student = document.getElementById('partStudentId').value;
        const eventId = document.getElementById('partEventId').value;

        const res = await fetch('/api/participate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_identifier: student, event_id: eventId })
        });

        if (res.ok) {
            showToast("Participation Recorded!");
            if (typeof confetti === 'function') confetti({ particleCount: 100, zIndex: 9999, spread: 60, origin: { y: 0.6 } });
            e.target.reset();
            fetchAllData();
        }
    });
}

async function deleteEvent(id) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast("Event Deleted");
        fetchAllData();
    }
}

function exportEventsCSV() {
    window.location.href = '/api/export/events';
}

// Theme Toggle Logic
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerText = isLight ? '🌙' : '🌓';
    if (typeof drawCharts === 'function') drawCharts();
}

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerText = '🌙';
}

// Notification Logic
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('notificationDropdown');
    const toggleBtn = event.target.closest('button[title="Notifications"]');
    if (dropdown && dropdown.style.display === 'block' && !dropdown.contains(event.target) && !toggleBtn) {
        dropdown.style.display = 'none';
    }
});

// FullCalendar Logic
let isCalendarView = false;
let globalCalendar = null;

function toggleEventView() {
    isCalendarView = !isCalendarView;
    const tv = document.getElementById('eventsTableView');
    const cv = document.getElementById('eventsCalendarView');
    const btn = document.getElementById('eventViewToggleBtn');

    if (isCalendarView) {
        tv.style.display = 'none';
        cv.style.display = 'block';
        btn.innerHTML = '📋 List View';
        renderCalendar();
    } else {
        cv.style.display = 'none';
        tv.style.display = 'block';
        btn.innerHTML = '📅 Calendar View';
    }
}

function renderCalendar() {
    const calendarEl = document.getElementById('calendar');

    if (globalCalendar) {
        globalCalendar.destroy();
    }

    const isLight = document.body.classList.contains('light-mode');
    calendarEl.style.color = isLight ? 'var(--text-main)' : 'rgba(255,255,255,0.9)';

    globalCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        height: '100%',
        events: allEvents.map(e => ({
            id: e.id,
            title: e.name,
            start: e.date,
            description: e.description,
            club: e.club_name || 'N/A',
            color: 'var(--accent-cyan)'
        })),
        eventClick: function (info) {
            alert("Event: " + info.event.title + "\nClub: " + info.event.extendedProps.club + "\n\n" + info.event.extendedProps.description);
        }
    });

    globalCalendar.render();
}