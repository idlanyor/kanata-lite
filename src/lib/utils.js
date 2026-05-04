import os from 'os';
import { performance } from 'perf_hooks';
import { config } from '../config/env.js';

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const formatDuration = (totalSeconds) => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return [
    days ? `${days}d` : null,
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    `${seconds}s`,
  ]
    .filter(Boolean)
    .join(' ');
};

export const parseMessageText = (message) => {
  if (!message) return '';

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    message.buttonsResponseMessage?.selectedButtonId ||
    message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    message.templateButtonReplyMessage?.selectedId ||
    ''
  );
};

export const buildPingText = () => {
  const startedAt = performance.now();
  const latency = (performance.now() - startedAt).toFixed(2);
  const uptime = formatDuration(process.uptime());
  const heapUsedMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const totalRamGb = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const cpu = os.cpus()[0]?.model || 'Unknown CPU';

  return [
    '*P O N G !*',
    '',
    `- Response: ${latency} ms`,
    `- Uptime: ${uptime}`,
    `- RAM: ${heapUsedMb} MB / ${totalRamGb} GB`,
    `- OS: ${os.platform()} (${cpu})`,
    '',
    `_${config.botName} is active._`,
  ].join('\n');
};

export const buildSystemText = (sock) => {
  const botUptime = formatDuration(process.uptime());
  const systemUptime = formatDuration(os.uptime());
  const rssMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
  const totalRamGb = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeRamGb = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const cpu = os.cpus()[0]?.model || 'Unknown CPU';
  const coreCount = os.cpus()?.length || 0;
  const userId = sock.user?.id?.split(':')[0] || sock.user?.id || '-';
  const displayName = sock.user?.name || config.botName;

  return [
    '*── 「 SYSTEM STATUS 」 ──*',
    '',
    `- Bot Name: ${displayName}`,
    `- Bot JID: ${userId}`,
    `- OS: ${os.type()} (${os.release()})`,
    `- Architecture: ${os.arch()}`,
    `- Platform: ${os.platform()}`,
    `- Node.js: ${process.version}`,
    `- Bot Uptime: ${botUptime}`,
    `- System Uptime: ${systemUptime}`,
    `- Memory Usage: ${rssMb} MB`,
    `- Total RAM: ${totalRamGb} GB`,
    `- Free RAM: ${freeRamGb} GB`,
    `- CPU: ${cpu} (${coreCount} cores)`,
    '',
    `*© ${config.botName}*`,
  ].join('\n');
};

export const buildAntiCallText = () =>
  [
    'Panggilan tidak diterima oleh bot ini.',
    'Nomor Anda akan diblokir otomatis karena melakukan panggilan.',
  ].join('\n');
