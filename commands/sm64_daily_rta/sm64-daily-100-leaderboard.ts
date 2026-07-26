import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getLeaderboardContent, getStarName } from '../../utils/sm64_daily_rta';
import { currentDaily100StarId, currentDaily100StarName } from '../../uvidbot_state';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sm64-daily-100-leaderboard')
        .setDescription('View the leaderboard for the SM64 daily 100-coin star')
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
            if (!currentDaily100StarId || !currentDaily100StarName) {
                await interaction.reply({ content: '❌ There is no active SM64 daily 100-coin star right now.', ephemeral: true });
                return;
            }
            starId = currentDaily100StarId;
            starName = currentDaily100StarName;
        }

        const content = getLeaderboardContent(starId, starName);
        await interaction.reply(content);
    },
};
