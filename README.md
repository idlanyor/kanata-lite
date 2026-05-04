# ⚡ Kanata Lite

Minimalist WhatsApp Bot built with `@whiskeysockets/baileys`. Designed to be lightweight, fast, and visually pleasing in your terminal.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Baileys-v6.x-blue?style=for-the-badge" alt="Baileys">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

---

## ✨ Features

- **🚀 Lightweight:** Minimal dependencies and low memory footprint.
- **🎨 Beautiful Terminal:** ASCII banners, gradients, and a clean timeline logger.
- **🛡️ Anti-Call:** Automatically reject and block incoming calls (can be toggled).
- **💾 Persistent Settings:** Saves your configurations using `lowdb`.
- **🔗 Dual Auth:** Supports both QR Code and Pairing Code.

## 📂 Project Structure

```text
src/
├── config/             # Configuration & DB initialization
│   ├── env.js          # Environment variables management
│   └── database.js     # lowdb setup
├── lib/                # Reusable utilities & libraries
│   ├── logger.js       # Centralized terminal logger
│   └── utils.js        # Helper functions
├── plugins/            # Command/Plugin directory (Auto-loaded)
│   ├── ping.js
│   ├── is.js
│   └── anticall.js
├── events/             # Event handlers
│   ├── connection.js   # Socket connection updates
│   ├── call.js         # Incoming call handling
│   └── message.js      # Message processing & command execution
└── index.js            # Main entry point (Orchestrator)
```

---

## 🛠️ Adding New Commands

Adding a new feature is easy! Just create a new `.js` file in `src/plugins/`:

```javascript
// src/plugins/hello.js
let handler = async (m, { conn, args }) => {
  await m.reply('Hello there!');
}

handler.help = ['hello']
handler.command = ['hello', 'hi'] // Multiple aliases
handler.tags = ['main']

export default handler
```
The bot will automatically detect and load your new command.

---

## 🚀 Getting Started

### 1. Requirements
- Node.js v18 or higher
- A WhatsApp account to use as the bot

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/kanata-lite.git
cd kanata-lite

# Install dependencies
npm install
```

### 3. Configuration
Copy `.env.example` to `.env` and fill in your details:
```env
BOT_PHONE_NUMBER=628xxx
AUTH_MODE=qr # or 'pairing'
PREFIX=.
BOT_NAME=Kanata Lite
AUTH_DIR=auth_info_baileys
```

### 4. Run
```bash
npm start
```

---

## 📸 Terminal Preview
When you run the bot, you'll see a beautiful ASCII banner and a clean timeline:
```text
[10:00:00] ℹ Scan QR berikut di WhatsApp:
[10:00:15] ✔ Tersambung sebagai 628xxx
[10:00:20] 💬 628xxx: .ping
[10:00:20] ℹ Eksekusi command: ping dari 628xxx
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

---
<p align="center">
  Built with ❤️ using <a href="https://github.com/WhiskeySockets/Baileys">Baileys</a>
</p>
