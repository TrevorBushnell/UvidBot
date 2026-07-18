import dotenv from 'dotenv'
dotenv.config()

import { Client, Collection, Events, Interaction, GatewayIntentBits, MessageFlags, CommandInteraction } from 'discord.js';
import { SlashCommand } from './types';

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



function getMsUntilNext947(): number {
	const now = new Date();
	const target = new Date();
	target.setUTCHours(9, 47, 0, 0);

	// If it's already past 9:47 UTC today, schedule it for tomorrow
	if (now.getTime() >= target.getTime()) {
		target.setUTCDate(target.getUTCDate() + 1);
	}

	return target.getTime() - now.getTime();
}

async function checkAndTimeoutFriends() {
	console.log(`[${new Date().toISOString()}] Running daily check for frobuddyharry and calebap...`);
	const friends = ['frobuddyharry', 'calebap'];
	
	try {
		const guilds = await client.guilds.fetch();
		for (const [guildId, oauth2Guild] of guilds) {
			try {
				const guild = await oauth2Guild.fetch();
				const voiceStates = guild.voiceStates.cache;
				
				for (const [memberId, voiceState] of voiceStates) {
					if (voiceState.channelId) {
						const member = voiceState.member || await guild.members.fetch(memberId).catch(() => null);
						if (member && member.user) {
							const username = member.user.username;
							if (friends.includes(username)) {
								console.log(`Found ${username} in voice channel ${voiceState.channelId} in guild ${guild.name}. Timing out...`);
								// 6 hours in milliseconds: 6 * 60 * 60 * 1000 = 21600000
								await member.timeout(21600000, 'Bad sleep schedule / staying up too late');
								console.log(`Successfully timed out ${username} for 6 hours.`);
							}
						}
					}
				}
			} catch (guildError) {
				console.error(`Error checking guild ${oauth2Guild.name}:`, guildError);
			}
		}
	} catch (err) {
		console.error('Error during scheduled sleep schedule check:', err);
	}

	// Schedule the next check
	scheduleNextCheck();
}

function scheduleNextCheck() {
	const msUntilNext = getMsUntilNext947();
	console.log(`Next sleep schedule check in ${msUntilNext} ms (approx ${(msUntilNext / 1000 / 60 / 60).toFixed(2)} hours)`);
	setTimeout(checkAndTimeoutFriends, msUntilNext);
}

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	scheduleNextCheck();
});

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