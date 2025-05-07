const express = require('express');
const app = express();
const morgan = require('morgan'); // for logging requests in the console
const mysql = require('mysql'); // MySQL client for Node.js
const cors = require('cors'); // Import CORS middleware

// Configure MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'mydb_user',
    password: 'myDBpassword',
    database: 'mydb',
    port: 3306,
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Route to save movie data
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors()); // Enable CORS for all routes

app.post('/api/movies', (req, res) => {
    console.log('Received movie data:', req.body);

    const { title, year, genre, type, status, score, imdbID } = req.body;

    if (!title || !year) {
        return res.status(400).send('Missing required fields');
    }

    const sql = `
        INSERT INTO movies (title, year, genre, type, status, score, imdbID)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [title, year, genre, type, status, score, imdbID], (err, result) => {
        if (err) {
            console.error('Database insertion error:', err);
            return res.status(500).send('Failed to insert movie');
        }
        res.status(200).send('Movie inserted successfully');
    });
});

// Route to fetch all movies
app.get('/api/movies', (req, res) => {
    const sql = `SELECT * FROM movies`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching movies:', err);
            return res.status(500).send('Failed to fetch movies');
        }
        res.status(200).json(results);
    });
});

app.put('/api/movies/:imdbID', (req, res) => {
    const { imdbID } = req.params;
    const { status, score } = req.body;

    if (!status || score === undefined) {
        return res.status(400).send('Missing required fields');
    }

    const sql = `
        UPDATE movies
        SET status = ?, score = ?
        WHERE imdbID = ?
    `;

    db.query(sql, [status, score, imdbID], (err, result) => {
        if (err) {
            console.error('Error updating movie:', err);
            return res.status(500).send('Failed to update movie');
        }
        res.status(200).send('Movie updated successfully');
    });
});

app.delete('/api/movies/:imdbID', (req, res) => {
    const { imdbID } = req.params;

    const sql = `DELETE FROM movies WHERE imdbID = ?`;

    db.query(sql, [imdbID], (err, result) => {
        if (err) {
            console.error('Error deleting movie:', err);
            return res.status(500).send('Failed to delete movie');
        }
        res.status(200).send('Movie deleted successfully');
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).send('Server is running');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});