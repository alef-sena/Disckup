const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const clickupApiUrl = process.env.CLICKUP_API_URL;
const clientId = process.env.CLIENT_ID;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('task')
		.setDescription('Cria um tópico com o nome de uma tarefa do ClickUp e posta as mensagens enviadas nele')
		.addStringOption(option =>
			option
				.setName('task-id')
				.setDescription('Task ID')
				.setRequired(true)),

	async execute(interaction) {

		if (!interaction.isChatInputCommand()) return;

		const serverUsername = interaction.member.nickname;
		const userTag = interaction.user.tag;
		const taskId = interaction.options.getString('task-id');
		const requestUrl = `${clickupApiUrl}?username=${encodeURIComponent(userTag)}&task_id=${taskId}`;

		console.log(`\nCommand "/${interaction.commandName}" invoker: "${serverUsername}"`);

		let responseStatus;

		let taskName;
		let taskUrl;

		await interaction.deferReply({ ephemeral: false });

		await fetch(requestUrl, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		})
			.then(res => {
				console.log(`\nRequesting for: ${requestUrl}`);
				responseStatus = res.status;
				return res.json();
			})
			.then(json => {
				console.log(`\nGET /comments response:\n${JSON.stringify(json, null, 4)}`);
				if (responseStatus === 200) {
					taskName = json.name;
					taskUrl = json.url;
				}
			})
			.catch(error => console.log(error));

		const taskEmbed = new EmbedBuilder();

		if (taskName !== undefined) {

			const threadName = `[${taskId}] ${taskName}`.substring(0, 100);

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

			taskEmbed
				.setColor('#3BA55C')
				.setTitle(threadName)
				.setURL(taskUrl)
				.setDescription(`**${serverUsername}** me pediu para criar um tópico para a tarefa **[${taskId}] ${taskName}**`);

			thread.send(`**Acesse a tarefa através deste link: ${taskUrl}**`);

			const threadCollector = thread.createMessageCollector();

			threadCollector.on('collect', async msg => {

				if (!(msg.author.id === clientId)) {
					console.log(`\nPosting on ClickUp:\nAuthor: "${msg.author.tag}"\nComment: "${msg.content}"\nTask: "[${taskId}] ${taskName}"`);
					await fetch(requestUrl, {
						method: 'POST',
						body: JSON.stringify({
							username: msg.author.tag,
							comment: msg.content,
							attachments: msg.attachments,
						}),
						headers: { 'Content-Type': 'application/json' },
					})
						.then(res => res.json())
						.then(json => console.log(`\nPOST /comments response:\n${JSON.stringify(json, null, 4)}`));
				}
			});

			threadCollector.on('end', () => console.log(`\nFinished message collection on thread "${thread.name}"`));
		}

		const replyOptions = {};

		if (JSON.stringify(taskEmbed) === '{}' || Object.keys(taskEmbed).length === 0) {
			taskEmbed
				.setColor('#ED4245')
				.setDescription(`Ei **${serverUsername}**, não consegui encontrar uma tarefa com o **ID: "${taskId}"** :sweat:`);

			console.log(`\nFailed to create a thread\nAuthor: "${userTag}"\nTask ID: "${taskId}"`);

			replyOptions.embeds = [taskEmbed];
		}
		else {
			replyOptions.embeds = [taskEmbed];
		}

		await interaction.editReply(replyOptions);
	},
};