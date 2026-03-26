const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from e:\WEB
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Serve dashboard.html on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Helper Function: Hash Password using Node's built-in Crypto 
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper Function: Print entire database state to terminal
function printDatabaseState() {
    console.log('\n================================ DATABASE STATE ================================');

    db.all("SELECT id, username, role FROM users", [], (err, rows) => {
        if (err) return console.error('Error fetching users:', err.message);
        console.log('\n--- 👥 USERS TABLE ---');
        if (rows && rows.length > 0) console.table(rows);

        db.all("SELECT * FROM departments", [], (err, depts) => {
            console.log('\n--- 🏢 DEPARTMENTS ---');
            if (depts && depts.length > 0) console.table(depts);

            db.all("SELECT * FROM clubs", [], (err, clubs) => {
                console.log('\n--- 🏕️ CLUBS ---');
                if (clubs && clubs.length > 0) console.table(clubs);

                db.all("SELECT * FROM events", [], (err, events) => {
                    console.log('\n--- 📅 EVENTS ---');
                    if (events && events.length > 0) console.table(events);
                    console.log('================================================================================\n');
                });
            });
        });
    });
}

// Initialize SQLite Database
const db = new sqlite3.Database(path.join(__dirname, 'dashboard.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        db.serialize(() => {
            // Drop old legacy table
            db.run(`DROP TABLE IF EXISTS records`);

            // Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'Member'
            )`);

            // Departments Table
            db.run(`CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                performance_score INTEGER DEFAULT 0
            )`);

            // Clubs Table
            db.run(`CREATE TABLE IF NOT EXISTS clubs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                logo TEXT,
                faculty_advisor TEXT,
                dept_id INTEGER,
                category TEXT,
                performance_score INTEGER DEFAULT 0,
                FOREIGN KEY(dept_id) REFERENCES departments(id)
            )`);

            // Events Table
            db.run(`CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                club_id INTEGER,
                date TEXT,
                description TEXT,
                participants INTEGER DEFAULT 0,
                image_url TEXT,
                FOREIGN KEY(club_id) REFERENCES clubs(id)
            )`);

            // Student Participations
            db.run(`CREATE TABLE IF NOT EXISTS student_participations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_identifier TEXT NOT NULL,
                event_id INTEGER,
                FOREIGN KEY(event_id) REFERENCES events(id)
            )`, (err) => {
                // Seed database if empty
                db.get("SELECT COUNT(*) as count FROM departments", (err, row) => {
                    if (err) return;
                    if (row.count === 0) {
                        db.run(`INSERT INTO departments (name, performance_score) VALUES ('Engineering', 85), ('Arts & Science', 90), ('Business', 75)`);
                        db.run(`INSERT INTO clubs (name, faculty_advisor, dept_id, category, performance_score) VALUES 
                            ('Coding Club', 'Dr. Smith', 1, 'Technical', 92), 
                            ('Robotics Club', 'Dr. Jones', 1, 'Technical', 88), 
                            ('Cultural Club', 'Prof. Davis', 2, 'Cultural', 95), 
                            ('Finance Club', 'Dr. Lee', 3, 'Academic', 80)`);
                        db.run(`INSERT INTO events (name, club_id, date, description, participants) VALUES 
                            ('Hackathon 2026', 1, '2026-04-10', 'Annual 48-hour coding competition', 150),
                            ('RoboWars', 2, '2026-05-15', 'Robot combat and racing', 80),
                            ('Spring Fest', 3, '2026-06-20', 'Cultural dance and music festival', 300)`);

                        // Default Admin Account
                        const adminHash = hashPassword('admin123');
                        db.run(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`, ['admin', adminHash, 'Admin']);
                        console.log('Database seeded with relational records.');
                    }
                    setTimeout(printDatabaseState, 500);
                });
            });
        });
    }
});

// ==========================================
// API Endpoints - AUTHENTICATION
// ==========================================

app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const hash = hashPassword(password);
    db.run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, [username, hash], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) return res.status(409).json({ error: "Username already exists" });
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "User registered successfully", username: username });
        printDatabaseState();
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const hash = hashPassword(password);
    db.get(`SELECT id, username, role FROM users WHERE username = ? AND password_hash = ?`, [username, hash], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "Invalid username or password" });
        res.json({ message: "Login successful", user: row });
    });
});

app.get('/api/users', (req, res) => {
    db.all("SELECT id, username, role FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==========================================
// API Endpoints - DASHBOARD & METRICS
// ==========================================

// Dashboard Overview
app.get('/api/overview', (req, res) => {
    const overview = {};
    db.get("SELECT COUNT(*) as count FROM clubs", (err, row) => {
        overview.totalClubs = row ? row.count : 0;
        db.get("SELECT COUNT(*) as count FROM departments", (err, row) => {
            overview.totalDepartments = row ? row.count : 0;
            db.get("SELECT COUNT(*) as count, SUM(participants) as totalParticipation FROM events", (err, row) => {
                overview.totalEvents = row ? row.count : 0;
                overview.totalParticipation = row && row.totalParticipation ? row.totalParticipation : 0;
                // Calculate overall score as average of club scores
                db.get("SELECT AVG(performance_score) as avgScore FROM clubs", (err, row) => {
                    overview.overallScore = row && row.avgScore ? Math.round(row.avgScore) : 0;
                    res.json(overview);
                });
            });
        });
    });
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = {};
    db.all("SELECT clubs.*, (SELECT COUNT(*) FROM events WHERE events.club_id = clubs.id) as event_count FROM clubs ORDER BY event_count DESC LIMIT 5", (err, clubs) => {
        leaderboard.topClubs = clubs || [];
        db.all("SELECT * FROM departments ORDER BY performance_score DESC LIMIT 5", (err, depts) => {
            leaderboard.topDepartments = depts || [];
            db.get("SELECT *, (SELECT COUNT(*) FROM events WHERE club_id = clubs.id) as event_count FROM clubs ORDER BY event_count DESC LIMIT 1", (err, activeClub) => {
                leaderboard.mostActiveClub = activeClub || null;
                db.get("SELECT * FROM events ORDER BY participants DESC LIMIT 1", (err, topEvent) => {
                    leaderboard.topEvent = topEvent || null;
                    res.json(leaderboard);
                });
            });
        });
    });
});

app.get('/api/analytics', (req, res) => {
    const data = {
        clubs: [],
        departments: [],
        participationTrends: []
    };
    db.all("SELECT name as label, performance_score as score FROM clubs", [], (err, clubs) => {
        data.clubs = clubs || [];
        db.all("SELECT name as label, performance_score as score FROM departments", [], (err, depts) => {
            data.departments = depts || [];
            db.all("SELECT date, participants as count FROM events ORDER BY date ASC", [], (err, trends) => {
                data.participationTrends = trends || [];
                res.json(data);
            });
        });
    });
});

// ==========================================
// API Endpoints - CRUD
// ==========================================

// DEPARTMENTS
app.get('/api/departments', (req, res) => {
    db.all("SELECT * FROM departments", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/departments', (req, res) => {
    const { name, performance_score } = req.body;
    db.run("INSERT INTO departments (name, performance_score) VALUES (?, ?)", [name, performance_score || 0], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Department added" });
    });
});

// CLUBS
app.get('/api/clubs', (req, res) => {
    const query = `
        SELECT clubs.*, departments.name as dept_name 
        FROM clubs 
        LEFT JOIN departments ON clubs.dept_id = departments.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/clubs', (req, res) => {
    const { name, logo, faculty_advisor, dept_id, category, performance_score } = req.body;
    db.run("INSERT INTO clubs (name, logo, faculty_advisor, dept_id, category, performance_score) VALUES (?, ?, ?, ?, ?, ?)",
        [name, logo || '', faculty_advisor || '', dept_id, category || '', performance_score || 0],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: "Club added" });
        });
});

// EVENTS
app.get('/api/events', (req, res) => {
    const query = `
        SELECT events.*, clubs.name as club_name, departments.name as dept_name 
        FROM events 
        LEFT JOIN clubs ON events.club_id = clubs.id
        LEFT JOIN departments ON clubs.dept_id = departments.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/events', upload.single('image'), (req, res) => {
    const { name, club_id, date, description, participants } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : '';

    db.run("INSERT INTO events (name, club_id, date, description, participants, image_url) VALUES (?, ?, ?, ?, ?, ?)",
        [name, club_id, date, description, participants || 0, image_url],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: "Event added", image_url: image_url });
        });
});

app.delete('/api/events/:id', (req, res) => {
    db.run("DELETE FROM events WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Event deleted" });
    });
});

// STUDENT PARTICIPATION
app.post('/api/participate', (req, res) => {
    const { student_identifier, event_id } = req.body;
    db.run("INSERT INTO student_participations (student_identifier, event_id) VALUES (?, ?)",
        [student_identifier, event_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            // Also increment participants count in the event
            db.run("UPDATE events SET participants = participants + 1 WHERE id = ?", [event_id], function (err) {
                if (err) console.error("Error updating participants count:", err);
            });
            res.json({ message: "Participation recorded" });
        });
});

// EXPORT TO CSV
app.get('/api/export/events', (req, res) => {
    const query = `
        SELECT events.name as Event, events.date as Date, events.participants as Participants, clubs.name as ClubName 
        FROM events 
        LEFT JOIN clubs ON events.club_id = clubs.id
        `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).send("Error exporting data");
        if (rows.length === 0) return res.send("No data to export");

        const headers = Object.keys(rows[0]).join(',') + '\n';
        const csv = rows.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=\"events_export.csv\"');
        res.send(headers + csv);
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
