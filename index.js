import { create } from 'venom-bot';
import { ChatGPTAPI } from "chatgpt";
import mongoose from "mongoose";
import Context from "./models/Context.js";
import * as dotenv from "dotenv"
dotenv.config();

const api = new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY });

mongoose.connect(process.env.DB_URL)
    .then(() => {
        // instalation client Venom
        create({
            session: 'zanCorp', //name of session
            multidevice: true // for version not multidevice use false.(default: true)
        })
        .then((client) => start(client))
        .catch((erro) => {
            console.log(erro);
        });
    })

const sendMessage = async (chatId, message) => {
    let response;

    try {
        const doc = await Context.findOne({ contactId: chatId });
        if (doc) {
            const { contextId } = doc;
            response = await api.sendMessage(message, {
                parentMessageId: contextId
            });
            await Context.findOneAndUpdate(
                { _id: doc._id },
                { contextId: response.id }
            );
            console.log("Conversation context updated");
        } else {
            response = await api.sendMessage(message);
            const context = new Context({
                contactId: chatId,
                contextId: response.id
            });
            await context.save();
        }
        return response;
    } catch (err) {
        throw new Error("Error Message: ", { cause: err });
    }
}

const deleteConversation = async (chatId) => {

    try {
        const doc = await Context.findOne({ contactId: chatId });

        if (doc) {
            const { contextId } = doc;
            await Context.findOneAndRemove(
                { _id: doc._id },
            );
            console.log("Conversation context removed");
        } else {
            console.log("failed to delete conversation")
        }
    } catch (err) {
        throw new Error("Error Message: ", { cause: err });
    }
}

async function start(client) {
    client.onMessage(async (message) => {
        const chatId = message.from;
        const text = message.body;

        if (text === '!hapus') {
            await client.sendText(chatId, 'Menghapus percakapan sebelumnya...');
            await client.startTyping(chatId);
            deleteConversation(chatId);
            await new Promise(resolve => setTimeout(resolve, 3000));
            await client.stopTyping(chatId);
            await client.sendText(chatId, 'Percakapan sebelumnya telah dihapus.');
        } else if (text) {
            try {
                console.log(`Message received from: ${chatId}`);
                await client.startTyping(chatId); // activate typing status
                sendMessage(chatId, text)
                    .then(async reply => {
                        console.log("ChatGPT reply received");
                        await client.sendText(chatId, reply.text);
                    })
                    .catch(async e => {
                        console.error(e.message, e.cause);
                        await client.sendText(chatId, "An error was encountered. Please try again in a moment.");
                    });
                await client.stopTyping(chatId); // stopping typing status
            } catch (error) {
                await client.sendText(chatId, "error, try again"); // send message
                console.log(error);
            }
        }
    });
}