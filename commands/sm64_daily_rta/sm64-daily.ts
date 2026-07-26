import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { currentDailyStarId, currentDailyStarName } from '../../uvidbot_state';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sm64-daily')
        .setDescription('Submit your time for the current SM64 daily star RTA')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time taken to beat the daily star (e.g., 05:23.450 or 02:15)')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const time = interaction.options.getString('time', true);
        const player = interaction.user.username;

        if (!currentDailyStarId || !currentDailyStarName) {
            await interaction.reply({ content: '❌ There is no active SM64 daily star right now.', ephemeral: true });
            return;
        }

        const run_id = currentDailyStarId;
        const id = randomUUID();

        try {
            const dbPath = path.join(__dirname, '..', '..', 'main.db');
            const db = new Database(dbPath);

            const insertStmt = db.prepare('INSERT INTO sm64_daily_rta (id, run_id, player, time) VALUES (?, ?, ?, ?)');
            insertStmt.run(id, run_id, player, time);

            db.close();

            await interaction.reply(`✅ Daily run saved for **${currentDailyStarName}**! Player: **${player}**, Time: **${time}**.`);
        } catch (err) {
            console.error('Error saving sm64 daily run:', err);
            await interaction.reply({ content: '❌ There was an error recording your daily run.', ephemeral: true });
        }
    },
};
