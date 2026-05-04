import {
  Browsers,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { config } from './config/env.js';
import { terminal } from './lib/logger.js';
import { delay } from './lib/utils.js';
import { loadPlugins } from './plugins/index.js';
import { handleConnection } from './events/connection.js';
import { handleCall } from './events/call.js';
import { handleMessage } from './events/message.js';
import { startMcpServer } from './mcp/server.js';

const logger = pino({ level: 'silent' });
let plugins = new Map();

const startBot = async () => {
  terminal.banner();
  
  // Load Plugins
  plugins = await loadPlugins();
  terminal.log(`Berhasil memuat ${plugins.size} plugin`, 'info');

  const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
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
  });

  // Pairing Code Logic
  if (config.authMode === 'pairing' && !sock.authState.creds.registered) {
    if (!config.phoneNumber) {
      terminal.log('BOT_PHONE_NUMBER tidak ditemukan di .env', 'error');
      process.exit(1);
    }
    
    await delay(6000);
    const code = await sock.requestPairingCode(config.phoneNumber);
    terminal.log(`Pairing code Anda: ${code}`, 'pairing');
  }

  // Events
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', (update) => {
    handleConnection(sock, update, startBot);
  });

  sock.ev.on('call', (calls) => {
    handleCall(sock, calls);
  });

  sock.ev.on('messages.upsert', (upsert) => {
    handleMessage(sock, upsert, plugins);
  });

  // MCP Server for AI Integration
  startMcpServer(sock).catch(err => terminal.log(`MCP Error: ${err.message}`, 'error'));

  return sock;
};

startBot().catch((error) => {
  terminal.log(`Bot gagal dijalankan: ${error.message}`, 'error');
  process.exit(1);
});
