import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { terminal } from '../lib/logger.js';
import { buildSystemText } from '../lib/utils.js';
import { db } from '../config/database.js';

export const startMcpServer = async (sock) => {
  const server = new Server(
    {
      name: 'kanata-lite-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * List available tools to the AI
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'send_whatsapp_message',
          description: 'Kirim pesan WhatsApp ke JID atau nomor tertentu',
          inputSchema: {
            type: 'object',
            properties: {
              jid: {
                type: 'string',
                description: 'Target WhatsApp ID (contoh: 628123456789@s.whatsapp.net)',
              },
              text: {
                type: 'string',
                description: 'Isi pesan teks',
              },
            },
            required: ['jid', 'text'],
          },
        },
        {
          name: 'get_bot_status',
          description: 'Dapatkan status sistem dan info bot saat ini',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'toggle_anticall',
          description: 'Aktifkan atau matikan fitur Anti-Call secara otomatis',
          inputSchema: {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                enum: ['on', 'off'],
                description: 'Mode anti-call (on atau off)',
              },
            },
            required: ['mode'],
          },
        },
      ],
    };
  });

  /**
   * Handle tool execution requests
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'send_whatsapp_message') {
        const { jid, text } = args;
        await sock.sendMessage(jid, { text });
        terminal.log(`MCP: Berhasil mengirim pesan ke ${jid}`, 'success');
        return {
          content: [{ type: 'text', text: `Pesan berhasil dikirim ke ${jid}` }],
        };
      }

      if (name === 'get_bot_status') {
        const status = buildSystemText(sock);
        return {
          content: [{ type: 'text', text: status }],
        };
      }

      if (name === 'toggle_anticall') {
        const mode = args.mode.toLowerCase();
        db.data.settings.antiCall = mode === 'on';
        await db.write();
        terminal.banner();
        return {
          content: [{ type: 'text', text: `Anti-call berhasil diubah menjadi ${mode.toUpperCase()}` }],
        };
      }

      throw new Error(`Tool ${name} tidak ditemukan`);
    } catch (error) {
      terminal.log(`MCP Tool Error (${name}): ${error.message}`, 'error');
      return {
        isError: true,
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  });

  // Start transport (Stdio)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  terminal.log('MCP Server aktif (Stdio Transport)', 'success');
};
