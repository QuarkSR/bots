// imports
const TwitchClient = require('twitch').default;
const ChatClient = require('twitch-chat-client').default;

const util = require('./util');
const fs = require('fs-extra');

// setup
(async() =>
{
	const tokenData = JSON.parse(await fs.readFile('./tokens.json'));

	// Auto-refresh token data
	const twitchClient = await TwitchClient.withCredentials(tokenData.clientId, tokenData.accessToken, undefined,
									{
										clientSecret: tokenData.clientSecret,
										refreshToken: tokenData.refreshToken,
										expiry: tokenData.expiryTimestamp === null ? null: new Date(tokenData.expiryTimestamp),
										onRefresh: async ({accessToken, refreshToken, expiryDate}) =>
										{
											const newTokenData =
											{
												accessToken,
												refreshToken,
												expiryTimestamp: expiryDate === null ? null : expiryDate.getTime()
											};
											await fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 4), 'UTF-8')
										}
									});
	// channels OpenHydrate will be in
	var botChannels = ['zziegler', 'openhydrate', 'captainsarlo'];
	var lastMsgTime = new Date(0);
	var color = true;

	const chatClient = await ChatClient.forTwitchClient(twitchClient, {channels: botChannels});
	await chatClient.connect();
	console.log(`${(new Date()).toTimeString()}: [+] Connected.`);

	// on each message
	chatClient.onPrivmsg((channel, user, message) =>
	{
		(async() =>
		{
			if (message === '!ping')
			{
				chatClient.say(channel, 'Pong!');
			}

			if (message === '!color' || message === '!colour')
			{
				color = true;
				console.log(`${(new Date()).toTimeString()}: [D] color set to ${color}.`);
				chatClient.say(channel, `color has been set to ${color}.`);
			}

			if (message === '!nocolor' || message === '!nocolour')
			{
				color = false;
				console.log(`${(new Date()).toTimeString()}: [D] color set to ${color}.`);
				chatClient.say(channel, `color has been set to ${color}.`);
			}

			// channel has a leading # character so we slice to just get the username
			var uptime = await util.getUptimeInMinutes(twitchClient, channel.slice(1));
			var uptimeHours = Math.floor(uptime / 60);
			var lastSendTime = util.checkLastSendTime(lastMsgTime);

			console.log(`${(new Date()).toTimeString()}: [D] Time since last message: ${lastSendTime} minutes`);

			var baseOz = 4;
			var baseMl = 120;

			// if we directly ask for hydrate, or automatically every hour (but only if the streamer has been live >= 1 hour and the last message sent by the bot >= 1 hour ago)
			if (message === '!hydrate' || (uptimeHours > 1 && lastSendTime >= 59))
			{
				lastMsgTime = new Date();
				if (color)
				{
					chatClient.action(channel, `You've been live for just over ${uptimeHours} hours. By this point in your broadcast, you should have consumed ${baseOz * uptimeHours}oz (${baseMl * uptimeHours}ml) of water to maintain optimal hydration.`);
				}
				else
				{
					chatClient.say(channel, `You've been live for just over ${uptimeHours} hours. By this point in your broadcast, you should have consumed ${baseOz * uptimeHours}oz (${baseMl * uptimeHours}ml) of water to maintain optimal hydration.`);
				}
			}
		})();
	});
})();
