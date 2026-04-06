import 'dotenv/config';
import os from 'os';
import readline from 'readline';
import { performance } from 'perf_hooks';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { JSONFilePreset } from 'lowdb/node';
import {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';

const logger = pino({ level: 'silent' });
const prefix = process.env.PREFIX || '.';
const botName = process.env.BOT_NAME || 'Kanata Lite';
const authMode = (process.env.AUTH_MODE || 'pairing').toLowerCase();
const authDir = process.env.AUTH_DIR || 'auth_info_baileys';

/**
 * Initialize Database (lowdb)
 */
const defaultData = { settings: { antiCall: true } };
const db = await JSONFilePreset('db.json', defaultData);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Centralized Terminal Logger
 */
const terminal = {
  log: (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: chalk.cyan,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
      pairing: chalk.magenta,
      msg: chalk.white,
    };
    const prefix = {
      info: 'ℹ',
      success: '✔',
      warn: '⚠',
      error: '✖',
      pairing: '🔑',
      msg: '💬',
    };
    
    const color = colors[type] || chalk.white;
    const icon = prefix[type] || '•';
    
    console.log(
      `${chalk.gray(`[${timestamp}]`)} ${color.bold(icon)} ${color(message)}`
    );
  },
  
  banner: () => {
    console.clear();
    const bannerText = figlet.textSync(botName, { font: 'Small' });
    console.log(gradient.pastel.multiline(bannerText));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.bold('Bot Name  :')} ${chalk.cyan(botName)}`);
    console.log(`${chalk.bold('Prefix    :')} ${chalk.yellow(prefix)}`);
    console.log(`${chalk.bold('Auth Mode :')} ${chalk.magenta(authMode)}`);
    console.log(`${chalk.bold('Anti-Call :')} ${db.data.settings.antiCall ? chalk.green('ON') : chalk.red('OFF')}`);
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
  }
};

const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDuration = (totalSeconds) => {
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

const parseMessageText = (message) => {
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

const buildPingText = () => {
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
    `_${botName} is active._`,
  ].join('\n');
};

const buildSystemText = (sock) => {
  const botUptime = formatDuration(process.uptime());
  const systemUptime = formatDuration(os.uptime());
  const rssMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
  const totalRamGb = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeRamGb = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const cpu = os.cpus()[0]?.model || 'Unknown CPU';
  const coreCount = os.cpus()?.length || 0;
  const userId = sock.user?.id?.split(':')[0] || sock.user?.id || '-';
  const displayName = sock.user?.name || botName;

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
    `*© ${botName}*`,
  ].join('\n');
};

const buildAntiCallText = () =>
  [
    'Panggilan tidak diterima oleh bot ini.',
    'Nomor Anda akan diblokir otomatis karena melakukan panggilan.',
  ].join('\n');

const commands = new Map([
  [
    'ping',
    async (sock, message) => {
      await sock.sendMessage(message.key.remoteJid, { text: buildPingText() }, { quoted: message });
    },
  ],
  [
    'is',
    async (sock, message) => {
      await sock.sendMessage(message.key.remoteJid, { text: buildSystemText(sock) }, { quoted: message });
    },
  ],
  [
    'anticall',
    async (sock, message, args) => {
      const mode = args[0]?.toLowerCase();
      if (mode === 'on' || mode === 'off') {
        db.data.settings.antiCall = mode === 'on';
        await db.write();
        const status = db.data.settings.antiCall ? 'DIAKTIFKAN' : 'DIMATIKAN';
        await sock.sendMessage(message.key.remoteJid, { text: `Anti-Call berhasil ${status}.` }, { quoted: message });
        terminal.log(`Anti-Call diubah menjadi ${status} oleh ${message.key.remoteJid.split('@')[0]}`, 'info');
        terminal.banner(); // Refresh banner to show new status
      } else {
        const current = db.data.settings.antiCall ? 'ON' : 'OFF';
        await sock.sendMessage(message.key.remoteJid, { text: `Status Anti-Call saat ini: *${current}*\n\nGunakan *.anticall on* atau *.anticall off* untuk mengubah.` }, { quoted: message });
      }
    },
  ],
]);

const ensurePhoneNumber = async (state) => {
  if (state.creds.registered || authMode === 'qr') {
    return process.env.BOT_PHONE_NUMBER?.trim() || '';
  }

  const envNumber = process.env.BOT_PHONE_NUMBER?.trim();
  if (envNumber) {
    return envNumber;
  }

  const input = await prompt(chalk.yellow('Masukkan nomor WhatsApp untuk pairing code (contoh 628123456789): '));
  return input.trim();
};

const startBot = async (initialPhoneNumber = '') => {
  terminal.banner();
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const phoneNumber = initialPhoneNumber || (await ensurePhoneNumber(state));
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.macOS('safari'),
    logger,
    version,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
    keepAliveIntervalMs: 60000,
    connectTimeoutMs: 60000,
    retryRequestDelayMs: 5000,
    defaultQueryTimeoutMs: 60000,
  });

  let pairingCodeRequested = false;
  let connectionState = 'connecting';
  let restartScheduled = false;
  let sessionLoggedOut = false;

  const requestPairingCodeIfReady = async () => {
    if (
      authMode === 'qr' ||
      !phoneNumber ||
      sock.authState.creds.registered ||
      pairingCodeRequested ||
      sessionLoggedOut ||
      connectionState === 'close'
    ) {
      return;
    }

    pairingCodeRequested = true;

    try {
      await delay(6000);

      if (sessionLoggedOut || connectionState === 'close') {
        pairingCodeRequested = false;
        return;
      }

      const code = await sock.requestPairingCode(phoneNumber);
      terminal.log(`Pairing code Anda: ${chalk.bold.white(code)}`, 'pairing');
    } catch (error) {
      pairingCodeRequested = false;

      if (!sessionLoggedOut && connectionState !== 'close') {
        terminal.log(`Gagal meminta pairing code: ${error.message}`, 'error');
      }
    }
  };

  if (authMode !== 'qr' && phoneNumber && !sock.authState.creds.registered) {
    requestPairingCodeIfReady();
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection) {
      connectionState = connection;
    }

    if (qr && authMode === 'qr') {
      terminal.log('Scan QR berikut di WhatsApp:', 'info');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      terminal.log(`Tersambung sebagai ${sock.user?.id?.split(':')[0] || 'unknown-user'}`, 'success');
      return;
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      sessionLoggedOut = statusCode === DisconnectReason.loggedOut;
      pairingCodeRequested = false;
      terminal.log(`Koneksi terputus${statusCode ? ` (status ${statusCode})` : ''}`, 'warn');

      if (statusCode === DisconnectReason.loggedOut) {
        terminal.log(`Session logout. Hapus folder ${authDir} jika ingin pairing ulang.`, 'error');
        return;
      }

      if (!restartScheduled) {
        restartScheduled = true;
        const reconnectDelay =
          statusCode === DisconnectReason.restartRequired || statusCode === DisconnectReason.connectionLost
            ? 5000
            : 0;

        terminal.log(`Mencoba menyambung kembali dalam ${reconnectDelay / 1000}s...`, 'info');
        setTimeout(() => {
          startBot(phoneNumber).catch((error) => {
            terminal.log(`Gagal reconnect: ${error.message}`, 'error');
          });
        }, reconnectDelay);
      }
      return;
    }
  });

  sock.ev.on('call', async (calls) => {
    if (!db.data.settings.antiCall) return; // Skip if disabled

    for (const call of calls) {
      if (call.status !== 'offer' || !call.from) {
        continue;
      }
      
      const sender = call.from.split(':')[0].split('@')[0];
      const jid = sender + '@s.whatsapp.net';
      
      terminal.log(`Panggilan masuk dari ${sender}`, 'warn');

      try {
        await sock.rejectCall(call.id, call.from);
      } catch (error) {
        terminal.log(`Gagal menolak panggilan: ${error.message}`, 'error');
      }

      try {
        await sock.sendMessage(jid, { text: buildAntiCallText() });
      } catch (error) {
        terminal.log(`Gagal mengirim pesan anti-call: ${error.message}`, 'error');
      }

      try {
        await delay(2000); // Jeda 2 detik agar tidak bad-request
        await sock.updateBlockStatus(jid, 'block');
        terminal.log(`Nomor ${sender} diblokir karena melakukan panggilan.`, 'success');
      } catch (error) {
        terminal.log(`Gagal memblokir ${sender}: ${error.message}`, 'error');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    const message = messages[0];
    if (!message?.message) return;
    if (message.key.remoteJid === 'status@broadcast') return;
    if (message.key.fromMe) return;

    const body = parseMessageText(message.message).trim();
    const sender = message.key.remoteJid.split('@')[0];
    
    if (body) {
      terminal.log(`${chalk.bold(sender)}: ${body.length > 50 ? body.slice(0, 50) + '...' : body}`, 'msg');
    }

    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/\s+/);
    const rawCommand = args.shift().toLowerCase();
    
    const command = commands.get(rawCommand);
    if (!command) return;

    terminal.log(`Eksekusi command: ${chalk.yellow(rawCommand)} dari ${chalk.cyan(sender)}`, 'info');

    try {
      await command(sock, message, args);
    } catch (error) {
      terminal.log(`Command ${rawCommand} gagal: ${error.message}`, 'error');
      await sock.sendMessage(
        message.key.remoteJid,
        { text: 'Terjadi kesalahan saat menjalankan command.' },
        { quoted: message },
      );
    }
  });
};

startBot().catch((error) => {
  terminal.log(`Bot gagal dijalankan: ${error.message}`, 'error');
  process.exitCode = 1;
});
