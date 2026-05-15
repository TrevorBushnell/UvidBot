import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Database from 'better-sqlite3';
import path from 'node:path';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lunch-lady-leaderboard')
        .setDescription('View the leaderboard for Lunch Lady')
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
        .addIntegerOption(option =>
            option.setName('players')
                .setDescription('Filter by the number of players')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(4)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const stage = interaction.options.getString('stage', true);
        const numPlayers = interaction.options.getInteger('players', true);
        const dbPath = path.join(__dirname, '..', '..', 'main.db');

        try {
            const db = new Database(dbPath);
            const stmt = db.prepare('SELECT runners, time FROM lunch_lady WHERE category = ? AND num_players = ? ORDER BY time ASC');
            const rows = stmt.all(stage, numPlayers) as { runners: string, time: string }[];
            db.close();

            if (rows.length === 0) {
                await interaction.reply({
                    content: `No runs found for **${stage}** with **${numPlayers}** players.`,
                    ephemeral: true
                });
                return;
            }

            const leaderboardString = rows
                .map((row, index) => `${index + 1}. **${row.time}** - ${row.runners}`)
                .join('\n');

            await interaction.reply({
                content: `### Lunch Lady Leaderboard\n**Stage:** ${stage}\n**Players:** ${numPlayers}\n\n${leaderboardString}`
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "There was an error fetching the leaderboard.", ephemeral: true });
        }
    },
};