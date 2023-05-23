# DisckUp

Discord bot intended to perform activities that relate Discord to ClickUp.

## [DEV] Run Application

An `.env` file with the following variables is needed:

| Variable | Value |
|:-:|:-:|
|`CLIENT_TOKEN`|Bot Authentication Token obtainable from the "Bot" section of your Bot at <https://discord.com/developers/applications>|
|`CLIENT_ID`|Application ID which can be obtained from the "General Information" section of your Bot at <https://discord.com/developers/applications>|
|`GUILD_ID`|ID of the server where the Bot will operate, which can be obtained by enabling developer mode in Discord and right-clicking on a server.|
|`CLICKUP_API_URL`|ClickUp Comment Posting API URL which can be obtained by contacting SenseUp.|

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
|`/task`|`task-id`|Creates a thread with the task name corresponding to the ID entered as a parameter. Each message sent in the thread will also be posted on the corresponding task card in ClickUp (differing by member).|
