# DisckUp

Discord bot intended to perform activities that relate Discord to ClickUp.

## [DEV] Run Application

An `.env` file with the following variables is needed:

| Variable | Value |
|:-:|:-:|
|`DISCKUP_API_URL`|ClickUp Comment Posting API URL which can be obtained by contacting SenseUp.|
|`DISCKUP_CLIENT_TOKEN`|Bot Authentication Token obtainable from the "Bot" section of your Bot at <https://discord.com/developers/applications>|
|`DISCKUP_CLIENT_ID`|Application ID which can be obtained from the "General Information" section of your Bot at <https://discord.com/developers/applications>|
|`DISCKUP_GUILD_ID`|ID of the server where the Bot will operate, which can be obtained by enabling developer mode in Discord and right-clicking on a server.|
|`DISCKUP_POST_MESSAGE_TRIGGER_PREFIX`|Custom prefix to indicate to the Bot which message should be posted on the card.|
|`DISCKUP_SQLITE_DATABASE`|SQLite database name|
|`DISCKUP_SQLITE_THREAD_TABLE_NAME`|Name of the table in the SQLite database. Ensure that the table has the columns `discordId VARCHAR(20)` and `taskId VARCHAR(15)`|

```bash
npm install
npm start
```

## [DEV] Run Application Using Docker

The `.env` file is not required, but remember to update the environment variables in the `disckup_config.yaml` file.

```bash
sudo service docker start
docker build -t disckup:<version> .
docker tag disckup:<version> <docker_username>/disckup:<version>
docker push <docker_username>/disckup:<version>
docker pull <docker_username>/disckup:<version>
docker run disckup:<version>
```

## Slash Commands

| Command | Parameters | Returns |
|:-:|:-:|:-:|
|`/task`|`task-id`|Creates a thread with the task name corresponding to the ID entered as a parameter. This thread is connected to the task in ClickUp. To post a message on the card, simply add the :senseup: emoji before the message text.|
