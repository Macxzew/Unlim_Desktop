const path = require('path');

const CONFIG = {
    WIDEVINE_VERSION: '4.10.2557.0',
    WIDEVINE_PATH: path.join(__dirname, 'widevine', 'WidevineCdm'),
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    APP_URL: 'https://unlim-cloud.web.app/login'
};

module.exports = CONFIG;
