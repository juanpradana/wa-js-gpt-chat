const venom = require('venom-bot');
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

// Konfigurasi OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
const openai = new OpenAIApi(configuration);

// Inisialisasi client Venom
venom.create({
    session: 'zanCorp', //name of session
    multidevice: true // for version not multidevice use false.(default: true)
})
.then((client) => start(client))
.catch((erro) => {
    console.log(erro);
});

async function start(client) {
    // Ketika menerima pesan baru
    client.onMessage(async (message) => {
        const chatId = message.from;
        const text = message.body;

        // Jika pesan adalah "hapus"
        if (text.toLowerCase() === 'hapus') {
            // Kirim pesan typing status
            await client.sendText(chatId, 'Menghapus percakapan sebelumnya...'); // kirim pesan

            // Kirim pesan konfirmasi
            await client.startTyping(chatId); // aktifkan typing status
            await new Promise(resolve => setTimeout(resolve, 3000)); // tunggu 3 detik
            await client.stopTyping(chatId); // matikan typing status
            await client.sendText(chatId, 'Percakapan sebelumnya telah dihapus.'); // kirim pesan
        }

        // Jika pesan tidak kosong
        else if (text) {
            try {
                // Kirim pesan typing status
                await client.sendText(chatId, 'Memproses permintaan...'); // kirim pesan
                await client.startTyping(chatId); // aktifkan typing status
                // Panggil API OpenAI
                const prompt = text;
                const response = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [{role: "user", content: prompt}],
                });
                // Kirim hasil balasan dari OpenAI
                const message = response.data.choices[0].message.content;
                console.log(response.data.usage);
                await client.sendText(chatId, message); // kirim pesan
            } catch (error) {
                await client.sendText(chatId, "error"); // kirim pesan
                console.log(error.data);
            }
        }
    });
}