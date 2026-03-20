const { OpenAI } = require('openai');
const db = require('./db');
const logger = require('./logger');

let openai = null;

const initAI = () => {
    db.get('SELECT value FROM settings WHERE key = "openai_key"', [], (err, row) => {
        if (!err && row && row.value) {
            openai = new OpenAI({ apiKey: row.value });
            logger.info('OpenAI initialized with key');
        }
    });
};

// Initialize early
initAI();

// Also expose a function to reload if key changes
const reloadAIKey = (key) => {
    openai = new OpenAI({ apiKey: key });
};

const generateReply = async (incomingMessage, context = '') => {
    if (!openai) {
        throw new Error('OpenAI key is not configured.');
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an AI assistant replying on behalf of the user who just sent a holiday greeting. Keep your reply polite, warm, brief and in Azerbaijani. Context: " + context },
                { role: "user", content: incomingMessage }
            ],
        });
        
        return completion.choices[0].message.content;
    } catch (error) {
        logger.error('OpenAI generation error', error);
        throw error;
    }
};

module.exports = {
    initAI,
    reloadAIKey,
    generateReply
};
