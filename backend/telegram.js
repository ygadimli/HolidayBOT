const { Telegraf } = require('telegraf');
const logger = require('./logger');
const db = require('./db');
const { generateReply } = require('./ai-service');

let bot = null;
let status = 'offline';

const setStatus = (newStatus) => {
    status = newStatus;
    db.run('UPDATE settings SET value = ? WHERE key = ?', [status, 'telegram_status']);
};

const startTgBot = () => {
    if (bot) return Promise.resolve();

    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM settings WHERE key = "telegram_token"', [], (err, row) => {
            if (err || !row || !row.value) {
                logger.error('Telegram token not found in settings');
                return reject(new Error('Token not found'));
            }

            try {
                bot = new Telegraf(row.value);
                
                bot.start((ctx) => ctx.reply('Salam! Bot aktivdir. Sizin ID: ' + ctx.from.id));
                
                bot.on('text', async (ctx) => {
                    const senderId = ctx.from.id.toString();
                    db.get(`SELECT ai_enabled, custom_message, l.default_message 
                            FROM contacts c 
                            LEFT JOIN listings l ON c.listing_id = l.id 
                            WHERE c.contact_number_or_id = ? AND c.platform = 'telegram'`, [senderId], async (dbErr, contact) => {
                        
                        if (dbErr) {
                            logger.error('Error fetching contact for AI via Telegram: ' + dbErr.message);
                            return;
                        }

                        if (contact && contact.ai_enabled === 1) {
                            try {
                                const aiContext = contact.custom_message || contact.default_message || 'Təbrik mesajı';
                                const aiReply = await generateReply(ctx.message.text, aiContext);
                                ctx.reply(aiReply);
                            } catch (error) {
                                logger.error('Telegram AI processing error: ' + error.message);
                            }
                        }
                    });
                });

                bot.launch().then(() => {
                    setStatus('online');
                    logger.info('Telegram bot started successfully');
                    resolve();
                }).catch(launchErr => {
                    logger.error('Failed to launch Telegram bot: ' + launchErr.message);
                    setStatus('offline');
                    bot = null;
                    reject(launchErr);
                });

            } catch (initErr) {
                logger.error('Failed to initialize Telegram bot: ' + initErr.message);
                setStatus('offline');
                reject(initErr);
            }
        });
    });
};

const stopTgBot = () => {
    if (bot) {
        bot.stop('Stopped by user');
        bot = null;
        setStatus('offline');
        logger.info('Telegram bot stopped');
    }
};

const getTgStatus = () => status;

const sendTgMessage = async (userId, text) => {
    if (status !== 'online' || !bot) {
        logger.error('Telegram is not online. Cannot send message to: ' + userId);
        return;
    }
    try {
        await bot.telegram.sendMessage(userId, text);
        logger.info(`Message sent to ${userId} via Telegram`);
    } catch (e) {
        logger.error(`Error sending TG message to ${userId}: ` + e.message);
    }
};

// Enable graceful stop
process.once('SIGINT', () => { if (bot) stopTgBot(); });
process.once('SIGTERM', () => { if (bot) stopTgBot(); });

module.exports = {
    startTgBot,
    stopTgBot,
    getTgStatus,
    sendTgMessage
};
