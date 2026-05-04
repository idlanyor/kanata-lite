import { db } from '../config/database.js';
import { terminal } from '../lib/logger.js';
import { delay, buildAntiCallText } from '../lib/utils.js';

export const handleCall = async (sock, calls) => {
  if (!db.data.settings.antiCall) return;

  for (const call of calls) {
    if (call.status !== 'offer' || !call.from) continue;

    const sender = call.from.split(':')[0].split('@')[0];
    const jid = sender + '@s.whatsapp.net';
    
    terminal.log(`Panggilan masuk dari ${sender}`, 'warn');

    try {
      await sock.rejectCall(call.id, call.from);
      await sock.sendMessage(jid, { text: buildAntiCallText() });
      await delay(2000);
      await sock.updateBlockStatus(jid, 'block');
      terminal.log(`Nomor ${sender} diblokir karena melakukan panggilan.`, 'success');
    } catch (error) {
      terminal.log(`Gagal menangani panggilan dari ${sender}: ${error.message}`, 'error');
    }
  }
};
