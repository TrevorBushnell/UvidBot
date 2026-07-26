import dotenv from 'dotenv'
dotenv.config()

import { Client, Collection, Events, Interaction, GatewayIntentBits, MessageFlags, CommandInteraction, TextChannel } from 'discord.js';
import { SlashCommand } from './types';
import Database from 'better-sqlite3';
import * as state from './uvidbot_state';
import { getLeaderboardContent, selectNewDailyStar, selectNewDaily100Star, announceDailyStars } from './utils/sm64_daily_rta';

const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates
	],
});

async function checkAndMaybeKickFrobuddyharry() {
	console.log(`[${new Date().toISOString()}] Checking if frobuddyharry is in voice to roll for kick...`);
	const usernameToKick = 'frobuddyharry';

	try {
		const guilds = await client.guilds.fetch();
		for (const [guildId, oauth2Guild] of guilds) {
			try {
				const guild = await oauth2Guild.fetch();
				const voiceStates = guild.voiceStates.cache;

				for (const [memberId, voiceState] of voiceStates) {
					if (voiceState.channelId) {
						const member = voiceState.member || await guild.members.fetch(memberId).catch(() => null);
						if (member && member.user && member.user.username === usernameToKick) {
							console.log(`Found ${usernameToKick} in voice channel ${voiceState.channelId} in guild ${guild.name}. Rolling 1% chance to kick...`);
							const roll = Math.random(); // 0 to 1
							if (roll < 0.01) {
								console.log(`Roll was ${roll.toFixed(4)} (< 0.01). Kicking ${usernameToKick} from voice channel...`);
								if (member.voice) {
									await member.voice.disconnect('1% chance kick event');
									console.log(`Successfully kicked ${usernameToKick} from voice.`);
								} else {
									console.log(`Member voice state not found, could not disconnect.`);
								}
							} else {
								console.log(`Roll was ${roll.toFixed(4)} (>= 0.01). Not kicking.`);
							}
						}
					}
				}
			} catch (guildError) {
				console.error(`Error checking guild ${oauth2Guild.name} for kick check:`, guildError);
			}
		}
	} catch (err) {
		console.error('Error during voice kick check:', err);
	}
}

function startFrobuddyharryKickCheck() {
	console.log(`[${new Date().toISOString()}] Starting 10-minute kick check loop for frobuddyharry...`);
	// 10 minutes in milliseconds: 10 * 60 * 1000 = 600000
	setInterval(checkAndMaybeKickFrobuddyharry, 600000);
}

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	startFrobuddyharryKickCheck();
	scheduleDailyStarSelection();
});

async function selectDailySm64Star() {
	console.log(`[${new Date().toISOString()}] Transitioning previous daily SM64 star and selecting a new one...`);
	try {
		if (state.currentDailyStarId && state.currentDailyStarName) {
			const leaderboardMessage = getLeaderboardContent(state.currentDailyStarId, state.currentDailyStarName);

			const guilds = await client.guilds.fetch();
			for (const [guildId, oauth2Guild] of guilds) {
				try {
					const guild = await oauth2Guild.fetch();
					await guild.channels.fetch();
					const channel = guild.channels.cache.find(c => c.name === 'sm64-daily-rta' && c.isTextBased()) as TextChannel | undefined;
					if (channel) {
						await channel.send(leaderboardMessage);
						console.log(`Sent final leaderboard for previous daily star to #sm64-daily-rta in guild ${guild.name}`);
					}
				} catch (guildErr) {
					console.error(`Error sending leaderboard message in guild ${oauth2Guild.name}:`, guildErr);
				}
			}

			const dbPath = path.join(__dirname, 'main.db');
			const db = new Database(dbPath);
			
			db.prepare('UPDATE sm64_ss SET ss_rta = true WHERE id = ?').run(state.currentDailyStarId);
			db.close();
		}

		await selectNewDailyStar(client);

		(state as any).daysUntil100CoinReroll = ((state as any).daysUntil100CoinReroll || 0) + 1;

		if ((state as any).daysUntil100CoinReroll === 3 || !state.currentDaily100StarId) {
			console.log(`[${new Date().toISOString()}] 3 days reached (or initial). Rerolling 100-coin star...`);
			await selectNewDaily100Star(client);
			(state as any).daysUntil100CoinReroll = 0;
		} else {
			console.log(`[${new Date().toISOString()}] Keeping current 100-coin star (${state.currentDaily100StarName}). Days until next reroll: ${3 - (state as any).daysUntil100CoinReroll}`);
		}

		await announceDailyStars(client);
	} catch (err) {
		console.error('Error in daily star transition:', err);
	}
}

function scheduleDailyStarSelection() {
	const now = new Date();
	const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
	const delay = nextRun.getTime() - now.getTime();

	console.log(`[${new Date().toISOString()}] Scheduling next daily SM64 star selection in ${Math.round(delay / 1000 / 60)} minutes (at midnight).`);

	setTimeout(() => {
		selectDailySm64Star();
		setInterval(selectDailySm64Star, 24 * 60 * 60 * 1000);
	}, delay);
}

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.ts'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

console.log("Currently registered commands:");
console.log(client.commands);

client.login(process.env.DISCORD_TOKEN);

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	console.log(interaction);
	if (!interaction.isChatInputCommand()) return;
	const command: SlashCommand | undefined = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});
