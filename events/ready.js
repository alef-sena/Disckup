const { Events } = require('discord.js');
const clickupApiUrl = process.env.CLICKUP_API_URL;
const clientId = process.env.CLIENT_ID;

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {

		console.log('\nRecovering threads created by "/task"...');

		const existingThreads = [];

		client.channels.cache.forEach(channel => {
			if (channel.type === 11 && channel.ownerId === clientId) {
				existingThreads.push(channel);
			}
		});

		console.log(`Threads recovered: ${existingThreads.length}`);

		existingThreads.forEach(thread => {

			const taskId = thread.name.split('[')[1].split(']')[0];
			const requestUrl = `${clickupApiUrl}?task_id=${taskId}`;

			const threadCollector = thread.createMessageCollector();

			threadCollector.on('collect', async msg => {

				if (!(msg.author.id === clientId)) {
					console.log(`\nPosting on ClickUp:\nAuthor: "${msg.author.tag}"\nComment: "${msg.content}"\nTask: "${thread.name}"`);
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
		});

		console.log(`\nReady! Logged in as ${client.user.username}`);
	},
};