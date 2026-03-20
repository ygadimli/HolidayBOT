const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./logger');
const db = require('./db');
const path = require('path');
const fs = require('fs');
const { startWaBot, stopWaBot, getWaQr, getWaStatus, sendWaMessage } = require('./whatsapp');
const { startTgBot, stopTgBot, getTgStatus, sendTgMessage } = require('./telegram');
const cron = require('node-cron');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// ----- API ENDPOINTS -----

// Logs
app.get('/api/logs', (req, res) => {
    const logFile = path.join(__dirname, '..', 'xəta.log');
    if (fs.existsSync(logFile)) {
        res.send(fs.readFileSync(logFile, 'utf8'));
    } else {
        res.send('');
    }
});

app.post('/api/logs/clear', (req, res) => {
    const logFile = path.join(__dirname, '..', 'xəta.log');
    if (fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, '');
    }
    res.json({ success: true });
});

// Settings
app.get('/api/settings', (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(r => { settings[r.key] = r.value; });
        
        settings.whatsapp_status = getWaStatus();
        settings.telegram_status = getTgStatus();
        
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', [key, value, value], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Bot Control
app.post('/api/bot/whatsapp/start', (req, res) => {
    startWaBot();
    res.json({ success: true, status: 'starting' });
});
app.post('/api/bot/whatsapp/stop', (req, res) => {
    stopWaBot();
    res.json({ success: true, status: 'stopped' });
});
app.get('/api/bot/whatsapp/qr', (req, res) => {
    res.json({ qr: getWaQr() });
});

app.post('/api/bot/telegram/start', async (req, res) => {
    try {
        await startTgBot();
        res.json({ success: true, status: 'started' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/bot/telegram/stop', (req, res) => {
    stopTgBot();
    res.json({ success: true, status: 'stopped' });
});

// Lists
app.get('/api/lists', (req, res) => {
    db.all('SELECT * FROM listings ORDER BY date_mm_dd ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/lists', (req, res) => {
    const { title, date_mm_dd, default_message } = req.body;
    db.run('INSERT INTO listings (title, date_mm_dd, default_message) VALUES (?, ?, ?)', [title, date_mm_dd, default_message], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/lists/:id', (req, res) => {
    const { title, date_mm_dd, default_message } = req.body;
    db.run('UPDATE listings SET title = ?, date_mm_dd = ?, default_message = ? WHERE id = ?', [title, date_mm_dd, default_message, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/lists/:id', (req, res) => {
    db.run('DELETE FROM listings WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Contacts
app.get('/api/lists/:listId/contacts', (req, res) => {
    db.all('SELECT * FROM contacts WHERE listing_id = ?', [req.params.listId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/lists/:listId/contacts', (req, res) => {
    const { listId } = req.params;
    const { contact_number_or_id, contact_name, custom_message, ai_enabled, platform } = req.body;
    db.run(`INSERT INTO contacts (listing_id, contact_number_or_id, contact_name, custom_message, ai_enabled, platform) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
    [listId, contact_number_or_id, contact_name, custom_message, ai_enabled ? 1 : 0, platform], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/contacts/:id', (req, res) => {
    const { contact_number_or_id, contact_name, custom_message, ai_enabled, platform } = req.body;
    db.run(`UPDATE contacts SET contact_number_or_id = ?, contact_name = ?, custom_message = ?, ai_enabled = ?, platform = ? WHERE id = ?`, 
    [contact_number_or_id, contact_name, custom_message, ai_enabled ? 1 : 0, platform, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/contacts/:id', (req, res) => {
    db.run('DELETE FROM contacts WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Scheduler
const { checkAndSendGreetings } = require('./scheduler');
// Run every day at 10:00 AM
cron.schedule('0 10 * * *', () => {
    logger.info('Running daily greeting scheduler');
    checkAndSendGreetings(sendWaMessage, sendTgMessage);
});

// Manually trigger
app.post('/api/test-trigger', (req, res) => {
    checkAndSendGreetings(sendWaMessage, sendTgMessage);
    res.json({ success: true, message: 'Triggered' });
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    logger.info(`Backend server started on port ${PORT}`);
});
