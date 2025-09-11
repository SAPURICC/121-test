const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database tables
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS preparations (
                id SERIAL PRIMARY KEY,
                prep_key VARCHAR(255) UNIQUE NOT NULL,
                user_type VARCHAR(20) NOT NULL,
                name VARCHAR(255) NOT NULL,
                partner VARCHAR(255) NOT NULL,
                ratings JSONB NOT NULL,
                comments JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                manager_name VARCHAR(255) NOT NULL,
                employee_name VARCHAR(255) NOT NULL,
                session_date TIMESTAMP NOT NULL,
                employee_data JSONB NOT NULL,
                manager_data JSONB NOT NULL,
                categories JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// API Routes

// Save preparation data
app.post('/api/preparations', async (req, res) => {
    try {
        const { prepKey, userType, name, partner, ratings, comments } = req.body;
        
        const query = `
            INSERT INTO preparations (prep_key, user_type, name, partner, ratings, comments, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (prep_key) 
            DO UPDATE SET 
                user_type = $2,
                name = $3,
                partner = $4,
                ratings = $5,
                comments = $6,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        
        const result = await pool.query(query, [prepKey, userType, name, partner, ratings, comments]);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error saving preparation:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get preparation data
app.get('/api/preparations/:prepKey', async (req, res) => {
    try {
        const { prepKey } = req.params;
        
        const query = 'SELECT * FROM preparations WHERE prep_key LIKE $1';
        const result = await pool.query(query, [`%${prepKey}%`]);
        
        // Group by user type
        const prepData = {};
        result.rows.forEach(row => {
            prepData[row.user_type] = {
                name: row.name,
                partner: row.partner,
                ratings: row.ratings,
                comments: row.comments,
                date: row.updated_at
            };
        });
        
        res.json({ success: true, data: prepData });
    } catch (err) {
        console.error('Error fetching preparation:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Save session
app.post('/api/sessions', async (req, res) => {
    try {
        const { managerName, employeeName, sessionDate, employeeData, managerData, categories } = req.body;
        
        const query = `
            INSERT INTO sessions (manager_name, employee_name, session_date, employee_data, manager_data, categories)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            managerName, 
            employeeName, 
            sessionDate, 
            employeeData, 
            managerData, 
            categories
        ]);
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error saving session:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all sessions
app.get('/api/sessions', async (req, res) => {
    try {
        const query = 'SELECT * FROM sessions ORDER BY session_date DESC';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get sessions by names
app.get('/api/sessions/:managerName/:employeeName', async (req, res) => {
    try {
        const { managerName, employeeName } = req.params;
        
        const query = `
            SELECT * FROM sessions 
            WHERE (manager_name = $1 AND employee_name = $2) 
               OR (manager_name = $2 AND employee_name = $1)
            ORDER BY session_date DESC
        `;
        
        const result = await pool.query(query, [managerName, employeeName]);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    await initDB();
});