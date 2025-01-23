const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
require('dotenv').config();
const clientId = process.env.DISCKUP_CLIENT_ID;
const guildId = process.env.DISCKUP_GUILD_ID;
const token = process.env.DISCKUP_CLIENT_TOKEN;
const path = require('path');

const commands = [];
// const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(path.join(__dirname, 'commands', file));
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`\nSuccessfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}
})();