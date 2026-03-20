const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Database connection error', err);
    }
});

const initDB = () => {
    db.serialize(() => {
        // Create listings (Bayramlar, sýyahılar)
        db.run(`CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date_mm_dd TEXT NOT NULL,
            default_message TEXT
        )`);

        // Create contacts (Əlaqələr: whatsapp and telegram numbers/ids)
        // platform: 'whatsapp' | 'telegram'
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_id INTEGER,
            contact_number_or_id TEXT NOT NULL,
            contact_name TEXT,
            custom_message TEXT,
            ai_enabled INTEGER DEFAULT 0,
            platform TEXT DEFAULT 'whatsapp',
            FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
        )`);

        // Settings (AI key, Telegram bot token, Bot active status, etc.)
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);
        
        // Populate default settings if not exists
        db.get('SELECT * FROM settings WHERE key = "whatsapp_status"', [], (err, row) => {
            if (!row) {
                const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
                stmt.run('whatsapp_status', 'offline');
                stmt.run('telegram_status', 'offline');
                stmt.run('telegram_token', '');
                stmt.run('openai_key', '');
                stmt.finalize();
            }
        });
    });
};

initDB();

module.exports = db;
