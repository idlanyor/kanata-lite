import { buildSystemText } from '../lib/utils.js';

let handler = async (m, { sock }) => {
  await m.reply(buildSystemText(sock));
};

handler.help = ['is'];
handler.command = ['is'];
handler.tags = ['main'];

export default handler;
