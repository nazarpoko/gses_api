const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const app = express();
const port = 8080;

// Set up the database
const db = new sqlite3.Database('subscriptions.db');

db.serialize(() => {
    db.run(`CREATE TABLE subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL
    )`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Fetch the current exchange rate
const fetchExchangeRate = async () => {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        return response.data.rates.UAH;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        throw new Error('Failed to fetch exchange rate');
    }
};

// Endpoint to get the current exchange rate
app.get('/api/rate', async (req, res) => {
    try {
        const rate = await fetchExchangeRate();
        res.json(rate);
    } catch (error) {
        res.status(400).json({ error: 'Invalid status value' });
    }
});

// Endpoint to subscribe an email
app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    db.get('SELECT * FROM subscriptions WHERE email = ?', [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (row) {
            return res.status(409).json({ message: 'E-mail вже підписано' });
        }
        db.run('INSERT INTO subscriptions (email) VALUES (?)', [email], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.status(200).json({ message: 'E-mail додано' });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
