import { ChatInputCommandInteraction, SlashCommandBuilder, Message } from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lunch-lady-run')
        .setDescription('Record a Lunch Lady run')
        .addStringOption(option =>
            option.setName('stage')
                .setDescription('Select the stage')
                .setRequired(true)
                .addChoices(
                    { name: 'Full Run', value: 'Full Run' },
                    { name: 'Cruxville Junior High', value: 'Cruxville Junior High' },
                    { name: 'Higgins High School', value: 'Higgins High School' },
                    { name: 'Higgins Swimming Hall', value: 'Higgins Swimming Hall' },
                    { name: 'Burcksley High School', value: 'Burcksley High School' },
                    { name: 'Melbury High School', value: 'Melbury High School' },
                    { name: 'Manic University', value: 'Manic University' },
                    { name: 'Hibashi High School', value: 'Hibashi High School' },
                    { name: 'Nightmare High', value: 'Nightmare High' },
                    { name: 'Community Swimming Hall', value: 'Community Swimming Hall' },
                )
        )
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Completion time (format: mm:ss.mmm)')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const stage = interaction.options.getString('stage', true);
        const time = interaction.options.getString('time', true);

        // Simple regex to validate the mm:ss.mmm format
        const timeRegex = /^\d{2}:\d{2}\.\d{3}$/;

        if (!timeRegex.test(time)) {
            await interaction.reply({ content: 'Invalid time format! Please use **mm:ss.mmm** (e.g., 05:23.450).', ephemeral: true });
            return;
        }

        await interaction.reply(`Lunch Lady run recorded! Stage: **${stage}**, Time: **${time}**.\n\nWho else was involved? Please @ ping the users below within 60 seconds. (It is assumed that you participated in the run)`);

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

                const stmt = db.prepare('INSERT INTO lunch_lady (id, category, num_players, runners, time) VALUES (?, ?, ?, ?, ?)');
                stmt.run(randomUUID(), stage, numPlayers, runnersList, time);
                db.close();

                await message.reply(`✅ **Run Saved!**\n**Category:** ${stage}\n**Time:** ${time}\n**Players (${numPlayers}):** ${runnersList}`);
            } catch (err) {
                console.error(err);
                await message.reply("There was an error saving the run to the database.");
            }
        });
    },
};