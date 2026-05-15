import { ChatInputCommandInteraction, SlashCommandBuilder, Message } from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Parses and formats a time string for Lunch Lady runs into MM:SS.MMM format.
 * Supports input like "1:03.123" (interpreted as 01:03.123).
 *
 * @param inputTime The raw time string from the user.
 * @returns Formatted time string (MM:SS.MMM) or null if invalid.
 */
function formatLunchLadyTime(inputTime: string): string | null {
    const match = inputTime.match(/^(\d{1,2}):(\d{2})\.(\d{3})$/);
    if (!match) {
        return null; // Invalid format
    }

    let minutes = parseInt(match[1], 10);
    let seconds = parseInt(match[2], 10);
    let milliseconds = parseInt(match[3], 10);

    if (isNaN(minutes) || isNaN(seconds) || isNaN(milliseconds) ||
        minutes < 0 || seconds < 0 || milliseconds < 0 ||
        seconds >= 60 || milliseconds >= 1000) { // Milliseconds can be 0-999
        return null; // Invalid numeric values or ranges
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

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
        const rawTime = interaction.options.getString('time', true);

        const formattedTime = formatLunchLadyTime(rawTime);

        if (!formattedTime) {
            await interaction.reply({ content: 'Invalid time format! Please use **mm:ss.mmm** (e.g., 05:23.450).', ephemeral: true });
            return;
        }
        const time = formattedTime; // Use the formatted time from now on

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

            if (numPlayers > 4) {
                await message.reply("❌ Error: A maximum of 4 players is allowed for Lunch Lady runs.");
                return;
            }

            const runnersList = participants.join(', ');

            try {
                const dbPath = path.join(__dirname, '..', '..', 'main.db');

                const getExisting = () => {
                    const db = new Database(dbPath);
                    const record = db.prepare('SELECT time FROM lunch_lady WHERE category = ? AND runners = ?').get(stage, runnersList) as { time: string } | undefined;
                    db.close();
                    return record;
                };

                const saveToDb = () => {
                    const db = new Database(dbPath);
                    const updateStmt = db.prepare('UPDATE lunch_lady SET time = ?, num_players = ? WHERE category = ? AND runners = ?');
                    const result = updateStmt.run(time, numPlayers, stage, runnersList);
                    if (result.changes === 0) {
                        const insertStmt = db.prepare('INSERT INTO lunch_lady (id, category, num_players, runners, time) VALUES (?, ?, ?, ?, ?)');
                        insertStmt.run(randomUUID(), stage, numPlayers, runnersList, time);
                    }
                    db.close();
                };

                const existingRecord = getExisting();

                if (existingRecord && time > existingRecord.time) {
                    await message.reply(`⚠️ Your new time (**${time}**) is slower than your existing record (**${existingRecord.time}**). If you still want to save this, reply with **OVERWRITE** within 60 seconds.`);

                    const overwriteFilter = (m: Message) => m.author.id === interaction.user.id;
                    const overwriteCollector = message.channel.createMessageCollector({ filter: overwriteFilter, max: 1, time: 60000 });

                    overwriteCollector.on('collect', async (m: Message) => {
                        if (m.content === 'OVERWRITE') {
                            saveToDb();
                            await message.reply(`✅ **Run Overwritten!**\n**Category:** ${stage}\n**Time:** ${time}\n**Players (${numPlayers}):** ${runnersList}`);
                        }
                    });
                } else {
                    saveToDb();
                    await message.reply(`✅ **Run Saved!**\n**Category:** ${stage}\n**Time:** ${time}\n**Players (${numPlayers}):** ${runnersList}`);
                }
            } catch (err) {
                console.error(err);
                await message.reply("There was an error saving the run to the database.");
            }
        });
    },
};