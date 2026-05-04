import { PassThrough } from 'node:stream';
import ffmpeg from 'fluent-ffmpeg';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

let handler = async (m, { sock, args, text }) => {
    const isGroup = m.chat?.endsWith('@g.us');
    if (!isGroup) return m.reply('Perintah ini hanya bisa digunakan di dalam grup!');

    let [textInput, warna, url] = text.split('|');
    let id = m.chat;

    if (url) {
        try {
            const inviteCode = url.split('/').pop().split('?')[0];
            let geti = await sock.groupGetInviteInfo(inviteCode);
            id = geti.id;
        } catch (e) {
            return m.reply('⚠️ Link grup tidak valid!');
        }
    }

    const contextInfo = m.message?.extendedTextMessage?.contextInfo || {};
    const quotedMessage = contextInfo.quotedMessage;
    
    // Determine the target message to process (quoted or original)
    const targetMessage = quotedMessage || m.message;
    const isQuoted = !!quotedMessage;
    
    // Helper to extract text from a message
    const getMessageText = (msg) => {
        return msg?.conversation || 
               msg?.extendedTextMessage?.text || 
               msg?.imageMessage?.caption || 
               msg?.videoMessage?.caption || 
               '';
    };

    // Helper to get mime type and media message
    const getMediaInfo = (msg) => {
        if (msg?.imageMessage) return { type: 'image', mime: msg.imageMessage.mimetype, msg: msg.imageMessage };
        if (msg?.videoMessage) return { type: 'video', mime: msg.videoMessage.mimetype, msg: msg.videoMessage };
        if (msg?.audioMessage) return { type: 'audio', mime: msg.audioMessage.mimetype, msg: msg.audioMessage };
        return { type: null, mime: '', msg: null };
    };

    const mediaInfo = getMediaInfo(targetMessage);
    const mime = mediaInfo.mime;
    const mediaMsg = mediaInfo.msg;
    const cap = textInput || (isQuoted ? getMessageText(quotedMessage) : getMessageText(m.message)) || '';

    // Download helper
    const downloadMedia = async (msgObj, type) => {
        const stream = await downloadContentFromMessage(msgObj, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    try {
        let content = null;

        if (mediaInfo.type === 'image') {
            const buffer = await downloadMedia(mediaMsg, 'image');
            content = { image: buffer, caption: cap };
        } else if (mediaInfo.type === 'video') {
            const buffer = await downloadMedia(mediaMsg, 'video');
            content = { video: buffer, caption: cap };
        } else if (mediaInfo.type === 'audio') {
            const buffer = await downloadMedia(mediaMsg, 'audio');
            await m.reply('Processing audio status...');
            const audioVn = await toVN(buffer);
            content = {
                audio: audioVn,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true
            };
        } else if (warna || textInput || text) {
            const warnaStatusWA = new Map([
                ['biru', '#34B7F1'], ['hijau', '#25D366'], ['kuning', '#FFD700'],
                ['jingga', '#FF8C00'], ['merah', '#FF3B30'], ['ungu', '#9C27B0'],
                ['abu', '#9E9E9E'], ['hitam', '#000000'], ['putih', '#FFFFFF'], ['cyan', '#00BCD4']
            ]);

            let color = '#25D366';
            if (warna) {
                const textWarna = warna.toLowerCase().trim();
                for (const [nama, kode] of warnaStatusWA.entries()) {
                    if (textWarna.includes(nama)) { color = kode; break; }
                }
            }
            content = { text: cap || textInput || text, backgroundColor: color };
        }

        if (!content) return m.reply('⚠️ Reply media atau kirim teks!');

        await m.reply('🚀 Uploading status...');

        await sock.sendMessage(id, {
            groupStatusMessage: content
        });
    } catch (err) {
        console.error('GroupStatus Error:', err);
        m.reply(`❌ Gagal: ${err.message}`);
    }
};

/**
 * Helpers for Audio
 */
async function toVN(inputBuffer) {
    return new Promise((resolve, reject) => {
        const inStream = new PassThrough();
        const outStream = new PassThrough();
        const chunks = [];
        inStream.end(inputBuffer);
        ffmpeg(inStream)
            .noVideo()
            .audioCodec('libopus')
            .format('ogg')
            .audioBitrate('48k')
            .audioChannels(1)
            .audioFrequency(48000)
            .outputOptions(['-map_metadata', '-1', '-application', 'voip', '-compression_level', '10', '-page_duration', '20000'])
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)))
            .pipe(outStream, { end: true });
        outStream.on('data', c => chunks.push(c));
    });
}

handler.help = ['swgc'];
handler.command = ['swgc', 'upswgc'];
handler.tags = ['group'];

export default handler;
