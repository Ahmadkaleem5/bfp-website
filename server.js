const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new sqlite3.Database('./bfp_database.sqlite', (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to SQLite database.');
});

// Setup Certificate Table & Seed Sample Data
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            registration_number TEXT UNIQUE,
            candidate_name TEXT,
            program_name TEXT,
            issue_date TEXT,
            status TEXT
        )
    `);

    // Insert mock record for testing if empty
    db.get(`SELECT COUNT(*) as count FROM certificates`, (err, row) => {
        if (row && row.count === 0) {
            db.run(`
                INSERT INTO certificates (registration_number, candidate_name, program_name, issue_date, status)
                VALUES 
                ('BFP-2026-101', 'Muhammad Ali', 'Diploma in Sustainability & Renewable Energies', '2026-03-15', 'Verified Authentic'),
                ('BFP-2026-102', 'Sarah Ahmed', 'Diploma in Drilling Engineering', '2026-05-20', 'Verified Authentic')
            `);
            console.log('Sample certificate records seeded.');
        }
    });
});

// API: Verify Certificate
app.post('/api/verify', (req, res) => {
    const { regNumber } = req.body;
    if (!regNumber) {
        return res.status(400).json({ success: false, message: 'Registration number is required.' });
    }

    const query = `SELECT * FROM certificates WHERE UPPER(registration_number) = UPPER(?)`;
    db.get(query, [regNumber.trim()], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server database error.' });
        }
        if (row) {
            return res.json({ success: true, data: row });
        } else {
            return res.json({ success: false, message: 'No certificate found matching this registration number.' });
        }
    });
});

// API: Handle Contact / Enrollment Inquiries
app.post('/api/contact', (req, res) => {
    const { name, email, wing, message } = req.body;
    console.log('New Inquiry Received:', { name, email, wing, message });

    // You can integrate nodemailer here to forward this straight to your inbox
    return res.json({ success: true, message: 'Your inquiry has been received! Our team will reach out shortly.' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
module.exports = app;
