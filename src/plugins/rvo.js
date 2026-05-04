import { downloadContentFromMessage } from '@whiskeysockets/baileys';

let handler = async (m, { sock }) => {
    const contextInfo = m.message?.extendedTextMessage?.contextInfo || {};
    const quotedMessageRaw = contextInfo.quotedMessage;

    if (!quotedMessageRaw) {
        return m.reply('Balas pada pesan *Sekali Lihat* (gambar/video/audio) untuk mengambil datanya.');
    }

    // Check if the quoted message is a View Once message
    const viewOnceMsg = quotedMessageRaw.viewOnceMessage?.message || 
                        quotedMessageRaw.viewOnceMessageV2?.message || 
                        quotedMessageRaw.viewOnceMessageV2Extension?.message;

    if (!viewOnceMsg) {
        return m.reply('Pesan yang dibalas bukan pesan *Sekali Lihat* (View Once).');
    }

    const react = async (emoji) => {
        await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
    };

    await react('⏳');

    try {
        let mediaType = '';
        let mediaMessage = null;
        
        if (viewOnceMsg.imageMessage) {
            mediaType = 'image';
            mediaMessage = viewOnceMsg.imageMessage;
        } else if (viewOnceMsg.videoMessage) {
            mediaType = 'video';
            mediaMessage = viewOnceMsg.videoMessage;
        } else if (viewOnceMsg.audioMessage) {
            mediaType = 'audio';
            mediaMessage = viewOnceMsg.audioMessage;
        } else {
            await react('❌');
            return m.reply('Tipe media tidak didukung.');
        }

        const stream = await downloadContentFromMessage(mediaMessage, mediaType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const caption = mediaMessage.caption 
            ? `*Read View Once Success*\n\n*Caption:* ${mediaMessage.caption}` 
            : `*Read View Once Success*`;

        if (mediaType === 'image') {
            await sock.sendMessage(m.chat, { image: buffer, caption }, { quoted: m });
        } else if (mediaType === 'video') {
            await sock.sendMessage(m.chat, { video: buffer, caption }, { quoted: m });
        } else if (mediaType === 'audio') {
            const isPtt = mediaMessage.ptt || false;
            await sock.sendMessage(m.chat, { 
                audio: buffer, 
                mimetype: mediaMessage.mimetype || 'audio/mpeg', 
                ptt: isPtt 
            }, { quoted: m });
        }

        await react('✅');
    } catch (err) {
        console.error('RVO Error:', err);
        await m.reply(`Gagal mengambil media: ${err.message}`);
        await react('❌');
    }
};

handler.help = ['rvo'];
handler.command = ['rvo', 'readviewonce', 'lihat'];
handler.tags = ['tools'];

export default handler;
