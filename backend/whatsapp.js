const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('./logger');
const db = require('./db');
const { generateReply } = require('./ai-service');

let client = null;
let qrCodeData = null;
let status = 'offline';

const setStatus = (newStatus) => {
    status = newStatus;
    db.run('UPDATE settings SET value = ? WHERE key = ?', [status, 'whatsapp_status']);
};

const startWaBot = () => {
    if (client) return;

    setStatus('starting');

    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        qrCodeData = qr;
        setStatus('waiting_qr');
        logger.info('WhatsApp QR Code generated.');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        qrCodeData = null;
        setStatus('online');
        logger.info('WhatsApp Client is ready!');
    });

    client.on('authenticated', () => {
        logger.info('WhatsApp authenticated');
    });

    client.on('auth_failure', msg => {
        logger.error('WhatsApp auth failure: ' + msg);
        setStatus('offline');
    });

    client.on('disconnected', (reason) => {
        logger.info('WhatsApp disconnected: ' + reason);
        setStatus('offline');
        client = null;
    });

    client.on('message', async msg => {
        // AI Logic
        try {
            const sender = msg.from.split('@')[0];
            db.get(`SELECT ai_enabled, custom_message, l.default_message 
                    FROM contacts c 
                    LEFT JOIN listings l ON c.listing_id = l.id 
                    WHERE c.contact_number_or_id = ? AND c.platform = 'whatsapp'`, [sender], async (err, row) => {
                if (err) {
                    logger.error('Error fetching contact for AI via WhatsApp', err);
                    return;
                }

                if (row && row.ai_enabled === 1) {
                    const ctx = row.custom_message || row.default_message || 'Təbrik mesajı';
                    const aiReply = await generateReply(msg.body, ctx);
                    msg.reply(aiReply);
                }
            });
        } catch (error) {
            logger.error('WhatsApp AI processing error', error);
        }
    });

    client.initialize().catch(err => {
        logger.error('Failed to initialize WhatsApp client: ' + err.message);
        setStatus('offline');
    });
};

const stopWaBot = () => {
    if (client) {
        client.destroy();
        client = null;
        qrCodeData = null;
        setStatus('offline');
    }
};

const getWaQr = () => qrCodeData;
const getWaStatus = () => status;

const sendWaMessage = async (number, text) => {
    if (status !== 'online' || !client) {
        logger.error('WhatsApp is not online. Cannot send message to: ' + number);
        return;
    }
    try {
        const cleanNumber = String(number).replace(/[\s\+]/g, '');
        const chatId = cleanNumber.includes('@c.us') ? cleanNumber : `${cleanNumber}@c.us`;
        await client.sendMessage(chatId, text);
        logger.info(`Message sent to ${cleanNumber} via WhatsApp`);
    } catch (e) {
        logger.error(`Error sending WA message to ${number}: ` + e.message);
    }
};

module.exports = {
    startWaBot,
    stopWaBot,
    getWaQr,
    getWaStatus,
    sendWaMessage
};
