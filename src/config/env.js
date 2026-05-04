import 'dotenv/config';

export const config = {
  prefix: process.env.PREFIX || '.',
  botName: process.env.BOT_NAME || 'Kanata Lite',
  authMode: (process.env.AUTH_MODE || 'pairing').toLowerCase(),
  authDir: process.env.AUTH_DIR || 'auth_info_baileys',
  phoneNumber: process.env.BOT_PHONE_NUMBER?.trim() || '',
};
