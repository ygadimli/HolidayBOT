const db = require('./db');
const logger = require('./logger');

const checkAndSendGreetings = (sendWaMessage, sendTgMessage) => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${month}-${day}`;

    logger.info(`Checking greetings for date: ${todayStr}`);

    db.all('SELECT * FROM listings WHERE date_mm_dd = ?', [todayStr], (err, listings) => {
        if (err) {
            logger.error('Error fetching listings for scheduler: ' + err.message);
            return;
        }

        if (listings.length === 0) {
            logger.info('No listings found for today to run scheduler.');
            return;
        }

        listings.forEach(listing => {
            db.all('SELECT * FROM contacts WHERE listing_id = ?', [listing.id], (cErr, contacts) => {
                if (cErr) {
                    logger.error(`Error fetching contacts for listing ${listing.id}: ` + cErr.message);
                    return;
                }

                contacts.forEach(contact => {
                    const message = contact.custom_message || listing.default_message || 'Təbrik edirik!';
                    const recipient = contact.contact_number_or_id;

                    if (contact.platform === 'whatsapp') {
                        sendWaMessage(recipient, message);
                    } else if (contact.platform === 'telegram') {
                        sendTgMessage(recipient, message);
                    } else {
                        logger.warn(`Unknown platform ${contact.platform} for contact ID ${contact.id}`);
                    }
                });
            });
        });
    });
};

module.exports = {
    checkAndSendGreetings
};
