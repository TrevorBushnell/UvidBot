import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { selectNewDaily100Star, announceDailyStars } from '../../utils/sm64_daily_rta';
import * as state from '../../uvidbot_state';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sm64-daily-100-reroll')
        .setDescription('Reroll the current SM64 daily 100-coin star (Authorized users only)'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.user.username !== 'trevvvyb') {
            await interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
            return;
        }

        await interaction.reply({ content: '🔄 Rerolling daily 100-coin star...', ephemeral: true });

        try {
            const guilds = await interaction.client.guilds.fetch();
            for (const [guildId, oauth2Guild] of guilds) {
                try {
                    const guild = await oauth2Guild.fetch();
                    await guild.channels.fetch();
                    const channel = guild.channels.cache.find(c => c.name === 'sm64-daily-rta' && c.isTextBased()) as any;
                    if (channel) {
                        await channel.send('STAR OVERWRITE');
                    }
                } catch (guildErr) {
                    console.error(`Error sending STAR OVERWRITE message in guild ${oauth2Guild.name}:`, guildErr);
                }
            }

            await selectNewDaily100Star(interaction.client);
            (state as any).daysUntil100CoinReroll = 0;
            await announceDailyStars(interaction.client);
        } catch (err) {
            console.error('Error rerolling daily 100-coin star:', err);
        }
    },
};
