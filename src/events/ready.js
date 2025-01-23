const { Events } = require('discord.js');
const clickupApiUrl = process.env.DISCKUP_API_URL;
const clientId = process.env.DISCKUP_CLIENT_ID;
const postMessageTriggerPrefix = process.env.DISCKUP_POST_MESSAGE_TRIGGER_PREFIX;
const dbName = process.env.DISCKUP_SQLITE_DATABASE;
const threadTableName = process.env.DISCKUP_SQLITE_THREAD_TABLE_NAME;

const path = require('path');

const { closeConnection, initializeDatabase, openConnection } = require('../database');

const dbFile = path.resolve(__dirname, `../../database/${dbName}.db`);

console.log('\nInitializing\nPlease, wait a moment...');

(async () => {
	try {
		await initializeDatabase();
		console.log('\n[ready.js] Application is ready to use the database!');
	}
	catch (err) {
		console.error('\n[ready.js] Failed to initialize the database:', err.message);
	}
})();

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

		existingThreads.forEach(async thread => {

			let taskId;

			try {
				const db = await openConnection(dbFile);

				const selectTaskIdQuery = `SELECT taskId FROM ${threadTableName} WHERE discordId = ?`;

				db.get(selectTaskIdQuery, [`${thread.id}`], (err, row) => {
					if (err) {
						console.error('\n[ready.js] Error executing select query:', err.message);
						closeConnection(db);
						return;
					}

					if (row !== undefined) taskId = row.taskId;

					closeConnection(db);
				});
			}
			catch (err) {
				console.log('\n[ready.js] Error connecting to database:', err);
			}

			const taskName = thread.name;

			if (taskId === undefined) console.log(`\n[ready.js] Thread '${taskName}' has no related records in database '${dbFile}', so events collected in this thread will be subject to errors.`);

			const threadCollector = thread.createMessageCollector();

			threadCollector.on('collect', async msg => {

				if (msg.author.id !== clientId) {

					const commentCommandRegex = new RegExp(`^${postMessageTriggerPrefix}s*(.+)$`, 'ms');

					if (commentCommandRegex.test(msg.content)) {

						const match = msg.content.match(commentCommandRegex);
						const comment = match[1].trim();
						const discordId = msg.author.id;
						const postCommentRequestUrl = `${clickupApiUrl}/clickup/comment?discordId=${discordId}&taskId=${taskId}`;

						console.log(`\n[ready.js] Posting on ClickUp:\nUser ID: "${discordId}"\nComment: "${comment}"\nTask: "${taskName}"\nRequest URL: "${postCommentRequestUrl}"`);

						let statusCode = 0;

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
							.then(json => console.log(`\n[ready.js] POST /comments response [${statusCode}]:\n${JSON.stringify(json, null, 4)}`));
					}
				}
			});

			threadCollector.on('end', async () => {

				console.log(`\n[ready.js] Finished message collection on thread "${thread.name}"`);

				try {
					const db = await openConnection(dbFile);

					const deleteQuery = `DELETE FROM ${threadTableName} WHERE taskId = '${taskId}'`;

					db.run(deleteQuery, [], (err) => {
						if (err) {
							console.error('\n[ready.js] Error executing delete query:', err.message);
							closeConnection(db);
							return;
						}

						closeConnection(db);
					});
				}
				catch (err) {
					console.log('\n[ready.js] Error connecting to database:', err);
				}
			});
		});

		console.log(`\nReady! Logged in as ${client.user.username}`);
	},
};