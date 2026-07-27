import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getLeaderboardContent, getStarName } from '../../utils/sm64_daily_rta';
import { state } from '../../uvidbot_state';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sm64-daily-leaderboard')
        .setDescription('View the leaderboard for the SM64 daily star')
        .addStringOption(option =>
            option.setName('star_id')
                .setDescription('Optional star ID to view leaderboard for a specific star')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const starIdParam = interaction.options.getString('star_id');

        let starId: string;
        let starName: string | null;

        if (starIdParam) {
            starId = starIdParam;
            starName = getStarName(starId);
            if (!starName) {
                await interaction.reply({ content: `❌ Star with ID '${starId}' not found.`, ephemeral: true });
                return;
            }
        } else {
            if (!state.currentDailyStarId || !state.currentDailyStarName) {
                await interaction.reply({ content: '❌ There is no active SM64 daily star right now.', ephemeral: true });
                return;
            }
            starId = state.currentDailyStarId;
            starName = state.currentDailyStarName;
        }

        const content = getLeaderboardContent(starId, starName);
        await interaction.reply(content);
    },
};
