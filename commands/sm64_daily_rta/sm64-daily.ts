import { ChatInputCommandInteraction, SlashCommandBuilder, TextChannel, Message } from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { state } from '../../uvidbot_state';

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

        if (!state.currentDailyStarId || !state.currentDailyStarName) {
            await interaction.reply({ content: '❌ There is no active SM64 daily star right now.', ephemeral: true });
            return;
        }

        const run_id = state.currentDailyStarId;
        const starName = state.currentDailyStarName;

        try {
            const dbPath = path.join(__dirname, '..', '..', 'main.db');
            const db = new Database(dbPath);

            const existingRecord = db.prepare('SELECT id, time FROM sm64_daily_rta WHERE star_id = ? AND player = ?').get(run_id, player) as { id: string; time: string } | undefined;

            if (!existingRecord) {
                const insertStmt = db.prepare('INSERT INTO sm64_daily_rta (id, star_id, player, time) VALUES (?, ?, ?, ?)');
                insertStmt.run(randomUUID(), run_id, player, time);
                db.close();

                await interaction.reply(`✅ Daily run saved for **${starName}**! Player: **${player}**, Time: **${time}**.`);
            } else if (time > existingRecord.time) {
                db.close();
                await interaction.reply(`⚠️ Your new time (**${time}**) is slower than your existing record (**${existingRecord.time}**). If you still want to save this, please type **CONFIRM** within 60 seconds.`);

                if (!interaction.channel) return;

                const filter = (m: Message) => m.author.id === interaction.user.id;
                const collector = (interaction.channel as TextChannel).createMessageCollector({
                    filter,
                    max: 1,
                    time: 60000
                });

                collector.on('collect', async (message: Message) => {
                    if (message.content.trim() === 'CONFIRM') {
                        const db = new Database(dbPath);
                        const updateStmt = db.prepare('UPDATE sm64_daily_rta SET time = ? WHERE star_id = ? AND player = ?');
                        updateStmt.run(time, run_id, player);
                        db.close();

                        await message.reply(`✅ **Run Overwritten!** Daily run saved for **${starName}**! Player: **${player}**, Time: **${time}**.`);
                    } else {
                        await message.reply(`❌ Confirmation not received or incorrect. Run was not overwritten.`);
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        await interaction.followUp({ content: `⏳ Time expired. Run was not overwritten.`, ephemeral: true });
                    }
                });
            } else {
                const updateStmt = db.prepare('UPDATE sm64_daily_rta SET time = ? WHERE star_id = ? AND player = ?');
                updateStmt.run(time, run_id, player);
                db.close();

                await interaction.reply(`✅ Daily run updated/saved for **${starName}**! Player: **${player}**, Time: **${time}**.`);
            }
        } catch (err) {
            console.error('Error saving sm64 daily run:', err);
            await interaction.reply({ content: '❌ There was an error recording your daily run.', ephemeral: true });
        }
    },
};
