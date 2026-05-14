import { ChatInputCommandInteraction, SlashCommandBuilder, Message } from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sm64-coop-run')
        .setDescription('Add a new run to the SM64 uvideo server leaderboard')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Select the run category')
                .setRequired(true)
                .addChoices(
                    { name: '120 Star', value: '120 Star' },
                    { name: '70 Star', value: '70 Star' },
                    { name: '130 Star (Star Road)', value: '130 Star (Star Road)' },
                    { name: '80 Star (Star Road)', value: '80 Star (Star Road)' },
                )
        )
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Completion time (format: hh:mm:ss)')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const category = interaction.options.getString('category', true);
        const time = interaction.options.getString('time', true);

        // Regex to validate the hh:mm:ss format
        const timeRegex = /^\d{2}:\d{2}:\d{2}$/;

        if (!timeRegex.test(time)) {
            await interaction.reply({ content: 'Invalid time format! Please use **hh:mm:ss** (e.g., 01:23:45).', ephemeral: true });
            return;
        }

        await interaction.reply(`SM64 Co-op run recorded! Category: **${category}**, Time: **${time}**.\n\nWho else was involved? Please @ ping the users below within 60 seconds. (It is assumed that you participated in the run)`);

        if (!interaction.channel) return;

        // Filter to ensure only the user who ran the command can provide the pings
        const filter = (m: Message) => m.author.id === interaction.user.id;

        const collector = interaction.channel.createMessageCollector({
            filter,
            max: 1,
            time: 60000
        });

        collector.on('collect', async (message: Message) => {
            const pingedUsers = message.mentions.users;

            // Create list of participants starting with the command user
            const participants = [interaction.user.username];
            pingedUsers.forEach(user => {
                if (user.username !== interaction.user.username) {
                    participants.push(user.username);
                }
            });

            const numPlayers = participants.length;
            const runnersList = participants.join(', ');

            try {
                const dbPath = path.join(__dirname, '..', '..', 'main.db');
                const db = new Database(dbPath);

                const stmt = db.prepare('INSERT INTO sm64_runs (id, category, num_players, runners, time) VALUES (?, ?, ?, ?, ?)');
                stmt.run(randomUUID(), category, numPlayers, runnersList, time);
                db.close();

                await message.reply(`✅ **Run Saved!**\n**Category:** ${category}\n**Time:** ${time}\n**Players (${numPlayers}):** ${runnersList}`);
            } catch (err) {
                console.error(err);
                await message.reply("There was an error saving the run to the database. Ensure the `sm64_runs` table exists.");
            }
        });
    },
};