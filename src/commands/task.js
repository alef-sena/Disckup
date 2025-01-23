require('dotenv').config();
const clickupApiUrl = process.env.DISCKUP_API_URL;
const clientId = process.env.DISCKUP_CLIENT_ID;
const guildId = process.env.DISCKUP_GUILD_ID;
const postMessageTriggerPrefix = process.env.DISCKUP_POST_MESSAGE_TRIGGER_PREFIX;
const dbName = process.env.DISCKUP_SQLITE_DATABASE;
const threadTableName = process.env.DISCKUP_SQLITE_THREAD_TABLE_NAME;

const path = require('path');

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { closeConnection, initializeDatabase, openConnection } = require('../database');

const dbFile = path.resolve(__dirname, `../../database/${dbName}.db`);

(async () => {
	try {
		await initializeDatabase();
		console.log(`\n[task.js] Command is ready to use the database "${dbName}"`);
	}
	catch (err) {
		console.error('\n[task.js] Failed to initialize the database:', err.message);
	}
})();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('task')
		.setDescription('Cria um tópico com o nome de uma tarefa do ClickUp')
		.addStringOption(option =>
			option
				.setName('task-id')
				.setDescription('Task ID')
				.setRequired(true)),

	async execute(interaction) {

		if (!interaction.isChatInputCommand()) return;

		const serverUserName = interaction.member.nickname;

		console.log(`\n[task.js] Command "/${interaction.commandName}" invoker: "${serverUserName}"`);

		const taskId = interaction.options.getString('task-id');
		const discordUserId = interaction.user.id;
		const getTaskRequestUrl = `${clickupApiUrl}/clickup/task?discordId=${encodeURIComponent(discordUserId)}&taskId=${taskId}`;

		let statusCode = 0;

		let taskName;
		let taskUrl;

		await interaction.deferReply({ ephemeral: false });

		await fetch(getTaskRequestUrl, {
			method: 'GET',
		})
			.then(res => {
				console.log(`\n[task.js] Requesting for: ${getTaskRequestUrl}`);
				statusCode = res.status;
				return res.json();
			})
			.then(json => {
				console.log(`\n[task.js] GET /task response [${statusCode}]:\n${JSON.stringify(json, null, 4)}`);
				if (statusCode === 200) {
					taskName = json.taskName;
					taskUrl = json.taskUrl;
				}
			})
			.catch(error => console.log(error));

		const taskEmbed = new EmbedBuilder();

		if (taskName !== undefined) {

			const threadName = `[${taskId}] ${taskName}`.substring(0, 100);

			const existingThreads = [];

			interaction.client.channels.cache.forEach(channel => {
				if (channel.name === threadName) {
					existingThreads.push(channel);
				}
			});

			const existingThread = existingThreads.find(thread => thread.ownerId === clientId);

			if (existingThread === undefined) {

				let thread;

				if (interaction.channel.type === 11) {
					const parentChannel = interaction.guild.channels.cache.get(interaction.channel.parentId);
					thread = await parentChannel.threads.create({
						name: threadName,
						autoArchiveDuration: 10080,
					});
				}

				else if (interaction.channel.type === 0) {
					thread = await interaction.channel.threads.create({
						name: threadName,
						autoArchiveDuration: 10080,
					});
				}

				try {
					const db = await openConnection(dbFile);

					const insertQuery = `INSERT INTO ${threadTableName} (discordId, taskId) VALUES ('${thread.id}', '${taskId}')`;

					db.run(insertQuery, [], (err) => {
						if (err) {
							console.error('\n[task.js] Error executing insert query:', err.message);
							closeConnection(db);
							return;
						}

						closeConnection(db);
					});
				}
				catch (err) {
					console.log('\n[task.js] Error connecting to database:', err);
				}

				taskEmbed
					.setColor('#3BA55C')
					.setTitle(threadName)
					.setURL(taskUrl)
					.setDescription(`**${serverUserName}** me pediu para criar um tópico para a tarefa **${threadName}**`);

				thread.send(`**Acesse a tarefa através deste link: ${taskUrl}**`).then((msg) => msg.pin());

				const threadCollector = thread.createMessageCollector();

				threadCollector.on('collect', async msg => {

					if (msg.author.id !== clientId) {

						const commentCommandRegex = new RegExp(`^${postMessageTriggerPrefix}s*(.+)$`, 'ms');

						if (commentCommandRegex.test(msg.content)) {

							const match = msg.content.match(commentCommandRegex);
							const comment = match[1].trim();
							const postCommentRequestUrl = `${clickupApiUrl}/clickup/comment?discordId=${msg.author.id}&taskId=${taskId}`;

							console.log(`\n[task.js] Posting on ClickUp:\nDiscord User ID: "${msg.author.id}"\nComment: "${comment}"\nTask: "${thread.name}"\nRequest URL: "${postCommentRequestUrl}"`);

							await fetch(postCommentRequestUrl, {
								method: 'POST',
								body: JSON.stringify({
									comment,
									attachments: msg.attachments,
								}),
								headers: { 'Content-Type': 'application/json' },
							})
								.then(res => {
									statusCode = res.status;
									return res.json();
								})
								.then(json => console.log(`\n[task.js] POST /comments response [${statusCode}]:\n${JSON.stringify(json, null, 4)}`));
						}
					}
				});

				threadCollector.on('end', async () => {

					console.log(`\n[task.js] Finished message collection on thread "${thread.name}"`);

					try {
						const db = await openConnection(dbFile);

						const deleteQuery = `DELETE FROM ${threadTableName} WHERE taskId = '${taskId}'`;

						db.run(deleteQuery, [], (err) => {
							if (err) {
								console.error('\n[task.js] Error executing delete query:', err.message);
								closeConnection(db);
								return;
							}

							closeConnection(db);
						});
					}
					catch (err) {
						console.log('\n[task.js] Error connecting to database:', err);
					}
				});
			}

			else {

				console.log(`\n[task.js] The thread "${threadName}" already exists.`);

				const threadId = existingThread.id;
				const threadUrl = `https://discord.com/channels/${guildId}/${threadId}`;

				taskEmbed
					.setColor('Blurple')
					.setTitle(threadName)
					.setURL(threadUrl)
					.setDescription(`**${serverUserName}** Eu já criei um tópico para esta tarefa bem aqui ${threadUrl} :v:`);
			}
		}

		const replyOptions = {};

		if (JSON.stringify(taskEmbed) === '{}' || Object.keys(taskEmbed).length === 0) {
			taskEmbed
				.setColor('#ED4245')
				.setDescription(`Ei **${serverUserName}**, não consegui encontrar uma tarefa com o **ID: "${taskId}"** :sweat:`);

			console.log(`\n[task.js] Failed to create a thread\nDiscord User ID: "${discordUserId}"\nTask ID: "${taskId}"`);

			replyOptions.embeds = [taskEmbed];
		}
		else {
			replyOptions.embeds = [taskEmbed];
		}

		await interaction.editReply(replyOptions);
	},
};
