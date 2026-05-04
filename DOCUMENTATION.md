# 📖 Dokumentasi Lengkap Kanata Lite

Selamat datang di panduan resmi **Kanata Lite**, sebuah scaffold bot WhatsApp minimalis namun kuat yang dibangun di atas library `@whiskeysockets/baileys`.

---

## 📑 Daftar Isi
1. [Pendahuluan](#-pendahuluan)
2. [Arsitektur Proyek](#-arsitektur-proyek)
3. [Instalasi & Persiapan](#-instalasi--persiapan)
4. [Konfigurasi (.env)](#-konfigurasi-env)
5. [Panduan Pengembangan Plugin](#-panduan-pengembangan-plugin)
6. [Sistem Event](#-sistem-event)
7. [Utilitas & Logger](#-utilitas--logger)
8. [Tips & Troubleshooting](#-tips--troubleshooting)

---

## 🌟 Pendahuluan
**Kanata Lite** dirancang untuk menjadi titik awal (scaffold) bagi pengembang yang ingin membuat bot WhatsApp tanpa harus berurusan dengan kerumitan *boilerplate* koneksi. Fokus utama proyek ini adalah **modularditas**, **keindahan terminal**, dan **kemudahan penggunaan**.

---

## 🏗️ Arsitektur Proyek
Proyek ini menggunakan struktur modular untuk memisahkan logika bisnis dari inti bot:

```text
kanata-lite/
├── src/
│   ├── config/      # Pengaturan lingkungan & Database (lowdb)
│   ├── lib/         # Fungsi pembantu & Logger kustom
│   ├── events/      # Handler untuk event koneksi, pesan, dan telepon
│   ├── plugins/     # Folder untuk fitur/command (Auto-load)
│   └── index.js     # Orchestrator utama
├── auth_info_baileys/ # Data sesi WhatsApp (Jangan dibagikan!)
├── db.json          # Database lokal untuk pengaturan
└── README.md        # Ringkasan proyek
```

---

## 🚀 Instalasi & Persiapan

### Prasyarat
- **Node.js** v18 atau lebih tinggi.
- **Git** untuk manajemen versi.
- Akun WhatsApp aktif.

### Langkah Instalasi
1. **Clone & Install:**
   ```bash
   git clone https://github.com/idlanyor/kanata-lite.git
   cd kanata-lite
   npm install
   ```
2. **Setup Env:**
   Salin `.env.example` menjadi `.env` dan sesuaikan nilainya.

3. **Jalankan:**
   ```bash
   npm start
   ```

---

## ⚙️ Konfigurasi (.env)

| Variabel | Deskripsi | Contoh |
|----------|-----------|---------|
| `BOT_PHONE_NUMBER` | Nomor bot (Wajib jika menggunakan mode `pairing`) | `628123456789` |
| `AUTH_MODE` | Mode login: `qr` atau `pairing` | `qr` |
| `PREFIX` | Karakter awalan untuk command | `.` |
| `BOT_NAME` | Nama bot yang muncul di banner & sistem | `Kanata Lite` |
| `AUTH_DIR` | Nama folder untuk menyimpan sesi | `auth_info_baileys` |

---

## 🔌 Panduan Pengembangan Plugin
Kanata Lite menggunakan sistem **Auto-load**. Setiap file `.js` di `src/plugins/` akan otomatis didaftarkan sebagai command.

### Struktur Dasar Plugin
```javascript
// src/plugins/contoh.js

/**
 * @param {m} object - Objek pesan yang sudah didekorasi
 * @param {sock, conn, args, command, text, plugins} extra - Objek pembantu
 */
let handler = async (m, { conn, args, command, text }) => {
    // m.reply otomatis membalas ke chat yang sama
    await m.reply(`Halo! Anda memanggil command: ${command}`);
    
    // args adalah array argumen setelah command
    if (args.length > 0) {
        await m.reply(`Argumen yang Anda berikan: ${text}`);
    }
}

handler.help = ['contoh <teks>'] // Petunjuk penggunaan
handler.command = ['contoh', 'test'] // Nama command (alias)
handler.tags = ['main'] // Kategori command

export default handler
```

### Properti Objek `m` (Pesan)
- `m.chat`: JID chat (grup/pribadi).
- `m.sender`: JID pengirim pesan.
- `m.text`: Isi pesan (tanpa prefix).
- `m.reply(teks)`: Fungsi instan untuk membalas pesan.

---

## 📡 Sistem Event
Event dipisahkan agar `index.js` tetap bersih:

1. **Connection (`events/connection.js`):** Mengatur logika *reconnect*, tampilan QR code, dan log status koneksi.
2. **Call (`events/call.js`):** Menangani telepon masuk. Jika `Anti-Call` aktif, bot akan menolak telepon, mengirim pesan, dan memblokir penelepon secara otomatis.
3. **Message (`events/message.js`):** "Otak" yang memproses pesan masuk, menghias objek pesan, mencari plugin yang cocok, dan mengeksekusinya.

---

## 🛠️ Utilitas & Logger

### Logger (`lib/logger.js`)
Gunakan `terminal.log(message, type)` untuk log yang konsisten.
- Tipe: `info`, `success`, `warn`, `error`, `pairing`, `msg`.

### Utils (`lib/utils.js`)
- `formatDuration(ms)`: Mengubah milidetik ke format `1d 2h 3m 4s`.
- `parseMessageText(m)`: Mengambil teks dari berbagai tipe pesan WhatsApp.
- `delay(ms)`: Fungsi *sleep* berbasis Promise.

---

## 🤖 Integrasi AI (Model Context Protocol)
Kanata Lite kini mendukung **MCP (Model Context Protocol)**. Ini memungkinkan AI (seperti Claude Desktop) untuk menggunakan bot ini sebagai alat (*tool*).

### Tools yang Tersedia:
- `send_whatsapp_message`: AI bisa mengirim pesan ke nomor mana pun.
- `get_bot_status`: AI bisa memantau kesehatan sistem.
- `toggle_anticall`: AI bisa mengatur mode anti-call.

### Cara Menggunakan dengan Claude Desktop:
Tambahkan konfigurasi berikut di file `claude_desktop_config.json` Anda:
```json
{
  "mcpServers": {
    "kanata-lite": {
      "command": "node",
      "args": ["/path/to/kanata-lite/src/index.js"]
    }
  }
}
```

---

## 💡 Tips & Troubleshooting

### Mengatasi Error `bad-request` saat Blokir
Ini biasanya terjadi karena server WhatsApp menolak permintaan yang terlalu cepat. Kami sudah menambahkan `delay(2000)` di handler telepon untuk mencegah hal ini.

### Menghapus Sesi
Jika Anda ingin login ulang dengan nomor lain:
1. Hentikan bot (Ctrl+C).
2. Hapus folder `auth_info_baileys`.
3. Jalankan kembali bot.

### Plugin Tidak Terdeteksi
Pastikan file di `src/plugins/` memiliki `export default handler` dan memiliki properti `handler.command` berupa array atau string.

---
<p align="center">
  Dibuat dengan ❤️ untuk komunitas pengembang bot WhatsApp.
</p>
