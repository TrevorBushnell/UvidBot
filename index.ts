import dotenv from 'dotenv'
dotenv.config()

import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ],
});

client.login(process.env.DISCORD_TOKEN);

client.on("messageCreate", async (message) => {
    console.log(message)

    // ignore messages from bots
    if (message.author.bot) return;

    if (message.author.username === "frobuddyharry") {
        message.channel.send("I would be careful what you say Harrison");
    }
    
    if (message.author.username === "alien__5") {
        message.channel.send("Alien be liking shit in his ass")
    }

    if (message.author.username === "glitchypbpr") {
        message.channel.send("unmute tbh")
    }
});