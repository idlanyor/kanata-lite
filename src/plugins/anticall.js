import { db } from '../config/database.js';
import { terminal } from '../lib/logger.js';

let handler = async (m, { args }) => {
  const mode = args[0]?.toLowerCase();
  if (mode === 'on' || mode === 'off') {
    db.data.settings.antiCall = mode === 'on';
    await db.write();
    const status = db.data.settings.antiCall ? 'DIAKTIFKAN' : 'DIMATIKAN';
    await m.reply(`Anti-Call berhasil ${status}.`);
    terminal.log(`Anti-Call diubah menjadi ${status} oleh ${m.sender.split('@')[0]}`, 'info');
    terminal.banner();
  } else {
    const current = db.data.settings.antiCall ? 'ON' : 'OFF';
    await m.reply(`Status Anti-Call saat ini: *${current}*\n\nGunakan *.anticall on* atau *.anticall off* untuk mengubah.`);
  }
};

handler.help = ['anticall <on/off>'];
handler.command = ['anticall'];
handler.tags = ['admin'];

export default handler;
