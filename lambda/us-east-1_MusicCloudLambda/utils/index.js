const crypto = require('crypto');

module.exports = {
    hash: (value) => {
        return crypto.createHash('sha1').update(value).digest('base64');
    }
}