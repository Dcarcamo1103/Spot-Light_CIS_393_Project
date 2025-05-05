const express = require('express');
const app = express();
const morgan = require('morgan'); // for logging requests in the console
const mysql = require('mysql'); // MySQL client for Node.js

// Configure MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'myDBpassword',
    database: 'mydb'
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

app.post('/api/movies', (req, res) => {
    const { title, year, genre, type, status, score, imdbID } = req.body;

    const query = `
        INSERT INTO movies (title, year, genre, type, status, score, imdbID)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [title, year, genre, type, status, score, imdbID];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting movie into database:', err);
            return res.status(500).json({ error: 'Failed to save movie to database.' });
        }
        res.status(200).json({ message: 'Movie saved successfully.' });
    });
});