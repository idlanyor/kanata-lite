import { buildPingText } from '../lib/utils.js';

let handler = async (m) => {
  await m.reply(buildPingText());
};

handler.help = ['ping'];
handler.command = ['ping'];
handler.tags = ['main'];

export default handler;
