import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sm64-coop-leaderboard')
        .setDescription('View the leaderboard for SM64 Co-op')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Select the run category')
                .setRequired(true)
                .addChoices(
                    { name: '120 Star', value: '120 Star' },
                    { name: '70 Star', value: '70 Star' },
                    { name: '130 Star (Star Road)', value: '130 Star (Star Road)' },
                    { name: '80 Star (Star Road)', value: '80 Star (Star Road)' },
                    { name: '30 Star (Sapphire)', value: '30 Star (Sapphire)' },
                    { name: '13 Star', value: '13 Star'}
                )
        )
        .addIntegerOption(option =>
            option.setName('players')
                .setDescription('Filter by the number of players')
                .setRequired(true)
                .setMinValue(1)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const category = interaction.options.getString('category', true);
        const numPlayers = interaction.options.getInteger('players', true);
        const dbPath = path.join(__dirname, '..', '..', 'main.db');

        try {
            const db = new Database(dbPath);
            const stmt = db.prepare('SELECT runners, time FROM sm64_coop WHERE category = ? AND num_players = ? ORDER BY time ASC');
            const rows = stmt.all(category, numPlayers) as { runners: string, time: string }[];
            db.close();

            if (rows.length === 0) {
                await interaction.reply({
                    content: `No runs found for **${category}** with **${numPlayers}** players.`,
                    ephemeral: true
                });
                return;
            }

            const leaderboardString = rows
                .map((row, index) => `${index + 1}. **${row.time}** - ${row.runners}`)
                .join('\n');

            await interaction.reply({
                content: `### SM64 Co-op Leaderboard\n**Category:** ${category}\n**Players:** ${numPlayers}\n\n${leaderboardString}`
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "There was an error fetching the leaderboard.", ephemeral: true });
        }
    },
};