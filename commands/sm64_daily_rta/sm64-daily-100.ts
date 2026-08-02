import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { state } from '../../uvidbot_state';
import { parseTimeToSeconds } from '../../utils/sm64_daily_rta';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sm64-daily-100')
        .setDescription('Submit your time for the current SM64 daily 100-coin star RTA')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time taken to beat the daily 100-coin star (e.g., 05:23.450 or 02:15)')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const time = interaction.options.getString('time', true);
        const player = interaction.user.username;

        if (!state.currentDaily100StarId || !state.currentDaily100StarName) {
            await interaction.reply({ content: '❌ There is no active SM64 daily 100-coin star right now.', ephemeral: true });
            return;
        }

        const run_id = state.currentDaily100StarId;
        const starName = state.currentDaily100StarName;

        const newSeconds = parseTimeToSeconds(time);
        if (newSeconds === null) {
            await interaction.reply({ content: '❌ Invalid time format! Please use format like `05:23.450`, `02:15`, or `59.56`.', ephemeral: true });
            return;
        }

        try {
            const dbPath = path.join(__dirname, '..', '..', 'main.db');
            const db = new Database(dbPath);

            const existingRecord = db.prepare('SELECT id, time FROM sm64_daily_rta WHERE star_id = ? AND player = ?')
                .get(run_id, player) as { id: string; time: string } | undefined;

            if (!existingRecord) {
                const insertStmt = db.prepare('INSERT INTO sm64_daily_rta (id, star_id, player, time) VALUES (?, ?, ?, ?)');
                insertStmt.run(randomUUID(), run_id, player, time);
                db.close();

                await interaction.reply(`✅ Daily 100-coin run saved for **${starName}**! Player: **${player}**, Time: **${time}**.`);
            } else {
                const existingSeconds = parseTimeToSeconds(existingRecord.time);
                const isSlower = existingSeconds !== null ? newSeconds > existingSeconds : time > existingRecord.time;

                if (isSlower) {
                    db.close();

                    const confirmButton = new ButtonBuilder()
                        .setCustomId('confirm_overwrite')
                        .setLabel('Overwrite Time')
                        .setStyle(ButtonStyle.Danger);

                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_overwrite')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary);

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(confirmButton, cancelButton);

                    const response = await interaction.reply({
                        content: `⚠️ Your new time (**${time}**) is slower than your existing record (**${existingRecord.time}**). Are you sure you want to overwrite it?`,
                        components: [row],
                        fetchReply: true
                    });

                    const collector = response.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 60000
                    });

                    let handled = false;

                    collector.on('collect', async (buttonInteraction) => {
                        handled = true;
                        collector.stop();

                        if (buttonInteraction.customId === 'confirm_overwrite') {
                            const dbUpdate = new Database(dbPath);
                            const updateStmt = dbUpdate.prepare('UPDATE sm64_daily_rta SET time = ? WHERE star_id = ? AND player = ?');
                            updateStmt.run(time, run_id, player);
                            dbUpdate.close();

                            await buttonInteraction.update({
                                content: `✅ **Run Overwritten!** Daily 100-coin run saved for **${starName}**! Player: **${player}**, Time: **${time}**.`,
                                components: []
                            });
                        } else if (buttonInteraction.customId === 'cancel_overwrite') {
                            await buttonInteraction.update({
                                content: `❌ Overwrite canceled. Your existing record (**${existingRecord.time}**) was kept.`,
                                components: []
                            });
                        }
                    });

                    collector.on('end', async (_, reason) => {
                        if (!handled) {
                            await interaction.editReply({
                                content: `⏳ Time expired. Run was not overwritten.`,
                                components: []
                            });
                        }
                    });
                } else {
                    const updateStmt = db.prepare('UPDATE sm64_daily_rta SET time = ? WHERE star_id = ? AND player = ?');
                    updateStmt.run(time, run_id, player);
                    db.close();

                    await interaction.reply(`✅ Daily 100-coin run updated/saved for **${starName}**! Player: **${player}**, Time: **${time}**.`);
                }
            }
        } catch (err) {
            console.error('Error saving sm64 daily 100-coin run:', err);
            await interaction.reply({ content: '❌ There was an error recording your daily 100-coin run.', ephemeral: true });
        }
    },
};