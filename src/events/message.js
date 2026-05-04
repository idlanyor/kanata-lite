import chalk from 'chalk';
import { terminal } from '../lib/logger.js';
import { config } from '../config/env.js';
import { parseMessageText } from '../lib/utils.js';

export const handleMessage = async (sock, { messages, type }, plugins) => {
  if (type !== 'notify') return;

  const m = messages[0];
  if (!m?.message || m.key.remoteJid === 'status@broadcast' || !m.key.fromMe) return;

  // Decorate message object for easier use (Scaffold standard)
  m.chat = m.key.remoteJid;
  m.sender = m.key.participant || m.key.remoteJid;
  m.text = parseMessageText(m.message).trim();
  m.reply = (text) => sock.sendMessage(m.chat, { text }, { quoted: m });

  const senderName = m.pushName || m.chat.split('@')[0];
  
  if (m.text) {
    terminal.log(`${chalk.bold(senderName)}: ${m.text.length > 50 ? m.text.slice(0, 50) + '...' : m.text}`, 'msg');
  }

  if (!m.text.startsWith(config.prefix)) return;

  const args = m.text.slice(config.prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  
  // Find plugin by command (check if command exists in plugin.command array)
  const plugin = Array.from(plugins.values()).find(p => 
    p.command && (Array.isArray(p.command) ? p.command.includes(command) : p.command === command)
  );

  if (!plugin) return;

  terminal.log(`Eksekusi command: ${chalk.yellow(command)} dari ${chalk.cyan(senderName)}`, 'info');

  try {
    await plugin(m, { 
      sock, 
      conn: sock, // Alias for compatibility
      args, 
      command, 
      text: args.join(' '),
      plugins 
    });
  } catch (error) {
    terminal.log(`Command ${command} gagal: ${error.message}`, 'error');
    m.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
};
