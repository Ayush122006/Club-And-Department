# 🎓 Club & Department Management System

A full-stack web application for managing college clubs, departments, events, and student participation. Built with **Node.js**, **Express**, **SQLite**, and vanilla **HTML/CSS/JavaScript**.

---

## 📸 Preview

### Dashboard Overview
The dashboard provides a real-time summary of total departments, clubs, events, and participation metrics, alongside visual analytics charts.

### Leaderboard
Clubs are ranked by the **number of events held**, giving a fair view of the most active organizations on campus.

### Admin Panel
Password-protected admin section (password: `Admin123`) for securely managing departments, clubs, and events.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🏛️ **Departments** | View and manage college departments with performance scores |
| 🏕️ **Clubs** | Browse clubs by category, department, or name with tag filters |
| 📅 **Events** | Add, view, and delete events; toggle between list and calendar views |
| 🏆 **Leaderboard** | Clubs ranked by events held; departments ranked by score |
| 🔒 **Admin Panel** | Password-protected page for adding departments, clubs, and events |
| 📊 **Analytics** | Club performance bar chart and event participation trend line chart |
| 📄 **CSV Export** | Download all events data as a `.csv` report |
| 👤 **Student Participation** | Record student participation against specific events |
| 🔔 **Notifications** | Notification drawer for campus updates |
| 🌗 **Theme Toggle** | Switch between dark and light mode |
| 🗓️ **Event Calendar** | FullCalendar integration showing events on a visual monthly calendar |
| 🎉 **Confetti Effects** | Celebratory confetti animation on add actions |
| 🔐 **Auth System** | Login / Signup with password hashing (SHA-256) |

---

## 🗂️ Project Structure

```
e:/WEB/
├── server.js              # Express backend, REST API endpoints, SQLite setup
├── dashboard.html         # Main dashboard UI (all sections)
├── dashboard-script.js    # Frontend logic: data fetching, rendering, navigation
├── dashboard-style.css    # Custom CSS with glassmorphism design system
├── auth.html              # Login / Signup page
├── auth.js                # Auth page JS logic
├── package.json           # Project metadata and npm dependencies
├── dashboard.db           # SQLite database (auto-created on first run)
└── uploads/               # Uploaded event images (generated at runtime)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (Glassmorphism), Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite3 (via `sqlite3` npm package) |
| **File Upload** | Multer |
| **Charts** | Chart.js |
| **Calendar** | FullCalendar v6 |
| **Animations** | Canvas Confetti |
| **Fonts** | Google Fonts – Outfit |
| **Auth** | SHA-256 password hashing (Node.js `crypto` module) |

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org))
- **npm** (comes with Node.js)
- **Git**

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Ayush122006/Club-And-Department.git
cd Club-And-Department

# 2. Install dependencies
npm install

# 3. Start the server
npm start
# or
node server.js

# 4. Open in browser
# Navigate to: http://localhost:3000
```

The SQLite database (`dashboard.db`) is **automatically created** and seeded with sample data on first run.

---

## 🔑 Default Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |

> **Note:** The **Admin page** in the dashboard also requires a secondary runtime password: **`Admin123`**

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/signup` | Register a new user |
| `POST` | `/api/login` | Login with credentials |
| `GET` | `/api/users` | List all users |

### Dashboard Data
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/overview` | Get total counts & overall score |
| `GET` | `/api/leaderboard` | Top clubs (by events), top departments |
| `GET` | `/api/analytics` | Data for charts (clubs, depts, trends) |

### CRUD Operations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/departments` | List all departments |
| `POST` | `/api/departments` | Add new department |
| `GET` | `/api/clubs` | List all clubs (with dept info) |
| `POST` | `/api/clubs` | Add new club |
| `GET` | `/api/events` | List all events (with club/dept info) |
| `POST` | `/api/events` | Add new event (with optional image) |
| `DELETE` | `/api/events/:id` | Delete an event by ID |
| `POST` | `/api/participate` | Record student participation |
| `GET` | `/api/export/events` | Download events data as CSV |

---

## 🏆 Leaderboard Logic

The **Top Performing Clubs** leaderboard ranks clubs by the **number of events they have held** in the database — not by a manually set score. This ensures transparent, data-driven rankings.

```sql
SELECT clubs.*, COUNT(events.id) as event_count
FROM clubs
LEFT JOIN events ON events.club_id = clubs.id
GROUP BY clubs.id
ORDER BY event_count DESC
LIMIT 5;
```

---

## 🔒 Admin Security

The admin section is protected by a **runtime password prompt** in the browser:

- Click **"Admin"** in the navigation bar
- A browser `prompt()` dialog appears asking for the admin password
- Enter `Admin123` to gain access
- Wrong password shows `"Incorrect Password! Access Denied."` and blocks navigation

---

## 📦 Dependencies

```json
{
  "express": "^5.2.1",
  "sqlite3": "^5.1.7",
  "cors": "^2.8.6",
  "multer": "^2.1.1"
}
```

---

## 🧪 Sample Seed Data

On first run, the database is seeded with:

**Departments:** Engineering, Arts & Science, Business  
**Clubs:** Coding Club, Robotics Club, Cultural Club, Finance Club  
**Events:** Hackathon 2026, RoboWars, Spring Fest

---

## 🌐 Running on a Network

To access the dashboard from another device on the same network:

1. Find your local IP: run `ipconfig` (Windows) — look for `IPv4 Address`
2. Share the URL: `http://<your-ip>:3000`
3. Make sure your firewall allows port `3000`

---

## 🙋 Author

**Ayush** — [GitHub Profile](https://github.com/Ayush122006)

---

## 📄 License

This project is licensed under the **ISC License**.
