import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getStarName } from '../../utils/sm64_daily_rta';
import { state } from '../../uvidbot_state';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily-overwrite')
        .setDescription('Overwrite the current SM64 daily stars (Authorized users only)')
        .addStringOption(option =>
            option.setName('star_id')
                .setDescription('Star ID for the daily single star')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('star_100_id')
                .setDescription('Star ID for the daily 100-coin star')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.user.username !== 'trevvvyb') {
            await interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
            return;
        }

        const starId = interaction.options.getString('star_id', true);
        const star100Id = interaction.options.getString('star_100_id', true);

        const starName = getStarName(starId);
        if (!starName) {
            await interaction.reply({ content: `❌ Star with ID '${starId}' not found.`, ephemeral: true });
            return;
        }

        const star100Name = getStarName(star100Id);
        if (!star100Name) {
            await interaction.reply({ content: `❌ Star with ID '${star100Id}' not found.`, ephemeral: true });
            return;
        }

        state.currentDailyStarId = starId;
        state.currentDailyStarName = starName;
        state.currentDaily100StarId = star100Id;
        state.currentDaily100StarName = star100Name;

        await interaction.reply({
            content: `✅ Successfully overwritten daily stars!\n* Single Star: **${starName}** (ID: \`${starId}\`)\n* 100 Coin Star: **${star100Name}** (ID: \`${star100Id}\`)`,
            ephemeral: true
        });
    },
};
