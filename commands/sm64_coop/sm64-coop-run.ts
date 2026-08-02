import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    Message, 
    TextChannel, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Parses and formats a time string for SM64 runs into HH:MM:SS format.
 * Supports input like "8:23" (interpreted as 00:08:23) or "1:08:23" (interpreted as 01:08:23).
 *
 * @param inputTime The raw time string from the user.
 * @returns Formatted time string (HH:MM:SS) or null if invalid.
 */
function formatSm64Time(inputTime: string): string | null {
    const parts = inputTime.split(':');
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (parts.length === 3) { // HH:MM:SS or H:MM:SS etc.
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
        seconds = parseInt(parts[2], 10);
    } else if (parts.length === 2) { // MM:SS (assume HH = 0)
        minutes = parseInt(parts[0], 10);
        seconds = parseInt(parts[1], 10);
    } else {
        return null; // Invalid number of parts
    }

    // Basic validation for numeric conversion and ranges
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) ||
        hours < 0 || minutes < 0 || seconds < 0 ||
        minutes >= 60 || seconds >= 60) {
        return null; // Invalid numeric values or ranges
    }

    // Format with leading zeros
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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
                    { name: '30 Star (Sapphire)', value: '30 Star (Sapphire)'},
                    { name: '13 Star', value: '13 Star'}
                )
        )
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Completion time (format: hh:mm:ss)')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const category = interaction.options.getString('category', true);
        const rawTime = interaction.options.getString('time', true);

        const formattedTime = formatSm64Time(rawTime);

        if (!formattedTime) {
            await interaction.reply({ content: 'Invalid time format! Please use **hh:mm:ss** (e.g., 01:23:45).', ephemeral: true });
            return;
        }
        const time = formattedTime; // Use the formatted time from now on

        await interaction.reply(`SM64 Co-op run recorded! Category: **${category}**, Time: **${time}**.\n\nWho else was involved? Please @ ping the users below within 60 seconds. (It is assumed that you participated in the run)`);

        if (!interaction.channel) return;

        // Filter to ensure only the user who ran the command can provide the pings
        const filter = (m: Message) => m.author.id === interaction.user.id;

        const collector = (interaction.channel as TextChannel).createMessageCollector({
            filter,
            max: 1,
            time: 60000
        });

        collector.on('collect', async (message: Message) => {
            const pingedUsers = message.mentions.users;

            // Initialize participants with the user who triggered the command
            const participants: string[] = [interaction.user.displayName];

            // Add mentioned users if they aren't the sender and aren't bots
            if (pingedUsers.size > 0) {
                pingedUsers.forEach(user => {
                    if (user.id !== interaction.user.id && !user.bot) {
                        participants.push(user.displayName);
                    }
                });
            }

            participants.sort((a, b) => a.localeCompare(b));

            const numPlayers = participants.length;
            const runnersList = participants.join(', ');

            try {
                const dbPath = path.join(__dirname, '..', '..', 'main.db');

                const getExisting = () => {
                    const db = new Database(dbPath);
                    const record = db.prepare('SELECT time FROM sm64_coop WHERE category = ? AND runners = ?').get(category, runnersList) as { time: string } | undefined;
                    db.close();
                    return record;
                };

                const saveToDb = () => {
                    const db = new Database(dbPath);
                    const updateStmt = db.prepare('UPDATE sm64_coop SET time = ?, num_players = ? WHERE category = ? AND runners = ?');
                    const result = updateStmt.run(time, numPlayers, category, runnersList);
                    if (result.changes === 0) {
                        const insertStmt = db.prepare('INSERT INTO sm64_coop (id, category, num_players, runners, time) VALUES (?, ?, ?, ?, ?)');
                        insertStmt.run(randomUUID(), category, numPlayers, runnersList, time);
                    }
                    db.close();
                };

                const existingRecord = getExisting();

                if (existingRecord && time > existingRecord.time) {
                    const confirmButton = new ButtonBuilder()
                        .setCustomId('confirm_coop_overwrite')
                        .setLabel('Overwrite Time')
                        .setStyle(ButtonStyle.Danger);

                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_coop_overwrite')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary);

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(confirmButton, cancelButton);

                    const response = await message.reply({
                        content: `⚠️ Your new time (**${time}**) is slower than your existing record (**${existingRecord.time}**). Are you sure you want to overwrite it?`,
                        components: [row]
                    });

                    const buttonCollector = response.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 60000
                    });

                    let handled = false;

                    buttonCollector.on('collect', async (buttonInteraction) => {
                        handled = true;
                        buttonCollector.stop();

                        if (buttonInteraction.customId === 'confirm_coop_overwrite') {
                            saveToDb();
                            await buttonInteraction.update({
                                content: `✅ **Run Overwritten!**\n**Category:** ${category}\n**Time:** ${time}\n**Players (${numPlayers}):** ${runnersList}`,
                                components: []
                            });
                        } else if (buttonInteraction.customId === 'cancel_coop_overwrite') {
                            await buttonInteraction.update({
                                content: `❌ Overwrite canceled. Your existing record (**${existingRecord.time}**) was kept.`,
                                components: []
                            });
                        }
                    });

                    buttonCollector.on('end', async (_, reason) => {
                        if (!handled) {
                            await response.edit({
                                content: `⏳ Time expired. Run was not overwritten.`,
                                components: []
                            });
                        }
                    });
                } else {
                    saveToDb();
                    await message.reply(`✅ **Run Saved!**\n**Category:** ${category}\n**Time:** ${time}\n**Players (${numPlayers}):** ${runnersList}`);
                }
            } catch (err) {
                console.error(err);
                await message.reply("There was an error saving the run to the database. Ensure the `sm64_coop` table exists.");
            }
        });
    },
};