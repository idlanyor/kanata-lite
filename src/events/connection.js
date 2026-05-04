import { DisconnectReason } from '@whiskeysockets/baileys';
import { terminal } from '../lib/logger.js';
import { config } from '../config/env.js';

export const handleConnection = (sock, update, startBot) => {
  const { connection, lastDisconnect, qr } = update;

  if (qr && config.authMode === 'qr') {
    terminal.log('Scan QR berikut di WhatsApp:', 'info');
    import('qrcode-terminal').then(qrcode => {
      qrcode.default.generate(qr, { small: true });
    });
  }

  if (connection === 'open') {
    terminal.log(`Tersambung sebagai ${sock.user?.id?.split(':')[0] || 'unknown-user'}`, 'success');
  }

  if (connection === 'close') {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
    
    terminal.log(`Koneksi terputus${statusCode ? ` (status ${statusCode})` : ''}`, 'warn');

    if (statusCode === DisconnectReason.loggedOut) {
      terminal.log(`Session logout. Hapus folder ${config.authDir} jika ingin pairing ulang.`, 'error');
    }

    if (shouldReconnect) {
      const reconnectDelay = [DisconnectReason.restartRequired, DisconnectReason.connectionLost].includes(statusCode) 
        ? 5000 
        : 0;

      terminal.log(`Mencoba menyambung kembali dalam ${reconnectDelay / 1000}s...`, 'info');
      setTimeout(() => startBot(), reconnectDelay);
    }
  }
};
