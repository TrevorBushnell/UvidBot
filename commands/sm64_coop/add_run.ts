import { ChatInputCommandInteraction } from "discord.js";

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('sm64-coop-run').setDescription('Add a new run to the SM64 uvideo server leaderboard'),
    async execute(interaction: ChatInputCommandInteraction) {
        console.log(interaction.command)
    }
}