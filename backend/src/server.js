const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const verifyToken = require('./middleware/authMiddleware');

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'IMS Backend API is running successfully.'
    });
});

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS server_time');

        res.status(200).json({
            status: 'success',
            message: 'Node.js connected to PostgreSQL successfully.',
            databaseTime: result.rows[0].server_time
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to connect to PostgreSQL.'
        });
    }
});

app.use('/api/auth', authRoutes);

app.get('/api/auth/profile', verifyToken, (req, res) => {
    res.json({
        status: 'success',
        user: req.user
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`IMS Backend running at http://localhost:${PORT}`);
});